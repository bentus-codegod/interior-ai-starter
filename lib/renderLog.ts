import "server-only";
import { env } from "@/lib/env";
import { getSupabase } from "@/lib/supabase";

// Kosten-Protokoll: jeder Render-Versuch wird mit Anbieter, Dauer, Erfolg
// und geschätzten Kosten festgehalten. Daraus entsteht die echte
// Kostenrechnung (Tabelle render_events, Tagesübersicht render_costs_daily).
// Bewusst OHNE Fotos und OHNE IP-Adressen.

export type RenderEvent = {
  provider: string;
  lookId?: string;
  success: boolean;
  durationMs: number;
  error?: string;
};

// Kosten eines Renders. Der Mock kostet nichts. Für echte Anbieter ist es
// vorerst der Schätzwert AI_COST_PER_RENDER_EUR — bei ComfyUI/RunPod lässt
// er sich später aus durationMs × GPU-Preis pro Sekunde ersetzen.
export function renderCostEur(provider: string): number {
  return provider === "mock" ? 0 : env.costPerRenderEur;
}

export async function logRenderEvent(e: RenderEvent): Promise<void> {
  const costEur = e.success ? renderCostEur(e.provider) : 0;
  const line = {
    provider: e.provider,
    look_id: e.lookId ?? null,
    success: e.success,
    duration_ms: Math.round(e.durationMs),
    cost_eur: costEur,
    error: e.error ? e.error.slice(0, 300) : null,
  };

  // Immer auch ins Server-Log (Vercel-Logs), falls keine DB da ist.
  console.log("render_event", JSON.stringify(line));

  const db = getSupabase();
  if (!db) return;
  const { error } = await db.from("render_events").insert(line);
  // Das Protokoll darf einen Render nie scheitern lassen.
  if (error) console.error("render_event nicht gespeichert:", error.message);
}

// Heutige Ausgaben laut Datenbank (UTC-Tag), oder null ohne DB / bei Fehler.
// So gilt die Kostenbremse über alle Server-Instanzen hinweg.
export async function spentTodayEur(): Promise<number | null> {
  const db = getSupabase();
  if (!db) return null;
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { data, error } = await db
    .from("render_events")
    .select("cost_eur")
    .gte("created_at", startOfDay.toISOString())
    .gt("cost_eur", 0);
  if (error || !data) return null;
  return data.reduce((sum, r) => sum + Number(r.cost_eur), 0);
}
