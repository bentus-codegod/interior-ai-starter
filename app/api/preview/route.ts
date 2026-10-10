import { NextRequest, NextResponse } from "next/server";
import { getLook } from "@/lib/catalog";
import { composeRoom } from "@/lib/designBrain";
import { getProducts } from "@/lib/productRepo";
import { splitBudget } from "@/lib/budget";
import { env } from "@/lib/env";

export const runtime = "nodejs";

// Vorschau eines Looks OHNE KI-Bild: welche Produkte das Design-Hirn für
// Look und Budget wählen würde. Kostet nichts (kein Modell-Aufruf) und
// dient als Vorschau, bevor ein Foto da ist.
//   GET /api/preview?look=warm-minimal&budget=300000  (Budget in Cent)
export async function GET(req: NextRequest) {
  const look = getLook(req.nextUrl.searchParams.get("look") ?? "");
  if (!look) {
    return NextResponse.json({ error: "Unbekannter Look." }, { status: 400 });
  }
  const raw = Number(req.nextUrl.searchParams.get("budget") ?? 0);
  const budgetCents = Number.isFinite(raw) && raw > 0 ? Math.min(Math.round(raw), 10_000_000) : 0;

  const catalog = await getProducts();
  const budget = splitBudget(budgetCents, env.logisticsShare);
  const { items, subtotalCents } = composeRoom(catalog, look, budget.furnitureBudgetCents);
  return NextResponse.json(
    { items, subtotalCents, budget },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}
