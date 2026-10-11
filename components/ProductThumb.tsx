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

// Produktbild: echtes Foto, falls vorhanden, sonst eine Kachel mit
// Kategorie-Icon. Die Kachel nimmt die Produktfarbe nur als Hauch auf
// (Pastell, per color-mix mit der Fläche gemischt), damit Ocker- und
// Messingtöne aus dem Katalog nicht laut werden.
export function ProductThumb({
  product,
  size = "md",
}: {
  product: Product;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-9 w-9 rounded-md" : "h-14 w-14 rounded-md";

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
      className={`${box} grid shrink-0 place-items-center text-ink/60 ring-1 ring-inset ring-line/80`}
      style={{ backgroundColor: `color-mix(in oklab, ${product.tint} 30%, rgb(var(--panel)))` }}
      aria-hidden
    >
      <IconCmp size={size === "sm" ? 18 : 24} />
    </span>
  );
}
