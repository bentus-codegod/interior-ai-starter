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
  // Material-/Serien-Familie (z. B. "eiche", "nussbaum"). Gekoppelte Stücke
  // eines Looks (Bett + Nachttische, Tisch + Stühle) halten dieselbe Familie.
  family?: string;
  // Sourcing-Angaben (aus der Datenbank, falls bekannt). Öffentlich
  // unbedenklich; Einkaufspreis und Lieferant bleiben in der DB.
  leadTimeDays?: number; // Lieferzeit in Tagen
  cbm?: number; // Packvolumen m³ (Container-Planung)
  weightKg?: number; // Packgewicht
  originCountry?: string; // ISO-Code Herkunftsland
};

export type Room = { id: string; name: string };

export type ProductGroup = "moebel" | "deko";

export type Look = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  styleTag: string;
  roomType: string;
  categories: string[];
  // Stückzahl je Kategorie, Standard 1 (z. B. 2 Nachttische, 4 Stühle).
  // Ein Set ist EINE Position: tauscht man sie, ändern sich alle Stücke.
  quantities?: Record<string, number>;
  // Gekoppelte Kategorien: ändert sich eine, ziehen die anderen in
  // dieselbe Material-Familie nach (siehe lib/coupling.ts).
  couplings?: string[][];
};

// Eine Position im zusammengestellten Raum: Produkt + Stückzahl.
export type RoomItem = { product: Product; quantity: number };

// Produkte aus der JSON-Datei. Serverseitig ist das nur der Fallback, wenn
// keine Datenbank konfiguriert ist — die eigentliche Quelle liefert
// getProducts() in lib/productRepo.ts (Supabase oder diese Datei).
// JSON kennt keine String-Literal-Typen, daher die Typ-Zusicherung.
export const jsonProducts = catalog.products as Product[];
export const looks = catalog.looks as Look[];
export const rooms: Room[] = catalog.rooms;

export function looksForRoom(roomType: string): Look[] {
  return looks.filter((l) => l.roomType === roomType);
}

export function quantityFor(look: Pick<Look, "quantities">, category: string): number {
  return look.quantities?.[category] ?? 1;
}

export function itemsTotalCents(items: RoomItem[]): number {
  return items.reduce((s, i) => s + i.product.priceCents * i.quantity, 0);
}

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
