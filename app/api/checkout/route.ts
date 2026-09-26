import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { env, hasStripe } from "@/lib/env";
import { resolveItems, formatEur } from "@/lib/catalog";

export const runtime = "nodejs";

// Zahlungen laufen ausschließlich über Stripes gehostetes Checkout.
// Wir erzeugen serverseitig eine Session und leiten den Nutzer dorthin
// um. Kartendaten fassen wir NIE an — das ist Stripes Verantwortung.
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

    const body = await req.json().catch(() => null);
    const skus = (body?.skus ?? []) as unknown;
    if (!Array.isArray(skus) || skus.length === 0) {
      return NextResponse.json({ error: "Warenkorb ist leer." }, { status: 400 });
    }

    // Preise IMMER serverseitig aus dem Katalog — nie aus dem Browser.
    // So kann niemand den Preis im Frontend manipulieren.
    const items = resolveItems(skus.map(String));
    if (items.length === 0) {
      return NextResponse.json({ error: "Keine gültigen Artikel." }, { status: 400 });
    }

    const stripe = new Stripe(env.stripeSecret);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((p) => ({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: p.priceCents,
          product_data: {
            name: p.name,
            description: `${p.category} · ${p.dimensions}`,
          },
        },
      })),
      success_url: `${env.baseUrl}/success`,
      cancel_url: `${env.baseUrl}/cancel`,
    });

    // Kleiner Log fürs Prototyping — enthält keine Kartendaten.
    console.log(
      `Checkout-Session für ${items.length} Artikel, Summe ${formatEur(
        items.reduce((s, p) => s + p.priceCents, 0)
      )}`
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
