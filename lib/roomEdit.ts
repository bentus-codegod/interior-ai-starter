import type { Look, Product, RoomItem } from "@/lib/catalog";

// Reine Logik fürs Bearbeiten eines Raums im Browser: Swipen, Tauschen und
// die Kopplung zwischen Stücken. Ohne React und ohne Server, daher gut
// testbar (lib/roomEdit.test.ts).

type CouplingLook = Pick<Look, "couplings">;

// Alle Kategorien, die mit `category` gekoppelt sind (ohne sie selbst).
export function coupledCategories(look: CouplingLook, category: string): string[] {
  const out = new Set<string>();
  for (const group of look.couplings ?? []) {
    if (group.includes(category)) group.forEach((c) => c !== category && out.add(c));
  }
  return [...out];
}

// Aus `candidates` ein Stück derselben Familie wählen, das nicht aussortiert
// ist — am nächsten am Preis des bisherigen Stücks.
export function pickInFamily(
  candidates: Product[],
  family: string,
  excluded: Set<string>,
  targetPriceCents: number
): Product | undefined {
  return candidates
    .filter((p) => p.family === family && !excluded.has(p.sku))
    .sort(
      (a, b) =>
        Math.abs(a.priceCents - targetPriceCents) -
        Math.abs(b.priceCents - targetPriceCents)
    )[0];
}

// Nächster Vorschlag nach einem „gefällt mir nicht“: gleicher Stil zuerst,
// dann der Preis, der dem bisherigen am nächsten liegt.
export function nextCandidate(
  current: Product,
  candidates: Product[],
  styleTag: string,
  disliked: Set<string>
): Product | undefined {
  return candidates
    .filter((p) => p.sku !== current.sku && !disliked.has(p.sku))
    .sort((a, b) => {
      const style =
        Number(b.styleTags.includes(styleTag)) - Number(a.styleTags.includes(styleTag));
      if (style !== 0) return style;
      return (
        Math.abs(a.priceCents - current.priceCents) -
        Math.abs(b.priceCents - current.priceCents)
      );
    })[0];
}

export type EditState = {
  items: RoomItem[];
  liked: Set<string>; // fest gemerkte Stücke — Kopplung ändert sie nicht
  disliked: Set<string>; // aussortiert — kommen nicht wieder
};

// Ersetzt die Position `index` durch `next` (Stückzahl bleibt) und zieht
// die gekoppelten Kategorien in die Familie des neuen Stücks nach.
export function replaceWithCoupling(
  state: EditState,
  index: number,
  next: Product,
  look: CouplingLook,
  alternatives: Record<string, Product[]>
): RoomItem[] {
  const items = state.items.map((it, i) => (i === index ? { ...it, product: next } : it));
  const family = next.family;
  if (!family) return items;

  for (const category of coupledCategories(look, next.category)) {
    const j = items.findIndex((it) => it.product.category === category);
    if (j < 0) continue;
    const current = items[j].product;
    if (current.family === family || state.liked.has(current.sku)) continue;
    const pick = pickInFamily(
      alternatives[category] ?? [],
      family,
      state.disliked,
      current.priceCents
    );
    if (pick) items[j] = { ...items[j], product: pick };
  }
  return items;
}

// Swipe nach links: Stück aussortieren und das nächste vorschlagen.
// Gibt null zurück, wenn es keine Alternative mehr gibt.
export function swipeDislike(
  state: EditState,
  index: number,
  look: CouplingLook & Pick<Look, "styleTag">,
  alternatives: Record<string, Product[]>
): EditState | null {
  const current = state.items[index].product;
  const disliked = new Set(state.disliked).add(current.sku);
  const liked = new Set(state.liked);
  liked.delete(current.sku);
  const next = nextCandidate(
    current,
    alternatives[current.category] ?? [],
    look.styleTag,
    disliked
  );
  if (!next) return null;
  const base = { ...state, liked, disliked };
  return { ...base, items: replaceWithCoupling(base, index, next, look, alternatives) };
}

// Swipe nach rechts: Stück merken.
export function swipeLike(state: EditState, index: number): EditState {
  return { ...state, liked: new Set(state.liked).add(state.items[index].product.sku) };
}
