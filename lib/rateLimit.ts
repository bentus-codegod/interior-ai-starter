import { env } from "@/lib/env";
import { renderCostEur, spentTodayEur } from "@/lib/renderLog";

// -------------------------------------------------------------------
// ACHTUNG: Diese Limiter halten ihren Zustand nur IM ARBEITSSPEICHER.
// Für den Prototyp reicht das. In Produktion brauchst du einen
// geteilten Speicher (z. B. Upstash Redis), sonst zählt jeder
// Server-Neustart und jede Instanz neu. Das ist ein Phase-E-Thema.
// -------------------------------------------------------------------

const hits = new Map<string, number[]>();

// Max. Anfragen pro IP im Zeitfenster.
export function checkRateLimit(
  ip: string,
  max = 10,
  windowMs = 60 * 60 * 1000
): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(ip, recent);
    return false; // Limit erreicht
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

// Harte Tages-Kostenbremse: verhindert, dass ein Missbraucher dich
// über die Modellkosten ruiniert. Mit Supabase zählt die Summe aus
// render_events (gilt für alle Server-Instanzen); ohne DB der Zähler im
// Arbeitsspeicher als Notlösung.
let spentEur = 0;
let spendDay = new Date().toDateString();

function resetIfNewDay() {
  const today = new Date().toDateString();
  if (today !== spendDay) {
    spentEur = 0;
    spendDay = today;
  }
}

export async function checkCostCap(): Promise<{ ok: boolean; remainingEur: number }> {
  resetIfNewDay();
  const spent = (await spentTodayEur()) ?? spentEur;
  const next = spent + renderCostEur(env.aiProvider);
  if (next > env.dailyCostCapEur) {
    return { ok: false, remainingEur: Math.max(0, env.dailyCostCapEur - spent) };
  }
  return { ok: true, remainingEur: env.dailyCostCapEur - next };
}

// Zähler im Arbeitsspeicher (Fallback ohne DB). Der Mock kostet nichts.
export function recordSpend(provider: string): void {
  resetIfNewDay();
  spentEur += renderCostEur(provider);
}
