import "server-only";
import { getSupabase } from "@/lib/supabase";
import { clearProductCache } from "@/lib/productRepo";
import { fetchRows } from "@/lib/sources/fetchers";
import { prepareImport } from "@/lib/sources/prepare";
import type { ImportCandidate, ImportReport, SourceDefinition } from "@/lib/sources/types";

// Import einer Quelle:
//   1. Rohzeilen holen, mappen, prüfen und einordnen
//   2. Dry-Run: nur Bericht. Sonst: in products upserten (SKU = Quelle + ID)
//   3. Produkte dieser Quelle, die im Feed fehlen, auf inaktiv setzen
//      (nur wenn der Feed überhaupt Produkte geliefert hat — ein leerer
//      oder kaputter Feed darf nicht den ganzen Katalog abschalten)

const BATCH = 500;

function toRow(c: ImportCandidate, source: SourceDefinition, seenAt: string) {
  return {
    sku: c.sku,
    name: c.name,
    category: c.category,
    product_group: c.group,
    price_cents: c.priceCents,
    purchase_price_cents: c.purchasePriceCents ?? null,
    width_cm: c.widthCm,
    depth_cm: c.depthCm,
    height_cm: c.heightCm,
    dimensions: c.dimensions,
    tint: c.tint,
    style_tags: c.styleTags,
    retailer: c.retailer,
    affiliate_url: c.affiliateUrl,
    image_url: c.imageUrl ?? null,
    model_url: c.modelUrl ?? null,
    family: c.family ?? null,
    supplier_id: source.supplierId ?? null,
    source: c.sellVia,
    source_id: source.id,
    external_id: c.externalId,
    supplier_sku: c.supplierSku ?? null,
    currency: c.currency,
    lead_time_days: c.leadTimeDays ?? null,
    moq: c.moq ?? null,
    cbm: c.cbm ?? null,
    weight_kg: c.weightKg ?? null,
    origin_country: c.originCountry ?? null,
    active: true,
    last_seen_at: seenAt,
    updated_at: seenAt,
  };
}

export async function runImport(
  source: SourceDefinition,
  opts: { dryRun?: boolean } = {}
): Promise<ImportReport> {
  const db = getSupabase();
  const dryRun = opts.dryRun || !db;
  let rows: Record<string, unknown>[];
  try {
    rows = await fetchRows(source);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      sourceId: source.id, dryRun, rowsRead: 0, imported: 0, skipped: 0,
      skipReasons: {}, deactivated: 0, byCategory: {}, sample: [], error: message,
    };
  }

  const { candidates, report } = prepareImport(rows, source);
  report.dryRun = dryRun;
  if (dryRun || !db) return report;

  const startedAt = new Date().toISOString();
  // Eingebaute Quellen in der Tabelle anlegen (Fremdschlüssel products.source_id)
  await db.from("product_sources").upsert(
    { id: source.id, name: source.name, kind: source.kind === "csv_file" ? "manual" : source.kind, config: source.config },
    { onConflict: "id", ignoreDuplicates: true }
  );
  const { data: run } = await db
    .from("import_runs")
    .insert({ source_id: source.id, started_at: startedAt, rows_read: report.rowsRead, skipped: report.skipped })
    .select("id")
    .single();

  try {
    for (let i = 0; i < candidates.length; i += BATCH) {
      const chunk = candidates.slice(i, i + BATCH).map((c) => toRow(c, source, startedAt));
      const { error } = await db.from("products").upsert(chunk, { onConflict: "sku" });
      if (error) throw new Error(`Upsert fehlgeschlagen: ${error.message}`);
    }

    if (candidates.length > 0) {
      const { data: gone, error } = await db
        .from("products")
        .update({ active: false, updated_at: startedAt })
        .eq("source_id", source.id)
        .eq("active", true)
        .lt("last_seen_at", startedAt)
        .select("sku");
      if (error) throw new Error(`Deaktivieren fehlgeschlagen: ${error.message}`);
      report.deactivated = gone?.length ?? 0;
    }

    await db.from("product_sources").update({ last_run_at: startedAt }).eq("id", source.id);
    if (run) {
      await db.from("import_runs").update({
        finished_at: new Date().toISOString(), status: "ok",
        upserted: report.imported, deactivated: report.deactivated,
      }).eq("id", run.id);
    }
    clearProductCache();
    return report;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (run) {
      await db.from("import_runs").update({
        finished_at: new Date().toISOString(), status: "failed", error: message.slice(0, 500),
      }).eq("id", run.id);
    }
    return { ...report, error: message };
  }
}
