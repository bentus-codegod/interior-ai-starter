import { describe, expect, it } from "vitest";
import { estimateCbm, planContainers, PLACEHOLDER_RATES, type FreightLine } from "@/lib/sourcing/container";

const line = (cbm: number, quantity: number, origin = "PT", weightKg = 50): FreightLine => ({
  sku: "X", quantity, cbm, weightKg, origin,
});

describe("estimateCbm", () => {
  it("nimmt echte Angabe oder schätzt aus Maßen mit Verpackungszuschlag", () => {
    expect(estimateCbm({ cbm: 1.2, widthCm: 0, depthCm: 0, heightCm: 0, group: "moebel" })).toBe(1.2);
    // 220 × 95 × 85 cm = 1,7765 m³ × 1,25
    expect(estimateCbm({ widthCm: 220, depthCm: 95, heightCm: 85, group: "moebel" })).toBeCloseTo(2.221, 2);
  });
});

describe("planContainers", () => {
  it("kleine Mengen gehen als Stückgut (LCL)", () => {
    const plan = planContainers([line(2, 3)]); // 6 m³
    expect(plan.origins[0].containers).toEqual([]);
    expect(plan.origins[0].lclCbm).toBe(6);
    expect(plan.origins[0].freightEur).toBe(6 * PLACEHOLDER_RATES.lclPerCbmEur);
  });
  it("ab gut 20 m³ lohnt sich ein 20'-Container", () => {
    const plan = planContainers([line(1, 25)]); // 25 m³ -> LCL 3000 € > 20' 2500 €
    expect(plan.origins[0].containers).toEqual([{ type: "20ft", count: 1 }]);
    expect(plan.origins[0].fillRate).toBeGreaterThan(0.8);
  });
  it("große Mengen: volle 40'HC plus günstigster Rest", () => {
    const plan = planContainers([line(1, 140)]); // 140 m³ = 2 × 64,94 + 10,1 Rest
    const types = Object.fromEntries(plan.origins[0].containers.map((c) => [c.type, c.count]));
    expect(types["40hc"]).toBe(2);
    expect(plan.origins[0].lclCbm).toBeCloseTo(10.12, 1);
  });
  it("plant je Herkunftsland getrennt (Bündelung pro Abgangshafen)", () => {
    const plan = planContainers([line(1, 5, "PT"), line(1, 5, "VN"), line(1, 2, "PT")]);
    expect(plan.origins.map((o) => [o.origin, o.totalCbm])).toEqual([["PT", 7], ["VN", 5]]);
    expect(plan.usesPlaceholderRates).toBe(true);
  });
});
