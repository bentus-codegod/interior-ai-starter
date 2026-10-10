"use client";

import { useEffect, useState } from "react";
import { formatEur, isDeko, type RoomItem } from "@/lib/catalog";
import { ProductThumb } from "@/components/ProductThumb";

type Preview = { items: RoomItem[]; subtotalCents: number };

// Leerzustand der Ergebnis-Spalte, der die Oberfläche erklärt: zeigt mit
// echten Katalogdaten, welche Stücke zum gewählten Look und Budget passen,
// noch bevor ein Foto da ist. Aktualisiert sich, wenn Look oder Budget
// sich ändern (leicht verzögert, damit der Budget-Regler nicht flutet).
export function LookPreview({
  lookId,
  lookName,
  budgetCents,
}: {
  lookId: string;
  lookName: string;
  budgetCents: number;
}) {
  const [data, setData] = useState<Preview | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      fetch(`/api/preview?look=${encodeURIComponent(lookId)}&budget=${budgetCents}`, {
        signal: ctrl.signal,
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((d: Preview) => {
          setData(d);
          setFailed(false);
        })
        .catch((e) => {
          if (e?.name !== "AbortError") setFailed(true);
        });
    }, 180);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [lookId, budgetCents]);

  const furniture = data?.items.filter((i) => !isDeko(i.product)) ?? [];
  const deko = data?.items.filter((i) => isDeko(i.product)) ?? [];

  return (
    <section aria-labelledby="preview-title">
      <div className="pb-4">
        <h2 id="preview-title" className="text-base font-medium tracking-tight">
          {lookName}: diese Stücke würden wir wählen
        </h2>
        <p className="mt-1 text-sm text-muted">
          Lade ein Foto hoch, dann siehst du sie in deinem Raum und kannst jedes Stück tauschen.
        </p>
      </div>

      {failed && (
        <p className="py-6 text-sm text-danger">Vorschau gerade nicht verfügbar.</p>
      )}

      {!data && !failed && (
        <ul className="space-y-3 border-t border-line py-4" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-center gap-4">
              <span className="skeleton h-14 w-14 rounded-md" />
              <span className="flex-1 space-y-2">
                <span className="skeleton block h-3 w-2/3 rounded" />
                <span className="skeleton block h-3 w-1/3 rounded" />
              </span>
            </li>
          ))}
        </ul>
      )}

      {data && (
        <>
          <ul className="grid gap-x-6 gap-y-3 border-t border-line py-4 sm:grid-cols-2">
            {furniture.map(({ product, quantity }) => (
              <li key={product.sku} className="flex items-center gap-3">
                <ProductThumb product={product} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">
                    {quantity > 1 && <span className="font-medium">{quantity} × </span>}
                    {product.name}
                  </span>
                  <span className="block text-xs tabular-nums text-subtle">
                    {formatEur(product.priceCents * quantity)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {deko.length > 0 && (
            <p className="border-t border-line py-3 text-sm text-muted">
              Dazu {deko.length} Deko-Stücke, zum Beispiel {deko[0].product.name}.
            </p>
          )}
          <div className="flex items-baseline justify-between border-t border-line py-4">
            <span className="text-sm text-muted">Summe dieses Looks</span>
            <span className="text-lg font-medium tabular-nums">{formatEur(data.subtotalCents)}</span>
          </div>
        </>
      )}
    </section>
  );
}
