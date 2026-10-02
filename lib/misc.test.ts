import { describe, expect, it } from "vitest";
import { splitBudget } from "@/lib/budget";
import { cleanStyleText, buildPrompt, MAX_STYLE_TEXT } from "@/lib/stylePrompt";
import { checkFit } from "@/lib/fitCheck";
import { jsonProducts } from "@/lib/catalog";

describe("splitBudget", () => {
  it("rechnet das Konzept-Beispiel (20.000 €, 40 % Logistik)", () => {
    expect(splitBudget(2_000_000, 0.4)).toEqual({
      budgetCents: 2_000_000,
      logisticsCents: 800_000,
      furnitureBudgetCents: 1_200_000,
    });
  });
  it("ohne Budget bleibt alles 0, Anteil wird begrenzt", () => {
    expect(splitBudget(0, 0.4).furnitureBudgetCents).toBe(0);
    expect(splitBudget(100_000, 5).logisticsCents).toBe(60_000);
  });
});

describe("cleanStyleText", () => {
  it("säubert Steuerzeichen, Klammern und Länge", () => {
    expect(cleanStyleText("hell,\n (viel) Holz <b>")).toBe("hell, viel Holz b");
    expect(cleanStyleText("x".repeat(500)).length).toBe(MAX_STYLE_TEXT);
    expect(cleanStyleText(42)).toBe("");
  });
  it("hängt nur nicht-leeren Text an", () => {
    expect(buildPrompt("base", "")).toBe("base");
    expect(buildPrompt("base", "grün")).toBe("base, grün");
  });
});

describe("checkFit mit Deckenhöhe", () => {
  const shelf = jsonProducts.find((p) => p.sku === "SH-OAK-01")!; // 200 cm hoch
  it("meldet zu hohe Stücke", () => {
    expect(checkFit(shelf, { widthCm: 0, lengthCm: 0, doorWidthCm: 0, ceilingHeightCm: 190 }).verdict).toBe("no");
    expect(checkFit(shelf, { widthCm: 0, lengthCm: 0, doorWidthCm: 0, ceilingHeightCm: 210 }).verdict).toBe("tight");
    expect(checkFit(shelf, { widthCm: 0, lengthCm: 0, doorWidthCm: 0, ceilingHeightCm: 260 }).verdict).toBe("fits");
  });
});

describe("checkFit Grundfläche (Stück darf gedreht werden)", () => {
  const sofa = jsonProducts.find((p) => p.sku === "SF-LINEN-01")!; // 220 × 95
  it("Sofa passt an die lange Wand eines schmalen Raums", () => {
    // Regression: früher 'Passt nicht', weil nur die kurze Raumseite zählte
    expect(checkFit(sofa, { widthCm: 200, lengthCm: 450, doorWidthCm: 0 }).verdict).toBe("fits");
  });
  it("zu lang für den Raum", () => {
    expect(checkFit(sofa, { widthCm: 200, lengthCm: 210, doorWidthCm: 0 }).verdict).toBe("no");
  });
  it("knapp bei wenig Laufweg", () => {
    expect(checkFit(sofa, { widthCm: 140, lengthCm: 450, doorWidthCm: 0 }).verdict).toBe("tight");
  });
});
