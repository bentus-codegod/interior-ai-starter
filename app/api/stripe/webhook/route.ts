import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { markOrderPaid, setOrderStatus } from "@/lib/orders";

export const runtime = "nodejs";

// Stripe meldet hier, was mit einer Checkout-Session passiert ist.
// Einrichten: Stripe-Dashboard -> Developers -> Webhooks -> Endpoint
//   URL:    https://DEINE-DOMAIN/api/stripe/webhook
//   Events: checkout.session.completed,
//           checkout.session.async_payment_succeeded,
//           checkout.session.async_payment_failed,
//           checkout.session.expired
// Das angezeigte Signing Secret ("whsec_...") kommt in STRIPE_WEBHOOK_SECRET.
// Lokal testen: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
export async function POST(req: NextRequest) {
  if (!env.stripeSecret || !env.stripeWebhookSecret) {
    return NextResponse.json({ error: "Webhook nicht konfiguriert." }, { status: 503 });
  }

  // Die Signatur beweist, dass die Nachricht wirklich von Stripe kommt.
  // Dafür braucht es den unveränderten Roh-Text des Requests.
  const signature = req.headers.get("stripe-signature");
  const payload = await req.text();
  if (!signature) {
    return NextResponse.json({ error: "Signatur fehlt." }, { status: 400 });
  }

  const stripe = new Stripe(env.stripeSecret);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, env.stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        // Bei verzögerten Zahlarten (z. B. SEPA) kommt "completed" vor dem Geld.
        if (session.payment_status === "paid") await markOrderPaid(session);
        break;
      }
      case "checkout.session.async_payment_failed":
        await setOrderStatus(event.data.object.id, "cancelled");
        break;
      case "checkout.session.expired":
        await setOrderStatus(event.data.object.id, "expired");
        break;
      default:
        // Andere Ereignisse ignorieren wir bewusst.
        break;
    }
  } catch (err) {
    // 500 -> Stripe versucht es später automatisch erneut.
    console.error("stripe webhook error:", err);
    return NextResponse.json({ error: "Verarbeitung fehlgeschlagen." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
