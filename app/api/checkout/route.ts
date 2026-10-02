import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { env, hasStripe } from "@/lib/env";
import { formatEur, itemsTotalCents } from "@/lib/catalog";
import { resolveItems } from "@/lib/productRepo";
import { createPendingOrder } from "@/lib/orders";

export const runtime = "nodejs";

// Zahlungen laufen ausschließlich über Stripes gehostetes Checkout.
// Wir erzeugen serverseitig eine Session und leiten den Nutzer dorthin
// um. Kartendaten fassen wir NIE an — das ist Stripes Verantwortung.
//
// Ablauf einer Bestellung:
//   1. hier: Session anlegen + Bestellung "pending" speichern
//   2. Kunde zahlt bei Stripe (inkl. Lieferadresse)
//   3. app/api/stripe/webhook: Stripe meldet die Zahlung -> "paid"
export async function POST(req: NextRequest) {
  try {
    if (!hasStripe()) {
      return NextResponse.json(
        {
          error:
            "Stripe ist nicht konfiguriert. Trage STRIPE_SECRET_KEY (Test-Modus) in .env.local ein.",
        },
        { status: 503 }
      );
    }

    // Erwartet { items: [{ sku, quantity }] } — ganzer Look oder ein
    // einzelnes Stück. Alte Form { skus: [...] } (je 1 Stück) geht weiter.
    const body = await req.json().catch(() => null);
    const raw: unknown = body?.items ?? body?.skus ?? [];
    if (!Array.isArray(raw) || raw.length === 0 || raw.length > 50) {
      return NextResponse.json({ error: "Warenkorb ist leer." }, { status: 400 });
    }
    const lines = raw.map((x) =>
      typeof x === "object" && x !== null
        ? { sku: String((x as { sku?: unknown }).sku), quantity: Number((x as { quantity?: unknown }).quantity ?? 1) }
        : { sku: String(x), quantity: 1 }
    );

    // Preise IMMER serverseitig aus dem Katalog — nie aus dem Browser.
    // So kann niemand den Preis im Frontend manipulieren.
    const items = await resolveItems(lines);
    if (items.length === 0) {
      return NextResponse.json({ error: "Keine gültigen Artikel." }, { status: 400 });
    }

    const stripe = new Stripe(env.stripeSecret);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map(({ product: p, quantity }) => ({
        quantity,
        price_data: {
          currency: "eur",
          unit_amount: p.priceCents,
          product_data: {
            name: p.name,
            description: `${p.category} · ${p.dimensions}`,
            metadata: { sku: p.sku },
          },
        },
      })),
      // Lieferadresse direkt bei Stripe abfragen (für den Versand).
      shipping_address_collection: { allowed_countries: ["DE", "AT", "CH"] },
      success_url: `${env.baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.baseUrl}/cancel`,
    });

    const totalCents = itemsTotalCents(items);

    // Erst speichern, dann weiterleiten: lieber kein Checkout als eine
    // Zahlung ohne Bestellung in der Datenbank.
    await createPendingOrder({
      stripeSessionId: session.id,
      items,
      amountTotalCents: totalCents,
    });

    // Kleiner Log fürs Prototyping — enthält keine Kartendaten.
    console.log(
      `Checkout-Session für ${items.length} Artikel, Summe ${formatEur(totalCents)}`
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout error:", err);
    return NextResponse.json(
      { error: "Checkout fehlgeschlagen. Bitte erneut versuchen." },
      { status: 500 }
    );
  }
}
