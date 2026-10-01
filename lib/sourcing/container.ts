import type { Product, RoomItem } from "@/lib/catalog";

// ---------------------------------------------------------------------------
// Container-Bündelung (Säule 1): Wie viele Container braucht eine Bestellung
// (oder ein ganzer Sammel-Import) und was kostet die Fracht ungefähr?
//
// Rechnet je Herkunftsland: Volumen und Gewicht summieren, dann zwischen
// Stückgut (LCL, Preis pro m³) und vollen Containern (FCL 20'/40'HC) die
// günstigste Kombination wählen.
//
// ACHTUNG: Die Standard-Frachtraten sind PLATZHALTER. Echte Raten kommen
// vom Spediteur und schwanken stark (Route, Saison). Für echte Angebote die
// Schnittstelle FreightQuoteProvider implementieren (z. B. Spediteur-API).
// ---------------------------------------------------------------------------

export type ContainerType = "20ft" | "40hc";

// Innenvolumen und Nutzlast (Richtwerte); Möbel füllen wegen Kartons und
// Stauverlust nur ~85 % des Volumens.
export const CONTAINERS: Record<ContainerType, { cbm: number; maxKg: number }> = {
  "20ft": { cbm: 33.2, maxKg: 28_000 },
  "40hc": { cbm: 76.4, maxKg: 26_500 },
};
export const FILL_FACTOR = 0.85;
// Verpackungszuschlag, wenn nur Produktmaße (keine Packmaße) bekannt sind.
export const PACK_FACTOR = 1.25;

export type FreightRates = {
  fclEur: Record<ContainerType, number>; // pro Container, Hafen -> Hafen
  lclPerCbmEur: number; // Stückgut pro m³
  lclMinCbm: number; // Mindestabrechnung LCL
  lastMilePerCbmEur: number; // Zustellung Hafen -> Kunde, pro m³
};

export const PLACEHOLDER_RATES: FreightRates = {
  fclEur: { "20ft": 2500, "40hc": 4000 },
  lclPerCbmEur: 120,
  lclMinCbm: 1,
  lastMilePerCbmEur: 45,
};

export type FreightLine = {
  sku: string;
  quantity: number;
  cbm: number; // pro Stück
  weightKg: number; // pro Stück
  origin: string; // Herkunftsland, "?" = unbekannt
};

export type OriginPlan = {
  origin: string;
  totalCbm: number;
  totalKg: number;
  containers: { type: ContainerType; count: number }[];
  lclCbm: number; // per Stückgut verschifft
  fillRate: number; // Auslastung der vollen Container (0–1)
  freightEur: number;
  lastMileEur: number;
};

export type FreightPlan = {
  origins: OriginPlan[];
  totalCbm: number;
  totalEur: number;
  usesPlaceholderRates: boolean;
};

// Packvolumen pro Stück: echte Angabe (cbm) oder aus den Maßen geschätzt.
export function estimateCbm(p: Pick<Product, "cbm" | "widthCm" | "depthCm" | "heightCm" | "group">): number {
  if (p.cbm && p.cbm > 0) return p.cbm;
  const raw = (p.widthCm * p.depthCm * Math.max(p.heightCm, 5)) / 1_000_000;
  if (raw > 0) return Math.round(raw * PACK_FACTOR * 1000) / 1000;
  return p.group === "deko" ? 0.02 : 0.3; // keine Maße: grobe Annahme
}

// Gewicht pro Stück: echte Angabe oder grob aus dem Volumen (~120 kg/m³).
export function estimateWeightKg(p: Pick<Product, "weightKg">, cbm: number): number {
  return p.weightKg && p.weightKg > 0 ? p.weightKg : Math.round(cbm * 120);
}

export function freightLinesFor(items: RoomItem[]): FreightLine[] {
  return items.map(({ product, quantity }) => {
    const cbm = estimateCbm(product);
    return {
      sku: product.sku,
      quantity,
      cbm,
      weightKg: estimateWeightKg(product, cbm),
      origin: product.originCountry ?? "?",
    };
  });
}

