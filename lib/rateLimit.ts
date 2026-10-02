import { env } from "@/lib/env";
import { renderCostEur, spentTodayEur } from "@/lib/renderLog";

import { createHash } from "node:crypto";

// -------------------------------------------------------------------
// Rate-Limit pro IP:
//   * mit UPSTASH_REDIS_REST_URL/_TOKEN -> Zähler in Upstash Redis, gilt
//     für alle Server-Instanzen (Vercel startet viele parallel)
//   * sonst -> Zähler im Arbeitsspeicher (reicht lokal und im Prototyp,
//     zählt aber pro Instanz und nach jedem Neustart neu)
// Die IP wird nur gehasht und nur für die Dauer des Zeitfensters gehalten.
// -------------------------------------------------------------------

const hits = new Map<string, number[]>();

// Max. Anfragen pro IP im Zeitfenster.
// `bucket` trennt die Zähler je Endpunkt (Render vs. Statistik).
export async function checkRateLimit(
  ip: string,
  max = 10,
  windowMs = 60 * 60 * 1000,
  bucket = "render"
): Promise<boolean> {
  if (env.upstashUrl && env.upstashToken) {
    const viaRedis = await checkRateLimitUpstash(`${bucket}:${ip}`, max, windowMs);
    if (viaRedis !== null) return viaRedis;
    // Upstash nicht erreichbar -> lieber lokal weiterzählen als ausfallen.
  }
  return checkRateLimitMemory(`${bucket}:${ip}`, max, windowMs);
}

// Festes Zeitfenster: INCR auf einen Schlüssel pro IP und Fenster.
async function checkRateLimitUpstash(
  bucketAndIp: string,
  max: number,
  windowMs: number
): Promise<boolean | null> {
  const window = Math.floor(Date.now() / windowMs);
  const ipHash = createHash("sha256").update(bucketAndIp).digest("hex").slice(0, 32);
  const key = `rl:${ipHash}:${window}`;
  try {
    const res = await fetch(`${env.upstashUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.upstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(Math.ceil(windowMs / 1000))],
      ]),
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: number }[];
    const count = Number(data?.[0]?.result);
    return Number.isFinite(count) ? count <= max : null;
  } catch {
    return null;
  }
}

function checkRateLimitMemory(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  // Speicher begrenzen: abgelaufene Einträge gelegentlich wegräumen.
  if (hits.size > 10_000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false; // Limit erreicht
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

// Harte Tages-Kostenbremse: verhindert, dass ein Missbraucher dich
// über die Modellkosten ruiniert. Mit Supabase zählt die Summe aus
// render_events (gilt für alle Server-Instanzen); ohne DB der Zähler im
// Arbeitsspeicher als Notlösung.
//
// Renders dauern bis zu 2 Minuten. Damit parallele Anfragen die Bremse
// nicht gemeinsam überholen, wird der Betrag VOR dem Render reserviert
// (inFlightEur) und erst nach dem Protokollieren wieder freigegeben.
// Grenze: Die Reservierung gilt pro Server-Instanz.
let spentEur = 0;
let inFlightEur = 0;
let spendDay = new Date().toDateString();

function resetIfNewDay() {
  const today = new Date().toDateString();
  if (today !== spendDay) {
    spentEur = 0;
    spendDay = today;
  }
}

// Reserviert die Kosten eines Renders. Gibt eine Freigabe-Funktion zurück
// oder null, wenn das Tageslimit erreicht ist.
export async function reserveRenderBudget(provider: string): Promise<(() => void) | null> {
  resetIfNewDay();
  const cost = renderCostEur(provider);
  // Erst reservieren, dann (asynchron) prüfen — sonst könnten zwei
  // Anfragen gleichzeitig denselben Restbetrag sehen.
  inFlightEur += cost;
  const spent = (await spentTodayEur()) ?? spentEur;
  if (spent + inFlightEur > env.dailyCostCapEur) {
    inFlightEur -= cost;
    return null;
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    inFlightEur -= cost;
  };
}

// Zähler im Arbeitsspeicher (Fallback ohne DB). Der Mock kostet nichts.
export function recordSpend(provider: string): void {
  resetIfNewDay();
  spentEur += renderCostEur(provider);
}
