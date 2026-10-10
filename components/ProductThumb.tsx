"use client";

import {
  Armchair,
  Bed,
  Chair,
  Couch,
  Cube,
  FrameCorners,
  Lamp,
  LampPendant,
  Lightbulb,
  Plant,
  PottedPlant,
  Table,
  Desk,
  Leaf,
  Rows,
  Waves,
  type Icon,
} from "@phosphor-icons/react";
import type { Product } from "@/lib/catalog";

// Kategorie -> Icon (Phosphor, eine Familie, eine Strichstärke).
const ICONS: Record<string, Icon> = {
  Sofa: Couch,
  "Outdoor-Lounge": Couch,
  Sessel: Armchair,
  Stuhl: Chair,
  Bett: Bed,
  Couchtisch: Table,
  Esstisch: Table,
  "Outdoor-Tisch": Table,
  Nachttisch: Desk,
  Kommode: Desk,
  Sideboard: Desk,
  Regal: Desk,
  Leuchte: Lamp,
  Nachttischleuchte: Lamp,
  Pendelleuchte: LampPendant,
  "Outdoor-Leuchte": Lightbulb,
  Pflanze: Plant,
  Pflanzkübel: PottedPlant,
  Wandbild: FrameCorners,
  Vase: Leaf,
  Teppich: Rows,
  "Outdoor-Teppich": Rows,
  Kissen: Waves,
  Plaid: Waves,
};

// Helle Kachel -> dunkles Icon, dunkle Kachel -> helles Icon.
function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

// Produktbild: echtes Foto, falls vorhanden, sonst eine Kachel in der
// Produktfarbe mit Kategorie-Icon. So läuft der Katalog mit und ohne Bilder.
export function ProductThumb({
  product,
  size = "md",
}: {
  product: Product;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-9 w-9 rounded-lg" : "h-14 w-14 rounded-lg";

  if (product.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.imageUrl}
        alt=""
        loading="lazy"
        className={`${box} shrink-0 border border-line bg-panel object-cover`}
      />
    );
  }

  const IconCmp = ICONS[product.category] ?? Cube;
  return (
    <span
      className={`${box} grid shrink-0 place-items-center ring-1 ring-inset ring-black/5`}
      style={{ backgroundColor: product.tint }}
      aria-hidden
    >
      <IconCmp
        size={size === "sm" ? 18 : 24}
        weight="regular"
        color={isLight(product.tint) ? "rgba(20,24,22,0.72)" : "rgba(246,247,245,0.9)"}
      />
    </span>
  );
}
