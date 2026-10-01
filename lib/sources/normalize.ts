import { classifyCategory, classifyFamily, classifyStyleTags, groupFor, parseDimensions, parsePriceCents } from "@/lib/sources/classify";
import type { ImportCandidate, NormalizeResult, RawRow, SourceDefinition } from "@/lib/sources/types";

// Farbe für die Ersatz-Kachel, wenn (noch) kein Produktfoto da ist.
const TINTS: Record<string, string> = {
  eiche: "#B08948", nussbaum: "#6E4E36", teak: "#A0784E", rattan: "#C9A97C",
  boucle: "#E7E2D6", weiss: "#EEEAE2",
};

function num(v: string): number | undefined {
  if (!v) return undefined;
  const n = Number(v.replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

// SKU in unserer DB: Quell-Präfix + ID der Quelle, nur A-Z 0-9 und "-".
export function makeSku(sourceId: string, externalId: string): string {
  const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${clean(sourceId)}-${clean(externalId)}`.slice(0, 64);
}

function dims(row: RawRow) {
  const w = num(row.widthCm), d = num(row.depthCm), h = num(row.heightCm);
  if (w && d) return { widthCm: w, depthCm: d, heightCm: h ?? 0 };
  return parseDimensions(row.dimensions) ?? { widthCm: 0, depthCm: 0, heightCm: 0 };
}

function dimensionsLabel(w: number, d: number, h: number, original: string): string {
  if (original) return original;
  if (!w && !d) return "";
  return h > 1 ? `${w} × ${d} × ${h} cm` : `${w} × ${d} cm`;
}

// Eine gemappte Zeile prüfen und in ein Produkt für die DB verwandeln.
// Gibt bei unbrauchbaren Zeilen einen Grund zurück (landet im Bericht).
export function normalizeRow(row: RawRow, source: SourceDefinition): NormalizeResult {
  const skip = (reason: Exclude<NormalizeResult, { ok: true }>["reason"]): NormalizeResult => ({
    ok: false, reason, externalId: row.externalId, name: row.name,
  });

  if (!row.externalId) return skip("keine_id");
  if (!row.name) return skip("kein_name");
  const priceCents = parsePriceCents(row.price);
  if (!priceCents) return skip("kein_preis");
  const currency = (row.currency || "EUR").toUpperCase();
  // Mehrere Währungen kommen später (Umrechnung + Anzeige). Bis dahin: nur EUR.
  if (currency !== "EUR") return skip("waehrung");

  const sellVia = source.config.source ?? "affiliate";
  // Affiliate braucht einen gültigen Link; Private Label verkauft selbst.
  if (sellVia === "affiliate" && !isHttpUrl(row.url)) return skip("link_ungueltig");

  const category = classifyCategory(
    { name: row.name, category: row.category, description: row.description },
    source.config.categoryMap
  );
  if (!category) return skip("kategorie_unbekannt");

  const text = `${row.name} ${row.material} ${row.color} ${row.description}`;
  const { widthCm, depthCm, heightCm } = dims(row);
  const family = classifyFamily(`${row.name} ${row.material} ${row.color}`);
  const styleTags = row.styleTags
    ? row.styleTags.split(/[|;,]/).map((t) => t.trim()).filter(Boolean)
    : classifyStyleTags(text);

  const product: ImportCandidate = {
    sku: makeSku(source.id, row.externalId),
    name: row.name.slice(0, 200),
    priceCents,
    dimensions: dimensionsLabel(widthCm, depthCm, heightCm, row.dimensions),
    widthCm,
    depthCm,
    heightCm,
    category,
    tint: TINTS[family ?? ""] ?? "#C9C2B4",
    styleTags,
    retailer: row.retailer || source.name,
    affiliateUrl: isHttpUrl(row.url) ? row.url : "",
    group: row.group === "deko" || row.group === "moebel" ? row.group : groupFor(category),
    imageUrl: isHttpUrl(row.imageUrl) ? row.imageUrl : undefined,
    modelUrl: isHttpUrl(row.modelUrl) || row.modelUrl.startsWith("/models/") ? row.modelUrl : undefined,
    family,
    sourceId: source.id,
    externalId: row.externalId,
    sellVia,
    currency,
    supplierSku: row.supplierSku || undefined,
    purchasePriceCents: parsePriceCents(row.purchasePrice) ?? undefined,
    leadTimeDays: num(row.leadTimeDays),
    moq: num(row.moq),
    cbm: num(row.cbm),
    weightKg: num(row.weightKg),
    originCountry: row.originCountry ? row.originCountry.toUpperCase().slice(0, 2) : undefined,
  };
  return { ok: true, product };
}
