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

// Produkte aus der JSON-Datei. Serverseitig ist das nur der Fallback, wenn
// keine Datenbank konfiguriert ist — die eigentliche Quelle liefert
// getProducts() in lib/productRepo.ts (Supabase oder diese Datei).
// JSON kennt keine String-Literal-Typen, daher die Typ-Zusicherung.
export const jsonProducts = catalog.products as Product[];
export const looks: Look[] = catalog.looks;

export function getLook(id: string): Look | undefined {
  return looks.find((l) => l.id === id);
}

export function isDeko(p: Product): boolean {
  return p.group === "deko";
}

export function formatEur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}
