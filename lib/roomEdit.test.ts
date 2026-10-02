import { describe, expect, it } from "vitest";
import type { Product } from "@/lib/catalog";
import {
  coupledCategories,
  nextCandidate,
  replaceWithCoupling,
  swipeDislike,
  swipeLike,
  type EditState,
} from "@/lib/roomEdit";

function prod(sku: string, category: string, priceCents: number, extra: Partial<Product> = {}): Product {
  return {
    sku, name: sku, category, priceCents, dimensions: "", widthCm: 50, depthCm: 50,
    heightCm: 50, tint: "#000", styleTags: ["warm-minimal"], retailer: "", affiliateUrl: "",
    group: "moebel", ...extra,
  };
}

const bedOak = prod("BED-OAK", "Bett", 100000, { family: "eiche" });
const bedWal = prod("BED-WAL", "Bett", 130000, { family: "nussbaum" });
const bedWhite = prod("BED-WHITE", "Bett", 110000, { family: "weiss", styleTags: ["soft-modern"] });
const nsOak = prod("NS-OAK", "Nachttisch", 15000, { family: "eiche" });
const nsWal = prod("NS-WAL", "Nachttisch", 18000, { family: "nussbaum" });
const nsWhite = prod("NS-WHITE", "Nachttisch", 13000, { family: "weiss" });

const look = { styleTag: "warm-minimal", couplings: [["Bett", "Nachttisch"]] };
const alternatives = {
  Bett: [bedOak, bedWhite, bedWal],
  Nachttisch: [nsWhite, nsOak, nsWal],
};
const start = (): EditState => ({
  items: [
    { product: bedOak, quantity: 1 },
    { product: nsOak, quantity: 2 },
  ],
  liked: new Set(),
  disliked: new Set(),
});

describe("coupledCategories", () => {
  it("liefert die Partner einer Kopplungsgruppe", () => {
    expect(coupledCategories(look, "Bett")).toEqual(["Nachttisch"]);
    expect(coupledCategories(look, "Teppich")).toEqual([]);
  });
});

describe("nextCandidate", () => {
  it("bevorzugt gleichen Stil, dann den nächsten Preis", () => {
    // weiß ist soft-modern -> trotz näherem Preis hinter Nussbaum
    expect(nextCandidate(bedOak, alternatives.Bett, "warm-minimal", new Set())?.sku).toBe("BED-WAL");
  });
  it("überspringt aussortierte Stücke", () => {
    expect(nextCandidate(bedOak, alternatives.Bett, "warm-minimal", new Set(["BED-WAL"]))?.sku).toBe("BED-WHITE");
  });
});

describe("replaceWithCoupling", () => {
  it("zieht beide Nachttische (ein Set) in die Familie des neuen Betts", () => {
    const items = replaceWithCoupling(start(), 0, bedWal, look, alternatives);
    expect(items[0].product.sku).toBe("BED-WAL");
    expect(items[1].product.sku).toBe("NS-WAL");
    expect(items[1].quantity).toBe(2); // Stückzahl bleibt
  });
  it("lässt gemerkte (♥) Stücke unverändert", () => {
    const s = swipeLike(start(), 1);
    const items = replaceWithCoupling(s, 0, bedWal, look, alternatives);
    expect(items[1].product.sku).toBe("NS-OAK");
  });
  it("ändert nichts, wenn es keine passende Familie gibt", () => {
    const items = replaceWithCoupling(start(), 0, prod("BED-X", "Bett", 1, { family: "metall" }), look, alternatives);
    expect(items[1].product.sku).toBe("NS-OAK");
  });
});

describe("swipeDislike", () => {
  it("ersetzt das Stück, merkt die Ablehnung und koppelt", () => {
    const next = swipeDislike(start(), 0, look, alternatives)!;
    expect(next.items[0].product.sku).toBe("BED-WAL");
    expect(next.items[1].product.sku).toBe("NS-WAL");
    expect(next.disliked.has("BED-OAK")).toBe(true);
  });
  it("gibt null zurück, wenn alles aussortiert ist", () => {
    let s: EditState | null = start();
    s = swipeDislike(s, 0, look, alternatives)!; // -> Nussbaum
    s = swipeDislike(s, 0, look, alternatives)!; // -> weiß
    expect(swipeDislike(s, 0, look, alternatives)).toBeNull();
  });
});
