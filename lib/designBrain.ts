import {
  isDeko,
  quantityFor,
  type Look,
  type Product,
  type RoomItem,
} from "@/lib/catalog";
import { coupledCategories } from "@/lib/roomEdit";

// Das "Design-Hirn": wählt aus dem Katalog die Produkte, die zu Look, Stil
// und Budget passen. Heute regelbasiert (deterministisch, ohne Kosten und
// ohne Key). Später kann hier ein LLM andocken, das Layout und Kombination
// klüger wählt — die Schnittstelle (composeRoom) bleibt gleich.
//
// Die Funktionen bekommen den Katalog übergeben (aus lib/productRepo.ts),
// statt ihn selbst zu laden — so ist egal, ob er aus Supabase oder aus
// catalog.json kommt.

function inCategory(catalog: Product[], category: string): Product[] {
  return catalog.filter((p) => p.category === category);
}

// Für eine Kategorie das teuerste Produkt wählen, das (in der nötigen
// Stückzahl) ins Restbudget passt; sonst das günstigste. So bekommt der
// Nutzer "das Beste, das er sich leisten kann", ohne dass eine benötigte
// Kategorie wegfällt. Ist eine Familie vorgegeben (Kopplung), wird sie
// bevorzugt, solange sie bezahlbar ist.
function pickForCategory(
  catalog: Product[],
  category: string,
  styleTag: string,
  remainingCents: number,
  quantity: number,
  family?: string
): Product | undefined {
  let candidates = inCategory(catalog, category).filter((p) =>
    p.styleTags.includes(styleTag)
  );
  if (candidates.length === 0) candidates = inCategory(catalog, category);
  if (candidates.length === 0) return undefined;

  const sorted = [...candidates].sort((a, b) => a.priceCents - b.priceCents);
  const affordable = sorted.filter((p) => p.priceCents * quantity <= remainingCents);

  if (family) {
    // Passendes Stück derselben Familie — auch außerhalb des Stils, denn
    // zusammengehörige Möbel sind wichtiger als das Stil-Etikett.
    const sameFamily = inCategory(catalog, category)
      .filter((p) => p.family === family && p.priceCents * quantity <= remainingCents)
      .sort((a, b) => a.priceCents - b.priceCents);
    if (sameFamily.length > 0) return sameFamily[sameFamily.length - 1];
  }

  if (affordable.length > 0) return affordable[affordable.length - 1];
  // Deko ist Kür: passt nichts mehr ins Budget, lassen wir sie weg.
  if (isDeko(sorted[0])) return undefined;
  return sorted[0]; // Möbel sind Pflicht: nichts passt -> günstigstes
}

export type ComposedRoom = { items: RoomItem[]; subtotalCents: number };

// Stellt aus einem Look einen kompletten, kaufbaren Raum zusammen.
// budgetCents = 0 bedeutet "kein Budget-Limit".
export function composeRoom(
  catalog: Product[],
  look: Look,
  budgetCents = 0
): ComposedRoom {
  const items: RoomItem[] = [];
  let spent = 0;
  const cap = budgetCents > 0 ? budgetCents : Number.MAX_SAFE_INTEGER;

  for (const category of look.categories) {
    const quantity = quantityFor(look, category);
    // Gibt es schon ein gekoppeltes Stück mit Familie? Dann dazu passend.
    const anchor = items.find(
      (it) =>
        it.product.family && coupledCategories(look, category).includes(it.product.category)
    );
    const pick = pickForCategory(
      catalog,
      category,
      look.styleTag,
      cap - spent,
      quantity,
      anchor?.product.family
    );
    if (pick) {
      items.push({ product: pick, quantity });
      spent += pick.priceCents * quantity;
    }
  }
  return { items, subtotalCents: spent };
}

// Tausch-Kandidaten je Kategorie, nach Preis sortiert. Der Browser blendet
// das gerade gewählte Produkt selbst aus — so braucht er nicht den ganzen
// Katalog, sondern nur die Kategorien des Looks.
export function alternativesByCategory(
  catalog: Product[],
  categories: string[]
): Record<string, Product[]> {
  const out: Record<string, Product[]> = {};
  for (const c of categories) {
    out[c] = inCategory(catalog, c).sort((a, b) => a.priceCents - b.priceCents);
  }
  return out;
}
