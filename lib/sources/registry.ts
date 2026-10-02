import "server-only";
import { getSupabase } from "@/lib/supabase";
import type { SourceDefinition } from "@/lib/sources/types";

// Eingebaute Quellen (immer verfügbar, auch ohne Datenbank) — zum Testen
// der ganzen Import-Kette mit dem Beispiel-Feed.
export const BUILTIN_SOURCES: SourceDefinition[] = [
  {
    id: "sample",
    name: "Beispiel-Feed",
    kind: "csv_file",
    config: { path: "sample-feed.csv", mappingPreset: "interior-ai", defaults: { currency: "EUR" } },
  },
];

// Alle aktiven Quellen: eingebaute + Tabelle product_sources.
export async function getSources(): Promise<SourceDefinition[]> {
  const db = getSupabase();
  if (!db) return BUILTIN_SOURCES;
  const { data, error } = await db
    .from("product_sources")
    .select("id, name, kind, supplier_id, config")
    .eq("active", true);
  if (error) throw new Error(`Quellen nicht lesbar: ${error.message}`);
  const fromDb: SourceDefinition[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    kind: r.kind,
    supplierId: r.supplier_id,
    config: r.config ?? {},
  }));
  const ids = new Set(fromDb.map((s) => s.id));
  return [...fromDb, ...BUILTIN_SOURCES.filter((s) => !ids.has(s.id))];
}
