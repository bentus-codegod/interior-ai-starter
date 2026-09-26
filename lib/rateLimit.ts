import { env } from "@/lib/env";

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
// über die Modellkosten ruiniert.
let spentEur = 0;
let spendDay = new Date().toDateString();

export function checkCostCap(): { ok: boolean; remainingEur: number } {
  const today = new Date().toDateString();
  if (today !== spendDay) {
    spentEur = 0;
    spendDay = today;
  }
  const next = spentEur + env.costPerRenderEur;
  if (next > env.dailyCostCapEur) {
    return { ok: false, remainingEur: Math.max(0, env.dailyCostCapEur - spentEur) };
  }
  return { ok: true, remainingEur: env.dailyCostCapEur - next };
}

export function recordSpend(): void {
  spentEur += env.costPerRenderEur;
}
