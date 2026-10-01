import type { ProductGroup } from "@/lib/catalog";

// Ordnet fremde Produkte automatisch ein: Kategorie, Möbel/Deko,
// Material-Familie und Stil. Regelbasiert über Stichwörter (deutsch und
// englisch) in Name, Händler-Kategorie, Material und Beschreibung.
// Bewusst einfach und nachvollziehbar; unsichere Fälle landen als
// "kategorie_unbekannt" im Import-Bericht statt falsch im Katalog.
// Später ersetzbar durch eine KI-Klassifizierung — gleiche Funktionen.

type Rule = { category: string; any: string[]; all?: string[]; none?: string[] };

const OUTDOOR = ["outdoor", "garten", "balkon", "terrasse", "garden", "patio"];

// Reihenfolge zählt: spezifische Regeln zuerst.
const RULES: Rule[] = [
  { category: "Outdoor-Lounge", any: ["lounge", "sofa", "couch", "bank"], all: OUTDOOR },
  { category: "Outdoor-Tisch", any: ["tisch", "table"], all: OUTDOOR },
  { category: "Outdoor-Teppich", any: ["teppich", "rug"], all: OUTDOOR },
  { category: "Outdoor-Leuchte", any: ["solar", "leuchte", "lampe", "lamp", "laterne", "light"], all: OUTDOOR },
  { category: "Pflanzkübel", any: ["pflanzkübel", "pflanzkuebel", "übertopf", "uebertopf", "blumentopf", "planter", "pflanzgefäß"] },
  { category: "Nachttischleuchte", any: ["nachttischlampe", "nachttischleuchte", "tischleuchte", "tischlampe", "table lamp", "bedside lamp"] },
  { category: "Pendelleuchte", any: ["pendelleuchte", "hängeleuchte", "haengeleuchte", "hängelampe", "pendant"] },
  { category: "Leuchte", any: ["stehleuchte", "stehlampe", "bogenlampe", "floor lamp"] },
  { category: "Nachttisch", any: ["nachttisch", "nachtkonsole", "nightstand", "bedside table"] },
  { category: "Couchtisch", any: ["couchtisch", "sofatisch", "beistelltisch", "coffee table", "side table"] },
  { category: "Esstisch", any: ["esstisch", "küchentisch", "kuechentisch", "dining table", "esszimmertisch"] },
  { category: "Kommode", any: ["kommode", "dresser", "chest of drawers"] },
  { category: "Sideboard", any: ["sideboard", "anrichte", "lowboard", "buffet"] },
  { category: "Regal", any: ["regal", "bücherregal", "buecherregal", "shelf", "bookcase", "shelving"] },
  { category: "Bett", any: ["bett", "bed", "boxspring", "bettgestell", "polsterbett"],
    none: ["bettwäsche", "bettwaesche", "bettdecke", "bettlaken", "bedding", "bedside", "bettbank", "schlafsofa", "sofa bed"] },
  { category: "Sessel", any: ["sessel", "armchair", "lounge chair", "ohrensessel"] },
  { category: "Sofa", any: ["sofa", "couch", "ecksofa", "schlafsofa", "sofa bed", "wohnlandschaft"] },
  { category: "Stuhl", any: ["stuhl", "stühle", "chair", "esszimmerstuhl"], none: ["armchair", "sessel", "lounge chair"] },
  { category: "Teppich", any: ["teppich", "rug", "carpet", "läufer"] },
  { category: "Kissen", any: ["kissen", "cushion", "pillow", "kissenhülle", "kissenbezug"] },
  { category: "Plaid", any: ["plaid", "wohndecke", "kuscheldecke", "throw", "blanket"] },
  { category: "Vase", any: ["vase"] },
  { category: "Wandbild", any: ["wandbild", "kunstdruck", "poster", "leinwand", "wall art", "art print", "bilderrahmen"] },
  { category: "Pflanze", any: ["kunstpflanze", "pflanze", "artificial plant", "plant", "olivenbaum"] },
];

const DEKO_CATEGORIES = new Set([
  "Kissen", "Plaid", "Vase", "Wandbild", "Pflanze", "Pflanzkübel",
  "Nachttischleuchte", "Outdoor-Leuchte",
]);

export const KNOWN_CATEGORIES = new Set(RULES.map((r) => r.category));