function planOrigin(origin: string, cbm: number, kg: number, rates: FreightRates): OriginPlan {
  const usable = (t: ContainerType) => CONTAINERS[t].cbm * FILL_FACTOR;
  const lclCost = (v: number) => Math.max(v, rates.lclMinCbm) * rates.lclPerCbmEur;

  // Volle 40'HC, solange es sich lohnt; den Rest günstigst verteilen.
  const full40 = Math.floor(cbm / usable("40hc"));
  const rest = cbm - full40 * usable("40hc");
  const options: { containers: { type: ContainerType; count: number }[]; lcl: number; cost: number }[] = [];
  const base = full40 * rates.fclEur["40hc"];
  if (rest <= 0.0001) {
    options.push({ containers: [], lcl: 0, cost: base });
  } else {
    options.push({ containers: [], lcl: rest, cost: base + lclCost(rest) });
    if (rest <= usable("20ft")) {
      options.push({ containers: [{ type: "20ft", count: 1 }], lcl: 0, cost: base + rates.fclEur["20ft"] });
    }
    options.push({ containers: [{ type: "40hc", count: 1 }], lcl: 0, cost: base + rates.fclEur["40hc"] });
  }
  const best = options.sort((a, b) => a.cost - b.cost)[0];

  const containers = [...best.containers];
  if (full40 > 0) {
    const existing = containers.find((c) => c.type === "40hc");
    if (existing) existing.count += full40;
    else containers.unshift({ type: "40hc", count: full40 });
  }

  // Gewicht prüfen (bei Möbeln selten der Engpass): ggf. 40'HC ergänzen.
  const capacityKg = containers.reduce((s, c) => s + c.count * CONTAINERS[c.type].maxKg, 0);
  const fclKg = cbm > 0 ? kg * ((cbm - best.lcl) / cbm) : 0;
  let extra = 0;
  if (fclKg > capacityKg) {
    extra = Math.ceil((fclKg - capacityKg) / CONTAINERS["40hc"].maxKg);
    const c40 = containers.find((c) => c.type === "40hc");
    if (c40) c40.count += extra;
    else containers.push({ type: "40hc", count: extra });
  }

  const fclVolume = containers.reduce((s, c) => s + c.count * usable(c.type), 0);
  const fillRate = fclVolume > 0 ? Math.min(1, (cbm - best.lcl) / fclVolume) : 0;
  return {
    origin,
    totalCbm: round(cbm),
    totalKg: Math.round(kg),
    containers,
    lclCbm: round(best.lcl),
    fillRate: round(fillRate),
    freightEur: Math.round(best.cost + extra * rates.fclEur["40hc"]),
    lastMileEur: Math.round(cbm * rates.lastMilePerCbmEur),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function planContainers(lines: FreightLine[], rates: FreightRates = PLACEHOLDER_RATES): FreightPlan {
  const byOrigin = new Map<string, { cbm: number; kg: number }>();
  for (const l of lines) {
    const g = byOrigin.get(l.origin) ?? { cbm: 0, kg: 0 };
    g.cbm += l.cbm * l.quantity;
    g.kg += l.weightKg * l.quantity;
    byOrigin.set(l.origin, g);
  }
  const origins = [...byOrigin.entries()].map(([origin, g]) => planOrigin(origin, g.cbm, g.kg, rates));
  return {
    origins,
    totalCbm: round(origins.reduce((s, o) => s + o.totalCbm, 0)),
    totalEur: origins.reduce((s, o) => s + o.freightEur + o.lastMileEur, 0),
    usesPlaceholderRates: rates === PLACEHOLDER_RATES,
  };
}

// Schnittstelle für echte Frachtangebote (Spediteur-API, Freight-Marktplatz).
// Heute gibt es nur die Platzhalter-Raten; ein echter Anbieter implementiert
// dieselbe Funktion und wird in /api/logistics/estimate eingesetzt.
export interface FreightQuoteProvider {
  name: string;
  quote(lines: FreightLine[]): Promise<FreightPlan>;
}

export const staticRateProvider: FreightQuoteProvider = {
  name: "platzhalter-raten",
  async quote(lines) {
    return planContainers(lines);
  },
};
