import { NextRequest, NextResponse } from "next/server";
import { resolveItems } from "@/lib/productRepo";
import { checkRateLimit } from "@/lib/rateLimit";
import { freightLinesFor, staticRateProvider } from "@/lib/sourcing/container";

export const runtime = "nodejs";

// Fracht-/Container-Schätzung für einen Warenkorb:
//   POST { items: [{ sku, quantity }] }
//   -> Volumen, Container je Herkunftsland, Frachtkosten (Platzhalter-Raten)
// Grundlage für die Logistik-Kosten der Budget-Komplettausstattung, sobald
// echte Lieferanten (Herkunft, Packmaße) und Spediteur-Raten da sind.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await checkRateLimit(ip, 60, 60 * 60 * 1000, "logistics"))) {
    return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const raw: unknown = body?.items;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 200) {
    return NextResponse.json({ error: "items fehlt." }, { status: 400 });
  }
  try {
    const items = await resolveItems(
      raw.map((x) => ({
        sku: String((x as { sku?: unknown })?.sku ?? ""),
        quantity: Number((x as { quantity?: unknown })?.quantity ?? 1),
      }))
    );
    if (items.length === 0) {
      return NextResponse.json({ error: "Keine gültigen Artikel." }, { status: 400 });
    }
    const plan = await staticRateProvider.quote(freightLinesFor(items));
    return NextResponse.json({ provider: staticRateProvider.name, plan });
  } catch (err) {
    console.error("logistics estimate error:", err);
    return NextResponse.json({ error: "Schätzung fehlgeschlagen." }, { status: 500 });
  }
}