function has(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

// Kategorie aus freiem Text. `categoryMap` (aus der Quell-Konfiguration)
// hat Vorrang: exakte Händler-Kategorie -> unsere Kategorie.
export function classifyCategory(
  input: { name: string; category: string; description?: string },
  categoryMap: Record<string, string> = {}
): string | null {
  const mapped = categoryMap[input.category] ?? categoryMap[input.category.trim().toLowerCase()];
  if (mapped) return mapped;
  if (KNOWN_CATEGORIES.has(input.category)) return input.category;

  // Name und Händler-Kategorie zuerst; die Beschreibung nur als Notnagel,
  // weil dort oft andere Möbel erwähnt werden ("passend zum Sofa ...").
  for (const text of [`${input.name} ${input.category}`, input.description ?? ""]) {
    const t = text.toLowerCase();
    if (!t.trim()) continue;
    for (const rule of RULES) {
      if (!has(t, rule.any)) continue;
      if (rule.all && !has(t, rule.all)) continue;
      if (rule.none && has(t, rule.none)) continue;
      return rule.category;
    }
  }
  return null;
}

export function groupFor(category: string): ProductGroup {
  return DEKO_CATEGORIES.has(category) ? "deko" : "moebel";
}

// Material-Familie für die Kopplung (Bett + Nachttische usw.).
const FAMILIES: [string, string[]][] = [
  ["nussbaum", ["nussbaum", "walnut", "walnuss"]],
  ["eiche", ["eiche", "oak"]],
  ["teak", ["teak"]],
  ["rattan", ["rattan", "wicker", "geflecht", "korbgeflecht"]],
  ["boucle", ["bouclé", "boucle"]],
  ["weiss", ["weiß", "weiss", "white", "schneeweiß"]],
];

export function classifyFamily(text: string): string | undefined {
  const t = text.toLowerCase();
  return FAMILIES.find(([, words]) => has(t, words))?.[0];
}

// Stil-Tags der App aus Material- und Formwörtern. Ohne Treffer: beide
// Stile (neutral), damit das Stück überhaupt vorgeschlagen werden kann.
const STYLE_WORDS: Record<string, string[]> = {
  "warm-minimal": ["eiche", "oak", "leinen", "linen", "wolle", "wool", "messing", "brass",
    "terrakotta", "terracotta", "teak", "cord", "nussbaum", "walnut", "leder", "leather", "natur", "jute"],
  "soft-modern": ["bouclé", "boucle", "weiß", "weiss", "white", "rund", "round", "samt", "velvet",
    "opal", "papier", "paper", "rattan", "glas", "glass", "creme", "cream", "marmor", "marble"],
};

export function classifyStyleTags(text: string): string[] {
  const t = text.toLowerCase();
  const tags = Object.entries(STYLE_WORDS)
    .filter(([, words]) => has(t, words))
    .map(([tag]) => tag);
  return tags.length > 0 ? tags : Object.keys(STYLE_WORDS);
}

// Maße aus Text: "220 x 95 x 85 cm", "B 220 × T 95 × H 85", "Ø 45 x 160 cm",
// "200 x 300 cm" (Teppich), "2200 x 950 x 850 mm". Ergebnis in cm.
export function parseDimensions(
  text: string
): { widthCm: number; depthCm: number; heightCm: number } | null {
  if (!text) return null;
  const t = text.toLowerCase().replace(/,/g, ".");
  const nums = [...t.matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
  if (nums.length === 0) return null;
  const factor = /\bmm\b/.test(t) ? 0.1 : /\bm\b/.test(t) && !/cm/.test(t) ? 100 : 1;
  const v = nums.map((n) => Math.round(n * factor));
  const round = /ø|durchmesser|diameter/.test(t);
  if (round && v.length >= 2) return { widthCm: v[0], depthCm: v[0], heightCm: v[1] };
  if (round && v.length === 1) return { widthCm: v[0], depthCm: v[0], heightCm: 0 };
  if (v.length >= 3) return { widthCm: v[0], depthCm: v[1], heightCm: v[2] };
  if (v.length === 2) return { widthCm: v[0], depthCm: v[1], heightCm: 1 }; // flach (Teppich)
  return null;
}

// Preis aus Text: "1.299,00 €", "1299.00", "EUR 899", "1,299.00".
export function parsePriceCents(text: string): number | null {
  if (!text) return null;
  let t = text.replace(/[^\d.,]/g, "");
  if (!t) return null;
  // Nur Tausender-Trennzeichen ohne Nachkommastellen: "1.299" / "1,299"
  if (/^\d{1,3}([.,]\d{3})+$/.test(t)) t = t.replace(/[.,]/g, "");
  const lastComma = t.lastIndexOf(",");
  const lastDot = t.lastIndexOf(".");
  if (lastComma > lastDot) {
    t = t.replace(/\./g, "").replace(",", "."); // 1.299,00 -> 1299.00
  } else {
    t = t.replace(/,/g, ""); // 1,299.00 -> 1299.00
  }
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}
