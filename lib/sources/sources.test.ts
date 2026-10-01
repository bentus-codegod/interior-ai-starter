import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseCsv, detectDelimiter } from "@/lib/sources/csv";
import { classifyCategory, classifyFamily, parseDimensions, parsePriceCents } from "@/lib/sources/classify";
import { prepareImport } from "@/lib/sources/prepare";
import { makeSku } from "@/lib/sources/normalize";
import type { SourceDefinition } from "@/lib/sources/types";

describe("parseCsv", () => {
  it("versteht Anführungszeichen, Trennzeichen und Umbrüche im Feld", () => {
    const csv = '﻿id;name;desc\n1;"Sofa ""Havel""";"Leinen; 3-Sitzer\nmit Kissen"\n2;Tisch;\n';
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ id: "1", name: 'Sofa "Havel"', desc: "Leinen; 3-Sitzer\nmit Kissen" });
    expect(rows[1].name).toBe("Tisch");
  });
  it("erkennt das Trennzeichen", () => {
    expect(detectDelimiter("a,b,c")).toBe(",");
    expect(detectDelimiter("a;b;c")).toBe(";");
    expect(detectDelimiter("a\tb\tc")).toBe("\t");
  });
});

describe("classify", () => {
  const cat = (name: string, category = "") => classifyCategory({ name, category });
  it("ordnet typische Händler-Bezeichnungen zu", () => {
    expect(cat("Ecksofa Lund, Cord, grau")).toBe("Sofa");
    expect(cat("Schlafsofa Bonn")).toBe("Sofa");
    expect(cat("Polsterbett 180x200 Boxspring")).toBe("Bett");
    expect(cat("Bettwäsche Leinen 135x200")).toBeNull();
    expect(cat("Nachttisch Eiche massiv")).toBe("Nachttisch");
    expect(cat("Esszimmerstuhl 2er-Set")).toBe("Stuhl");
    expect(cat("Ohrensessel Samt")).toBe("Sessel");
    expect(cat("Gartenlounge Teak 3-Sitzer")).toBe("Outdoor-Lounge");
    expect(cat("Kissenhülle 50x50 Leinen")).toBe("Kissen");
    expect(cat("Tischleuchte Opalglas")).toBe("Nachttischleuchte");
    expect(cat("Deckenleuchte LED")).toBeNull();
  });
  it("Händler-Kategorie-Mapping hat Vorrang", () => {
    expect(classifyCategory({ name: "Modell X", category: "Wohnen > Sofas" }, { "Wohnen > Sofas": "Sofa" })).toBe("Sofa");
  });
  it("Material-Familie", () => {
    expect(classifyFamily("Sideboard Walnut veneer")).toBe("nussbaum");
    expect(classifyFamily("Stuhl Eiche geölt")).toBe("eiche");
    expect(classifyFamily("Sofa grau")).toBeUndefined();
  });
  it("Preise in deutschen und englischen Formaten", () => {
    expect(parsePriceCents("1.299,00 €")).toBe(129900);
    expect(parsePriceCents("1,299.00")).toBe(129900);
    expect(parsePriceCents("1.299")).toBe(129900);
    expect(parsePriceCents("EUR 89,90")).toBe(8990);
    expect(parsePriceCents("0")).toBeNull();
  });
  it("Maße aus Text", () => {
    expect(parseDimensions("B 220 x T 95 x H 85 cm")).toEqual({ widthCm: 220, depthCm: 95, heightCm: 85 });
    expect(parseDimensions("Ø 45 x 160 cm")).toEqual({ widthCm: 45, depthCm: 45, heightCm: 160 });
    expect(parseDimensions("2200 x 950 x 850 mm")).toEqual({ widthCm: 220, depthCm: 95, heightCm: 85 });
    expect(parseDimensions("200 x 300 cm")).toEqual({ widthCm: 200, depthCm: 300, heightCm: 1 });
  });
});

describe("prepareImport", () => {
  it("importiert den Beispiel-Feed vollständig", () => {
    const csv = readFileSync(path.join(__dirname, "../../data/sample-feed.csv"), "utf8");
    const source: SourceDefinition = {
      id: "sample", name: "Beispiel", kind: "csv_file",
      config: { mappingPreset: "interior-ai" },
    };
    const { candidates, report } = prepareImport(parseCsv(csv), source);
    expect(report.skipped).toBe(0);
    expect(candidates.map((c) => c.sku)).toContain("SAMPLE-SF-DEMO-01");
    const table = candidates.find((c) => c.sku === "SAMPLE-TB-DEMO-01")!;
    expect(table.styleTags).toEqual(["warm-minimal", "soft-modern"]);
    expect(candidates.find((c) => c.category === "Vase")?.group).toBe("deko");
  });

  it("Awin-Feed: mappt, ordnet ein und meldet unbrauchbare Zeilen", () => {
    const rows = [
      { aw_product_id: "111", product_name: "Ecksofa Lund Cord", search_price: "1.299,00", currency: "EUR",
        aw_deep_link: "https://www.awin1.com/pclick.php?p=111", merchant_image_url: "https://img.example/111.jpg",
        merchant_category: "Sofas", merchant_name: "Möbelhaus X", dimensions: "250 x 160 x 85 cm" },
      { aw_product_id: "112", product_name: "Bettwäsche Satin", search_price: "49.99", currency: "EUR",
        aw_deep_link: "https://www.awin1.com/pclick.php?p=112", merchant_category: "Textilien" },
      { aw_product_id: "113", product_name: "Nachttisch Eiche", search_price: "149", currency: "USD",
        aw_deep_link: "https://www.awin1.com/pclick.php?p=113" },
      { aw_product_id: "114", product_name: "Stuhl Nussbaum", search_price: "", currency: "EUR",
        aw_deep_link: "https://www.awin1.com/pclick.php?p=114" },
    ];
    const { candidates, report } = prepareImport(rows, {
      id: "awin-x", name: "Möbelhaus X", kind: "csv_url", config: { mappingPreset: "awin" },
    });
    expect(candidates).toHaveLength(1);
    const sofa = candidates[0];
    expect(sofa).toMatchObject({
      sku: "AWIN-X-111", category: "Sofa", priceCents: 129900, retailer: "Möbelhaus X",
      widthCm: 250, depthCm: 160, heightCm: 85, imageUrl: "https://img.example/111.jpg", group: "moebel",
    });
    expect(sofa.styleTags).toContain("warm-minimal"); // "Cord"
    expect(report.skipReasons).toEqual({ kategorie_unbekannt: 1, waehrung: 1, kein_preis: 1 });
  });

  it("Lieferantenliste (Private Label) ohne Link, mit Sourcing-Daten", () => {
    const rows = [{ sku: "PL-1", name: "Esstisch Eiche 200", preis: "899", ek: "310,50",
      cbm: "0.42", gewicht_kg: "48", herkunftsland: "pt", lieferzeit_tage: "45", moq: "20" }];
    const { candidates } = prepareImport(rows, {
      id: "lieferant-a", name: "Lieferant A", kind: "csv_url",
      config: { mappingPreset: "generic", source: "private_label" },
    });
    expect(candidates[0]).toMatchObject({
      category: "Esstisch", sellVia: "private_label", affiliateUrl: "", purchasePriceCents: 31050,
      cbm: 0.42, weightKg: 48, originCountry: "PT", leadTimeDays: 45, moq: 20, family: "eiche",
    });
  });
});

describe("makeSku", () => {
  it("baut stabile, saubere SKUs", () => {
    expect(makeSku("awin-x", "ab/12 3")).toBe("AWIN-X-AB-12-3");
  });
});
