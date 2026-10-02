import { describe, expect, it } from "vitest";
import { composeRoom } from "@/lib/designBrain";
import { jsonProducts, looks, type Look } from "@/lib/catalog";

const lookById = (id: string) => looks.find((l) => l.id === id) as Look;

describe("composeRoom mit dem echten Beispiel-Katalog", () => {
  it("füllt jede Kategorie jedes Looks ohne Budget-Limit", () => {
    for (const look of looks) {
      const { items } = composeRoom(jsonProducts, look, 0);
      const cats = items.map((i) => i.product.category);
      expect(cats, look.id).toEqual(look.categories);
    }
  });

  it("übernimmt Stückzahlen (2 Nachttische, 4 Stühle) in Summe und Position", () => {
    const bed = composeRoom(jsonProducts, lookById("schlafzimmer-warm-minimal"), 0);
    const ns = bed.items.find((i) => i.product.category === "Nachttisch")!;
    expect(ns.quantity).toBe(2);
    const dining = composeRoom(jsonProducts, lookById("esszimmer-warm-minimal"), 0);
    const chairs = dining.items.find((i) => i.product.category === "Stuhl")!;
    expect(chairs.quantity).toBe(4);
    const sum = dining.items.reduce((s, i) => s + i.product.priceCents * i.quantity, 0);
    expect(dining.subtotalCents).toBe(sum);
  });

  it("wählt gekoppelte Stücke aus derselben Familie", () => {
    for (const id of ["schlafzimmer-warm-minimal", "schlafzimmer-soft-modern", "esszimmer-warm-minimal"]) {
      const { items } = composeRoom(jsonProducts, lookById(id), 0);
      const fam = (c: string) => items.find((i) => i.product.category === c)?.product.family;
      const anchor = id.startsWith("schlaf") ? fam("Bett") : fam("Esstisch");
      const partner = id.startsWith("schlaf") ? fam("Nachttisch") : fam("Stuhl");
      expect(partner, id).toBe(anchor);
    }
  });

  it("lässt Deko weg, wenn das Budget nicht reicht, Möbel aber nie", () => {
    const look = lookById("warm-minimal");
    const { items } = composeRoom(jsonProducts, look, 50_000); // 500 €
    expect(items.some((i) => i.product.group === "deko")).toBe(false);
    expect(items.filter((i) => i.product.group === "moebel").length).toBe(
      look.categories.filter((c) => jsonProducts.find((p) => p.category === c)?.group === "moebel").length
    );
  });
});

describe("composeRoom Budget-Fallback", () => {
  it("nimmt ein bezahlbares Stück aus anderem Stil statt das Budget zu sprengen", () => {
    const look: Look = {
      id: "t", name: "t", description: "", prompt: "", roomType: "wohnzimmer",
      styleTag: "soft-modern", categories: ["Sofa"],
    };
    // soft-modern-Sofas kosten 899 € / 1.099 €; Cord-Sofa (warm-minimal) 799 €
    const { items } = composeRoom(jsonProducts, look, 80_000);
    expect(items[0].product.sku).toBe("SF-CORD-01");
  });
});
