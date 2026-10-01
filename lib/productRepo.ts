import "server-only";
import { getSupabase } from "@/lib/supabase";
import { jsonProducts, type Product } from "@/lib/catalog";

// Die eine Stelle, an der der Server Produkte holt.
//   * Supabase konfiguriert -> Tabelle public.products (nur aktive)
//   * sonst                 -> data/catalog.json
// Fällt die Datenbank aus, nehmen wir ebenfalls die JSON-Datei, damit die
// Seite nicht leer bleibt (mit Log-Eintrag).

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
};

// Nur die Spalten, die der Browser sehen darf — Einkaufspreis, Lieferant
// und Lagerbestand bleiben in der Datenbank.
const PUBLIC_COLUMNS =
  "sku, name, category, product_group, price_cents, width_cm, depth_cm, " +
  "height_cm, dimensions, tint, style_tags, retailer, affiliate_url, " +
  "image_url, model_url";

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
  };
}

// Kurzer Cache, damit nicht jeder Render den ganzen Katalog neu lädt.
const CACHE_MS = 60_000;
let cache: { at: number; products: Product[] } | null = null;

export async function getProducts(): Promise<Product[]> {
  const db = getSupabase();
  if (!db) return jsonProducts;
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.products;

  const { data, error } = await db
    .from("products")
    .select(PUBLIC_COLUMNS)
    .eq("active", true)
    .returns<ProductRow[]>();

  if (error || !data || data.length === 0) {
    console.error("productRepo: Datenbank nicht nutzbar, nehme catalog.json", error);
    return jsonProducts;
  }
  const products = data.map(rowToProduct);
  cache = { at: Date.now(), products };
  return products;
}

// WICHTIG: Preise werden IMMER hier serverseitig geholt, nie aus dem
// Request des Browsers übernommen. Sonst könnte jemand den Preis im
// Frontend manipulieren und für 1 Cent bestellen.
export async function resolveItems(skus: string[]): Promise<Product[]> {
  const bySku = new Map((await getProducts()).map((p) => [p.sku, p]));
  return skus
    .map((sku) => bySku.get(sku))
    .filter((p): p is Product => Boolean(p));
}
