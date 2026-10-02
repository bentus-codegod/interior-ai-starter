import "server-only";
import { getSupabase } from "@/lib/supabase";
import { jsonProducts, type Product, type RoomItem } from "@/lib/catalog";

// Die eine Stelle, an der der Server Produkte holt.
//   * Supabase konfiguriert -> Tabelle public.products (nur aktive)
//   * sonst                 -> data/catalog.json
// Fällt die konfigurierte Datenbank aus (oder ist leer), zeigt die Seite
// zur Not die JSON-Produkte an — VERKAUFT werden sie dann aber nicht
// (strict-Modus im Checkout), denn Bestellpositionen verweisen per
// Fremdschlüssel auf public.products und Preise müssen aus der DB kommen.

type ProductRow = {
  sku: string;
  name: string;
  category: string;
  product_group: "moebel" | "deko";
  price_cents: number;
  width_cm: number;
  depth_cm: number;
  height_cm: number;
  dimensions: string;
  tint: string;
  style_tags: string[];
  retailer: string;
  affiliate_url: string;
  image_url: string | null;
  model_url: string | null;
  family: string | null;
  lead_time_days: number | null;
  cbm: number | null;
  weight_kg: number | null;
  origin_country: string | null;
};

// Nur die Spalten, die der Browser sehen darf — Einkaufspreis, Lieferant
// und Lagerbestand bleiben in der Datenbank.
const PUBLIC_COLUMNS =
  "sku, name, category, product_group, price_cents, width_cm, depth_cm, " +
  "height_cm, dimensions, tint, style_tags, retailer, affiliate_url, " +
  "image_url, model_url, family, lead_time_days, cbm, weight_kg, origin_country";

function rowToProduct(r: ProductRow): Product {
  return {
    sku: r.sku,
    name: r.name,
    priceCents: r.price_cents,
    dimensions: r.dimensions,
    widthCm: Number(r.width_cm),
    depthCm: Number(r.depth_cm),
    heightCm: Number(r.height_cm),
    category: r.category,
    tint: r.tint,
    styleTags: r.style_tags ?? [],
    retailer: r.retailer,
    affiliateUrl: r.affiliate_url,
    group: r.product_group,
    imageUrl: r.image_url ?? undefined,
    modelUrl: r.model_url ?? undefined,
    family: r.family ?? undefined,
    leadTimeDays: r.lead_time_days ?? undefined,
    cbm: r.cbm === null ? undefined : Number(r.cbm),
    weightKg: r.weight_kg === null ? undefined : Number(r.weight_kg),
    originCountry: r.origin_country ?? undefined,
  };
}

// Kurzer Cache, damit nicht jeder Render den ganzen Katalog neu lädt.
const CACHE_MS = 60_000;
let cache: { at: number; products: Product[] } | null = null;

// Nach einem Import aufrufen, damit neue Produkte sofort erscheinen.
export function clearProductCache(): void {
  cache = null;
}

export async function getProducts(opts: { strict?: boolean } = {}): Promise<Product[]> {
  const db = getSupabase();
  if (!db) return jsonProducts;
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.products;

  const { data, error } = await db
    .from("products")
    .select(PUBLIC_COLUMNS)
    .eq("active", true)
    .returns<ProductRow[]>();

  if (error || !data || data.length === 0) {
    if (opts.strict) {
      throw new Error(`Produktdatenbank nicht nutzbar: ${error?.message ?? "keine aktiven Produkte"}`);
    }
    console.error("productRepo: Datenbank nicht nutzbar, zeige catalog.json an", error);
    return jsonProducts;
  }
  const products = data.map(rowToProduct);
  cache = { at: Date.now(), products };
  return products;
}

export const MAX_QUANTITY = 20;

// WICHTIG: Preise werden IMMER hier serverseitig geholt, nie aus dem
// Request des Browsers übernommen. Sonst könnte jemand den Preis im
// Frontend manipulieren und für 1 Cent bestellen. Vom Browser kommen nur
// SKU und Stückzahl; unbekannte SKUs fallen weg, Stückzahlen werden begrenzt.
export async function resolveItems(
  lines: { sku: string; quantity: number }[]
): Promise<RoomItem[]> {
  const bySku = new Map((await getProducts({ strict: true })).map((p) => [p.sku, p]));
  const out: RoomItem[] = [];
  for (const line of lines) {
    const product = bySku.get(line.sku);
    const q = Math.floor(Number(line.quantity));
    if (!product || !Number.isFinite(q) || q < 1) continue;
    out.push({ product, quantity: Math.min(q, MAX_QUANTITY) });
  }
  return out;
}
