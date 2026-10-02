import { NextRequest, NextResponse } from "next/server";
import { adminConfigured, isAdminRequest } from "@/lib/adminAuth";
import { getSources } from "@/lib/sources/registry";
import { runImport } from "@/lib/sources/importer";

export const runtime = "nodejs";
// 60 s funktioniert in jedem Vercel-Tarif. Für sehr große Feeds im
// Pro-Tarif erhöhen (oder Feeds aufteilen).
export const maxDuration = 60;

// Produkt-Import aus allen (oder einer) Quelle(n).
//   GET  /api/admin/import                 -> alle aktiven Quellen (Vercel Cron)
//   POST /api/admin/import?source=sample   -> nur eine Quelle
//   ...&dryRun=1                           -> nur Bericht, nichts schreiben
// Geschützt mit ADMIN_TOKEN oder CRON_SECRET (Authorization: Bearer ...).
async function handle(req: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "Admin-Zugang nicht konfiguriert." }, { status: 503 });
  }
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const only = params.get("source");
  const dryRun = params.get("dryRun") === "1" || params.get("dryRun") === "true";

  try {
    const sources = (await getSources()).filter((s) => !only || s.id === only);
    if (only && sources.length === 0) {
      return NextResponse.json({ error: `Quelle ${only} unbekannt.` }, { status: 404 });
    }
    // Der Beispiel-Feed läuft im Cron nicht mit, nur auf ausdrücklichen Wunsch.
    const selected = only ? sources : sources.filter((s) => s.id !== "sample");
    const reports = [];
    for (const source of selected) {
      reports.push(await runImport(source, { dryRun }));
    }
    const failed = reports.some((r) => r.error);
    // Ohne Datenbank ist jeder Lauf automatisch ein Dry-Run.
    const effectiveDryRun = reports.length > 0 ? reports.every((r) => r.dryRun) : dryRun;
    return NextResponse.json({ dryRun: effectiveDryRun, reports }, { status: failed ? 207 : 200 });
  } catch (err) {
    console.error("import error:", err);
    return NextResponse.json({ error: "Import fehlgeschlagen." }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
