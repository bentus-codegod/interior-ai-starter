import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const ACTIONS = new Set(["like", "dislike", "swap_in", "swap_out"]);
const SAFE = /^[A-Za-z0-9-]{1,64}$/;

// Anonyme Swipe-Statistik: welche Stücke gefallen, welche fliegen raus.
// Grundlage für ein späteres Stilprofil und für die Sortimentspflege
// (View product_feedback). Kein Cookie, keine Nutzer-ID, keine IP.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await checkRateLimit(ip, 300, 60 * 60 * 1000, "events"))) {
    return new NextResponse(null, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const events = Array.isArray(body?.events) ? body.events.slice(0, 20) : [];
  const rows = events
    .filter(
      (e: unknown): e is { lookId: string; sku: string; action: string } =>
        typeof e === "object" && e !== null &&
        SAFE.test(String((e as Record<string, unknown>).lookId)) &&
        SAFE.test(String((e as Record<string, unknown>).sku)) &&
        ACTIONS.has(String((e as Record<string, unknown>).action))
    )
    .map((e: { lookId: string; sku: string; action: string }) => ({
      look_id: e.lookId, sku: e.sku, action: e.action,
    }));

  const db = getSupabase();
  if (db && rows.length > 0) {
    const { error } = await db.from("swipe_events").insert(rows);
    if (error) console.error("swipe_events nicht gespeichert:", error.message);
  }
  return new NextResponse(null, { status: 204 });
}
