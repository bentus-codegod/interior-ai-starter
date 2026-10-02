import type { FieldMapping, MappingPresetName, RawRow, SourceConfig } from "@/lib/sources/types";

// Spalten-Zuordnung je Feed-Format. Mehrere Namen = der erste nicht-leere
// Wert gewinnt. Groß-/Kleinschreibung der Spalten ist egal.
//
// ACHTUNG Awin: Die Spaltennamen entsprechen dem Awin-Standard-Feed, aber
// jeder Händler kann Spalten weglassen oder ergänzen. Vor dem ersten
// echten Import mit einem Dry-Run prüfen (siehe docs/SCHNITTSTELLEN.md).

const EMPTY: FieldMapping = {
  externalId: [], name: [], price: [], currency: [], url: [], imageUrl: [],
  category: [], retailer: [], description: [], dimensions: [], widthCm: [],
  depthCm: [], heightCm: [], styleTags: [], group: [], color: [], material: [],
  modelUrl: [], supplierSku: [], purchasePrice: [], leadTimeDays: [], moq: [],
  cbm: [], weightKg: [], originCountry: [],
};

export const MAPPING_PRESETS: Record<MappingPresetName, FieldMapping> = {
  // Unser eigenes Format (data/sample-feed.csv)
  "interior-ai": {
    ...EMPTY,
    externalId: ["sku"], name: ["name"], price: ["priceEur"], url: ["affiliateUrl"],
    imageUrl: ["imageUrl"], category: ["category"], retailer: ["retailer"],
    widthCm: ["widthCm"], depthCm: ["depthCm"], heightCm: ["heightCm"],
    styleTags: ["styleTags"], group: ["group"], modelUrl: ["modelUrl"],
    material: ["material"], color: ["color"],
  },
  // Awin-Produktfeed (Standardspalten)
  awin: {
    ...EMPTY,
    externalId: ["aw_product_id", "merchant_product_id"],
    name: ["product_name"],
    price: ["search_price", "store_price", "rrp_price"],
    currency: ["currency"],
    url: ["aw_deep_link"],
    imageUrl: ["merchant_image_url", "aw_image_url", "large_image"],
    category: ["merchant_category", "category_name"],
    retailer: ["merchant_name"],
    description: ["description", "product_short_description"],
    dimensions: ["dimensions", "product_dimensions"],
    color: ["colour", "color"],
    material: ["material", "fabric"],
    supplierSku: ["merchant_product_id"],
  },
  // Freie Händler-/Lieferantenlisten (deutsch/englisch)
  generic: {
    ...EMPTY,
    externalId: ["id", "sku", "artikelnummer", "artikel-nr", "art_nr", "product_id", "ean"],
    name: ["name", "title", "titel", "produktname", "bezeichnung", "product_name"],
    price: ["price", "preis", "vk", "verkaufspreis", "retail_price"],
    currency: ["currency", "waehrung", "währung"],
    url: ["url", "link", "deeplink", "deep_link", "product_url"],
    imageUrl: ["image", "image_url", "bild", "bild_url", "img"],
    category: ["category", "kategorie", "warengruppe", "product_type"],
    retailer: ["brand", "marke", "haendler", "händler", "merchant", "hersteller"],
    description: ["description", "beschreibung"],
    dimensions: ["dimensions", "masse", "maße", "abmessungen", "size"],
    widthCm: ["width", "breite", "width_cm", "breite_cm"],
    depthCm: ["depth", "tiefe", "depth_cm", "tiefe_cm", "length", "laenge"],
    heightCm: ["height", "hoehe", "höhe", "height_cm", "hoehe_cm"],
    color: ["color", "colour", "farbe"],
    material: ["material", "werkstoff"],
    modelUrl: ["model_url", "glb", "3d_model"],
    supplierSku: ["supplier_sku", "lieferanten_artikelnummer", "factory_code"],
    purchasePrice: ["purchase_price", "ek", "einkaufspreis", "fob_price", "cost"],
    leadTimeDays: ["lead_time_days", "lieferzeit_tage", "lead_time"],
    moq: ["moq", "mindestmenge"],
    cbm: ["cbm", "volume_m3", "volumen_m3"],
    weightKg: ["weight_kg", "gewicht_kg", "gross_weight"],
    originCountry: ["origin_country", "herkunftsland", "country_of_origin"],
  },
};

export function resolveMapping(config: SourceConfig): FieldMapping {
  const base = MAPPING_PRESETS[config.mappingPreset ?? "generic"];
  const merged = { ...base } as FieldMapping;
  for (const [k, v] of Object.entries(config.mapping ?? {})) {
    if (Array.isArray(v) && v.length > 0) merged[k as keyof RawRow] = v;
  }
  return merged;
}

// Liest verschachtelte Felder aus JSON ("price.amount").
function readPath(obj: Record<string, unknown>, path: string): unknown {
  let cur: unknown = obj;
  for (const part of path.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export function applyMapping(
  row: Record<string, unknown>,
  mapping: FieldMapping,
  defaults: Partial<RawRow> = {}
): RawRow {
  // Spaltennamen ohne Rücksicht auf Groß-/Kleinschreibung finden.
  const lower = new Map(Object.keys(row).map((k) => [k.toLowerCase(), k]));
  const out = {} as RawRow;
  for (const field of Object.keys(mapping) as (keyof RawRow)[]) {
    let value = "";
    for (const col of mapping[field]) {
      const raw = col.includes(".") ? readPath(row, col) : row[lower.get(col.toLowerCase()) ?? col];
      if (raw !== undefined && raw !== null && String(raw).trim() !== "") {
        value = Array.isArray(raw) ? raw.join("|") : String(raw).trim();
        break;
      }
    }
    out[field] = value || (defaults[field] ?? "");
  }
  return out;
}
