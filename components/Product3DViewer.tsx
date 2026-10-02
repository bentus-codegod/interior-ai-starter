"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/catalog";

// 3D-Ansicht eines Produkts mit <model-viewer> (drehen, zoomen, auf dem
// Handy per AR in den eigenen Raum stellen). Die Bibliothek ist groß,
// deshalb wird sie erst geladen, wenn jemand die 3D-Ansicht öffnet.
export function Product3DViewer({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    import("@google/model-viewer")
      .then(() => alive && setReady(true))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} in 3D`}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-mist px-5 py-3">
          <span className="min-w-0">
            <span className="block truncate font-display">{product.name}</span>
            <span className="block text-xs text-ink/50">{product.dimensions}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-ink/50 underline underline-offset-4 hover:text-ink"
          >
            Schließen
          </button>
        </div>

        <div className="aspect-[4/3] w-full bg-paper">
          {failed ? (
            <p className="grid h-full place-items-center text-sm text-clay">
              3D-Ansicht konnte nicht geladen werden.
            </p>
          ) : ready && product.modelUrl ? (
            <model-viewer
              src={product.modelUrl}
              alt={`3D-Modell: ${product.name}`}
              camera-controls
              auto-rotate
              ar
              shadow-intensity="1"
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <p className="grid h-full place-items-center text-sm text-ink/40">
              3D-Modell wird geladen …
            </p>
          )}
        </div>

        <p className="px-5 py-3 text-[11px] text-ink/40">
          Ziehen zum Drehen, scrollen zum Zoomen. Auf dem Handy kannst du das
          Stück per AR in deinen Raum stellen.
        </p>
      </div>
    </div>
  );
}
