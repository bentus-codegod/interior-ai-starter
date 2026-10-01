import "server-only";
import { timingSafeEqual } from "node:crypto";

// Schutz für Admin-Endpunkte (Import). Erlaubt sind:
//   * ADMIN_TOKEN  — für manuelle Aufrufe (curl, Skripte)
//   * CRON_SECRET  — Vercel Cron schickt "Authorization: Bearer <CRON_SECRET>"
// Ist keins von beiden gesetzt, ist der Endpunkt komplett gesperrt.

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_TOKEN || process.env.CRON_SECRET);
}

export function isAdminRequest(req: Request): boolean {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return false;
  return [process.env.ADMIN_TOKEN, process.env.CRON_SECRET].some(
    (secret) => Boolean(secret) && safeEqual(token, secret as string)
  );
}
