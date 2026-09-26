import {
  products,
  productsInCategory,
  type Look,
  type Product,
} from "@/lib/catalog";

// Das "Design-Hirn": wählt aus dem Katalog die Produkte, die zu Look, Stil
// und Budget passen. Heute regelbasiert (deterministisch, ohne Kosten und
// ohne Key). Später kann hier ein LLM andocken, das Layout und Kombination
// klüger wählt — die Schnittstelle (composeRoom) bleibt gleich.

function styleMatches(p: Product, styleTag: string): boolean {
  return p.styleTags.includes(styleTag);
}

// Für eine Kategorie das teuerste Produkt wählen, das ins Restbudget passt;
// sonst das günstigste. So bekommt der Nutzer "das Beste, das er sich leisten
// kann", ohne dass eine benötigte Kategorie wegfällt.
function pickForCategory(
  category: string,
  styleTag: string,
  remainingCents: number
): Product | undefined {
  let candidates = productsInCategory(category).filter((p) =>
    styleMatches(p, styleTag)
  );
  if (candidates.length === 0) candidates = productsInCategory(category);
  if (candidates.length === 0) return undefined;

  const sorted = [...candidates].sort((a, b) => a.priceCents - b.priceCents);
  const affordable = sorted.filter((p) => p.priceCents <= remainingCents);
  if (affordable.length > 0) return affordable[affordable.length - 1];
  return sorted[0]; // nichts passt ins Budget -> günstigstes
}

export type ComposedRoom = { items: Product[]; subtotalCents: number };

// Stellt aus einem Look einen kompletten, kaufbaren Raum zusammen.
// budgetCents = 0 bedeutet "kein Budget-Limit".
export function composeRoom(look: Look, budgetCents = 0): ComposedRoom {
  const items: Product[] = [];
  let spent = 0;
  const cap = budgetCents > 0 ? budgetCents : Number.MAX_SAFE_INTEGER;

  for (const category of look.categories) {
    const pick = pickForCategory(category, look.styleTag, cap - spent);
    if (pick) {
      items.push(pick);
      spent += pick.priceCents;
    }
  }
  return { items, subtotalCents: spent };
}

// Tausch-Alternativen für ein Produkt: gleiche Kategorie, ohne das Produkt
// selbst, nach Preis sortiert. Ähnliche Größe wird leicht bevorzugt.
export function alternatives(product: Product): Product[] {
  return products
    .filter((p) => p.category === product.category && p.sku !== product.sku)
    .sort((a, b) => a.priceCents - b.priceCents);
}
