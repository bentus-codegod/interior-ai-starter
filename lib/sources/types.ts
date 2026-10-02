import type { Product } from "@/lib/catalog";

// ---------------------------------------------------------------------------
// Schnittstelle für echte Möbeldaten.
//
// Jede Quelle (Affiliate-Feed, Händler-API, Lieferanten-Liste) liefert
// Rohzeilen. Ein Mapping übersetzt deren Spalten in `RawRow`, die
// Klassifizierung ordnet Kategorie/Stil/Material zu, und der Importer
// schreibt das Ergebnis in die Tabelle `products`.
//
//   Quelle ──fetch──> Rohzeilen ──mapping──> RawRow ──normalize──> ImportCandidate
//                                                                      │
//                                         Supabase products  <──upsert─┘
// ---------------------------------------------------------------------------

export type SourceKind = "csv_url" | "json_api" | "manual" | "csv_file";

// Einstellungen einer Quelle (Tabelle product_sources.config).
// Keine Secrets: API-Keys stehen in einer Umgebungsvariable, deren NAME
// hier in `authEnv` steht.
export type SourceConfig = {
  url?: string;
  urlEnv?: string; // statt url: Name einer Umgebungsvariable mit der URL
  // (für Feeds, bei denen der Schlüssel in der URL steckt, z. B. Awin)
  path?: string; // nur csv_file (lokale Datei, z. B. Beispiel-Feed)
  delimiter?: string; // CSV: ";" "," "\t" "|" — leer = automatisch erkennen
  gzip?: boolean; // Feed ist .gz-komprimiert
  itemsPath?: string; // JSON: Pfad zur Produktliste, z. B. "data.products"
  pagination?: { param: string; start?: number; maxPages?: number };
  authEnv?: string; // Name der Umgebungsvariable mit dem Token
  authHeader?: string; // Standard "Authorization" (Wert: "Bearer <token>")
  authScheme?: string; // Standard "Bearer"; "" = Token pur
  mappingPreset?: MappingPresetName;
  mapping?: Partial<FieldMapping>; // überschreibt das Preset feldweise
  defaults?: Partial<RawRow>; // z. B. { retailer: "Händler X", currency: "EUR" }
  categoryMap?: Record<string, string>; // Händler-Kategorie -> unsere Kategorie
  source?: "affiliate" | "private_label"; // wie wird verkauft
};

export type SourceDefinition = {
  id: string; // stabil, wird SKU-Präfix (z. B. "awin-nordheim")
  name: string;
  kind: SourceKind;
  supplierId?: string | null;
  config: SourceConfig;
};

// Eine Zeile nach dem Mapping — alles noch Text, wie es aus der Quelle kam.
export type RawRow = {
  externalId: string;
  name: string;
  price: string; // "899.00", "1.299,00 €" ...
  currency: string;
  url: string; // Produkt-/Affiliate-Link
  imageUrl: string;
  category: string; // Händler-Kategorie oder unsere
  retailer: string;
  description: string;
  dimensions: string; // "220 x 95 x 85 cm" o. ä.
  widthCm: string;
  depthCm: string;
  heightCm: string;
  styleTags: string; // "warm-minimal|soft-modern"
  group: string; // "moebel" / "deko"
  color: string;
  material: string;
  modelUrl: string; // 3D-Modell (.glb)
  // Sourcing (Private Label / Hersteller)
  supplierSku: string;
  purchasePrice: string;
  leadTimeDays: string;
  moq: string;
  cbm: string;
  weightKg: string;
  originCountry: string;
};

// Welche Quell-Spalte(n) welches Feld füllen. Mehrere Namen = der erste
// nicht-leere gewinnt.
export type FieldMapping = { [K in keyof RawRow]: string[] };

export type MappingPresetName = "interior-ai" | "awin" | "generic";

// Fertiges Produkt für die Datenbank: das App-Produkt plus Herkunft und
// Sourcing-Daten, die nie im Browser landen.
export type ImportCandidate = Product & {
  sourceId: string;
  externalId: string;
  sellVia: "affiliate" | "private_label";
  currency: string;
  supplierSku?: string;
  purchasePriceCents?: number;
  leadTimeDays?: number;
  moq?: number;
  cbm?: number;
  weightKg?: number;
  originCountry?: string;
};

export type SkipReason =
  | "kein_name"
  | "kein_preis"
  | "waehrung"
  | "kategorie_unbekannt"
  | "link_ungueltig"
  | "keine_id";

export type NormalizeResult =
  | { ok: true; product: ImportCandidate }
  | { ok: false; reason: SkipReason; externalId: string; name: string };

export type ImportReport = {
  sourceId: string;
  dryRun: boolean;
  rowsRead: number;
  imported: number; // im Dry-Run: würden importiert
  skipped: number;
  skipReasons: Partial<Record<SkipReason, number>>;
  deactivated: number;
  byCategory: Record<string, number>;
  sample: ImportCandidate[]; // die ersten paar zur Kontrolle
  error?: string;
};
