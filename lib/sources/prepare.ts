import { applyMapping, resolveMapping } from "@/lib/sources/mapping";
import { normalizeRow } from "@/lib/sources/normalize";
import type { ImportCandidate, ImportReport, SourceDefinition } from "@/lib/sources/types";

// Reine Aufbereitung ohne Datenbank — auch für Tests und den Dry-Run.
export function prepareImport(
  rows: Record<string, unknown>[],
  source: SourceDefinition
): { candidates: ImportCandidate[]; report: ImportReport } {
  const mapping = resolveMapping(source.config);
  const report: ImportReport = {
    sourceId: source.id, dryRun: true, rowsRead: rows.length, imported: 0,
    skipped: 0, skipReasons: {}, deactivated: 0, byCategory: {}, sample: [],
  };
  const bySku = new Map<string, ImportCandidate>();
  for (const raw of rows) {
    const result = normalizeRow(applyMapping(raw, mapping, source.config.defaults), source);
    if (!result.ok) {
      report.skipped++;
      report.skipReasons[result.reason] = (report.skipReasons[result.reason] ?? 0) + 1;
      continue;
    }
    bySku.set(result.product.sku, result.product); // Duplikate: letzte Zeile gewinnt
  }
  const candidates = [...bySku.values()];
  report.imported = candidates.length;
  for (const c of candidates) report.byCategory[c.category] = (report.byCategory[c.category] ?? 0) + 1;
  report.sample = candidates.slice(0, 5);
  return { candidates, report };
}
