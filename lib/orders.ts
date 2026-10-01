import "server-only";
import type Stripe from "stripe";
import { getSupabase } from "@/lib/supabase";
import type { RoomItem } from "@/lib/catalog";

// Bestellungen: angelegt beim Checkout (Status "pending"), auf "paid"
// gesetzt vom Stripe-Webhook. Ohne Datenbank wird nur geloggt — dann gibt
// es keine Bestellverwaltung, der Prototyp funktioniert aber weiter.

export type OrderStatus =
  | "pending"
  | "paid"
  | "expired"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export async function createPendingOrder(input: {
  stripeSessionId: string;
  items: RoomItem[];
  amountTotalCents: number;
}): Promise<void> {
  const db = getSupabase();
  if (!db) {
    console.log(`Bestellung angelegt (ohne DB): ${input.stripeSessionId}`);
    return;
  }

  const { data: order, error } = await db
    .from("orders")
    .insert({
      stripe_session_id: input.stripeSessionId,
      status: "pending",
      amount_total_cents: input.amountTotalCents,
      currency: "eur",
    })
    .select("id")
    .single();
  if (error || !order) {
    throw new Error(`Bestellung konnte nicht gespeichert werden: ${error?.message}`);
  }

  const { error: itemsError } = await db.from("order_items").insert(
    input.items.map(({ product, quantity }) => ({
      order_id: order.id,
      sku: product.sku,
      name: product.name,
      unit_price_cents: product.priceCents,
      quantity,
    }))
  );
  if (itemsError) {
    // Keine halbe Bestellung zurücklassen.
    await db.from("orders").delete().eq("id", order.id);
    throw new Error(`Bestellpositionen nicht gespeichert: ${itemsError.message}`);
  }
}

// Vom Webhook aufgerufen, wenn Stripe die Zahlung bestätigt. Idempotent:
// Stripe darf dasselbe Ereignis mehrfach schicken.
export async function markOrderPaid(session: Stripe.Checkout.Session): Promise<void> {
  const db = getSupabase();
  if (!db) {
    console.log(`Bestellung bezahlt (ohne DB): ${session.id}`);
    return;
  }
  const shipping = session.collected_information?.shipping_details ?? null;
  const { data: updated, error } = await db
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      amount_total_cents: session.amount_total ?? undefined,
      customer_email: session.customer_details?.email ?? null,
      customer_name: shipping?.name ?? session.customer_details?.name ?? null,
      shipping_address: shipping?.address ?? null,
    })
    .eq("stripe_session_id", session.id)
    .eq("status", "pending")
    .select("id");
  if (error) throw new Error(`Bestellung nicht aktualisiert: ${error.message}`);
  if (updated && updated.length > 0) return;

  // Nichts aktualisiert: Entweder kam das Ereignis doppelt (Bestellung ist
  // schon bezahlt) — dann ist alles gut. Oder es gibt zu dieser Zahlung gar
  // keine Bestellung — dann Fehler werfen, damit Stripe es erneut versucht
  // und der Fall im Log/Stripe-Dashboard sichtbar wird statt verloren geht.
  const { data: existing } = await db
    .from("orders")
    .select("status")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (!existing || existing.status === "expired" || existing.status === "cancelled") {
    throw new Error(
      `Zahlung ${session.id} ohne passende offene Bestellung (Status: ${existing?.status ?? "fehlt"})`
    );
  }
}

export async function setOrderStatus(
  stripeSessionId: string,
  status: OrderStatus,
  onlyIfStatus: OrderStatus = "pending"
): Promise<void> {
  const db = getSupabase();
  if (!db) {
    console.log(`Bestellung ${status} (ohne DB): ${stripeSessionId}`);
    return;
  }
  const { error } = await db
    .from("orders")
    .update({ status })
    .eq("stripe_session_id", stripeSessionId)
    .eq("status", onlyIfStatus);
  if (error) throw new Error(`Bestellstatus nicht gesetzt: ${error.message}`);
}

// Für die Erfolgsseite: nur Status und Summe, keine persönlichen Daten.
export async function getOrderSummary(
  stripeSessionId: string
): Promise<{ status: OrderStatus; amountTotalCents: number; itemCount: number } | null> {
  const db = getSupabase();
  if (!db) return null;
  const { data } = await db
    .from("orders")
    .select("status, amount_total_cents, order_items(quantity)")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();
  if (!data) return null;
  const lines = (data.order_items ?? []) as { quantity: number }[];
  return {
    status: data.status as OrderStatus,
    amountTotalCents: data.amount_total_cents,
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
  };
}
