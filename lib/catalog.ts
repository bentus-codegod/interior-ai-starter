import catalog from "@/data/catalog.json";

export type Product = {
  sku: string;
  name: string;
  priceCents: number;
  dimensions: string;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  category: string;
  tint: string;
  styleTags: string[];
  retailer: string;
  affiliateUrl: string;
  // "moebel" = großes Stück (mit Passform-Check), "deko" = Accessoire.
  group: ProductGroup;
  // Echtes Produktfoto. Fehlt es, zeigt die App die farbige Kachel (tint).
  imageUrl?: string;
  // 3D-Modell (.glb). Ist es gesetzt, gibt es die Schaltfläche „In 3D ansehen".
  modelUrl?: string;
};

export type ProductGroup = "moebel" | "deko";

export type Look = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  styleTag: string;
  categories: string[];
};

// JSON kennt keine String-Literal-Typen, daher die Typ-Zusicherung.
export const products = catalog.products as Product[];
export const looks: Look[] = catalog.looks;

export function getLook(id: string): Look | undefined {
  return looks.find((l) => l.id === id);
}

export function isDeko(p: Product): boolean {
  return p.group === "deko";
}

export function getProduct(sku: string): Product | undefined {
  return products.find((p) => p.sku === sku);
}

export function productsInCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

// WICHTIG: Preise werden IMMER hier serverseitig aus dem Katalog geholt,
// nie aus dem Request des Browsers übernommen. Sonst könnte jemand den
// Preis im Frontend manipulieren und für 1 Cent bestellen.
export function resolveItems(skus: string[]): Product[] {
  return skus
    .map((sku) => getProduct(sku))
    .filter((p): p is Product => Boolean(p));
}

export function formatEur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}
