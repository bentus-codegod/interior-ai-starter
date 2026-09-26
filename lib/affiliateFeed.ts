import type { Product } from "@/lib/catalog";

// Import-Struktur für echte Affiliate-Produkt-Feeds (Awin, CJ, Impact ...).
// Die Netzwerke liefern pro Händler einen Feed (CSV/XML/API). Die Feldnamen
// unterscheiden sich je Netzwerk — deshalb normalisierst du sie einmal auf
// diese FeedRow und mappst sie dann auf dein Produkt-Format.
//
// Ablauf in Produktion:
//   1. Feed vom Netzwerk laden (URL/API).
//   2. Je Netzwerk die Spalten auf FeedRow mappen.
//   3. feedRowToProduct() -> in die Produkt-DB (Supabase) schreiben.
//   4. Regelmäßig (z. B. täglich) neu laden — Preise/Verfügbarkeit ändern sich.

export type FeedRow = {
  sku: string;
  name: string;
  priceEur: string; // z. B. "899.00"
  category: string;
  retailer: string;
  affiliateUrl: string; // der getrackte Provisions-Link
  widthCm?: string;
  depthCm?: string;
  heightCm?: string;
  styleTags?: string; // "warm-minimal;soft-modern"
};

function num(v: string | undefined, fallback = 0): number {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

// Einfache CSV-Zerlegung (Kopfzeile + Zeilen, Trennzeichen ";").
// Für Produktion: eine robuste CSV-Bibliothek nehmen (z. B. papaparse).
export function parseCsvFeed(csv: string, delimiter = ";"): FeedRow[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(delimiter).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(delimiter);
    const row: Record<string, string> = {};
    header.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row as unknown as FeedRow;
  });
}

// Mappt eine normalisierte Feed-Zeile auf dein Produkt-Format.
export function feedRowToProduct(row: FeedRow): Product {
  return {
    sku: row.sku,
    name: row.name,
    priceCents: Math.round(num(row.priceEur) * 100),
    dimensions:
      row.widthCm && row.depthCm && row.heightCm
        ? `${row.widthCm} × ${row.depthCm} × ${row.heightCm} cm`
        : "",
    widthCm: num(row.widthCm),
    depthCm: num(row.depthCm),
    heightCm: num(row.heightCm),
    category: row.category,
    tint: "#C9C2B4", // Platzhalter; in Produktion echtes Produktbild verwenden
    styleTags: (row.styleTags ?? "").split(";").filter(Boolean),
    retailer: row.retailer,
    affiliateUrl: row.affiliateUrl,
  };
}

export function importFeed(csv: string): Product[] {
  return parseCsvFeed(csv).map(feedRowToProduct);
}
