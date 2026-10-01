"use client";

import type { Product } from "@/lib/catalog";

// Produktbild: echtes Foto, falls vorhanden — sonst die farbige Kachel mit
// Kategorie-Kürzel. So läuft der Katalog mit und ohne Händler-Bilder.
export function ProductThumb({
  product,
  size = "md",
}: {
  product: Product;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-8 w-8 rounded text-[10px]" : "h-12 w-12 rounded-lg text-xs";

  if (product.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.imageUrl}
        alt={product.name}
        loading="lazy"
        className={`${box} shrink-0 border border-mist bg-white object-cover`}
      />
    );
  }

  return (
    <span
      className={`${box} grid shrink-0 place-items-center font-medium text-white/90`}
      style={{ backgroundColor: product.tint }}
      aria-hidden
    >
      {product.category.slice(0, 2)}
    </span>
  );
}
