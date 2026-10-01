"use client";

import { useState } from "react";
import { formatEur, isDeko, type Product } from "@/lib/catalog";
import { checkFit, type RoomDims, type FitVerdict } from "@/lib/fitCheck";
import { alternatives } from "@/lib/designBrain";
import { ProductThumb } from "@/components/ProductThumb";
import { Product3DViewer } from "@/components/Product3DViewer";

const fitStyles: Record<FitVerdict, { label: string; className: string }> = {
  fits: { label: "Passt", className: "bg-sage/15 text-sage" },
  tight: { label: "Knapp", className: "bg-brass/15 text-brass" },
  no: { label: "Passt nicht", className: "bg-clay/15 text-clay" },
};

export function ShopTheLook({
  items: initialItems,
  room,
}: {
  items: Product[];
  room?: RoomDims;
}) {
  const [items, setItems] = useState<Product[]>(initialItems);
  const [swapFor, setSwapFor] = useState<string | null>(null);
  const [view3d, setView3d] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotalCents = items.reduce((s, p) => s + p.priceCents, 0);

  function swap(oldSku: string, next: Product) {
    setItems((cur) => cur.map((p) => (p.sku === oldSku ? next : p)));
    setSwapFor(null);
  }

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Nur die SKUs — die Preise bestimmt der Server aus dem Katalog.
        body: JSON.stringify({ skus: items.map((p) => p.sku) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Checkout nicht möglich.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  const furniture = items.filter((p) => !isDeko(p));
  const deko = items.filter(isDeko);

  function renderItem(p: Product) {
    // Passform-Check nur für Möbel — bei Deko ist er sinnlos.
    const fit = room && !isDeko(p) ? checkFit(p, room) : null;
    const alts = alternatives(p);
    const open = swapFor === p.sku;
    return (
      <li key={p.sku} className="py-3">
        <div className="flex items-center gap-4">
          <ProductThumb product={p} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">{p.name}</span>
            <span className="block text-xs text-ink/50">
              {p.dimensions} · {p.retailer}
            </span>
            {fit && (
              <span className="mt-1 inline-flex items-center gap-1.5">
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${fitStyles[fit.verdict].className}`}
                >
                  {fitStyles[fit.verdict].label}
                </span>
                <span className="text-[11px] text-ink/45">{fit.reason}</span>
              </span>
            )}
          </span>
          <span className="text-sm tabular-nums">{formatEur(p.priceCents)}</span>
        </div>

        <div className="mt-1.5 flex items-center gap-3 pl-16 text-xs">
          {alts.length > 0 && (
            <button
              type="button"
              onClick={() => setSwapFor(open ? null : p.sku)}
              className="text-sage underline underline-offset-4 hover:text-ink"
            >
              {open ? "Schließen" : "Tauschen"}
            </button>
          )}
          {p.modelUrl && (
            <button
              type="button"
              onClick={() => setView3d(p)}
              className="text-sage underline underline-offset-4 hover:text-ink"
            >
              In 3D ansehen
            </button>
          )}
          <a
            href={p.affiliateUrl}
            target="_blank"
            rel="noopener sponsored"
            className="text-ink/50 underline underline-offset-4 hover:text-ink"
          >
            Beim Händler ansehen ↗
          </a>
        </div>

        {open && (
          <div className="mt-2 space-y-1.5 rounded-lg border border-mist bg-paper p-2 pl-16">
            {alts.map((a) => (
              <button
                key={a.sku}
                type="button"
                onClick={() => swap(p.sku, a)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-white"
              >
                <ProductThumb product={a} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs">{a.name}</span>
                  <span className="block text-[11px] text-ink/45">
                    {a.retailer}
                  </span>
                </span>
                <span className="text-xs tabular-nums text-ink/70">
                  {formatEur(a.priceCents)}
                </span>
              </button>
            ))}
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="rounded-2xl border border-mist bg-white p-5">
      <h3 className="font-display text-xl">Diesen Look kaufen</h3>
      <ul className="mt-4 divide-y divide-mist">{furniture.map(renderItem)}</ul>

      {deko.length > 0 && (
        <>
          <h4 className="mt-5 text-xs font-medium uppercase tracking-wide text-ink/45">
            Deko &amp; Accessoires
          </h4>
          <ul className="mt-1 divide-y divide-mist">{deko.map(renderItem)}</ul>
        </>
      )}

      <div className="mt-4 flex items-baseline justify-between border-t border-mist pt-4">
        <span className="text-sm text-ink/60">Zwischensumme</span>
        <span className="font-display text-lg tabular-nums">
          {formatEur(subtotalCents)}
        </span>
      </div>

      {error && <p className="mt-3 text-sm text-clay">{error}</p>}

      <button
        type="button"
        onClick={checkout}
        disabled={loading}
        className="mt-4 w-full rounded-xl bg-brass px-5 py-3 text-sm font-medium text-white transition hover:bg-brass/90 disabled:opacity-60"
      >
        {loading ? "Wird geöffnet …" : "Ganzen Look kaufen"}
      </button>
      <p className="mt-2 text-center text-xs text-ink/40">
        Bezahlung über Stripe (Test-Modus). Einzelne Produkte kaufst du über
        „Beim Händler ansehen".
      </p>
      <p className="mt-3 border-t border-mist pt-3 text-center text-[11px] text-ink/40">
        * Affiliate-Hinweis: Links zu Händlern sind Werbe-/Affiliate-Links.
        Kaufst du darüber, erhalten wir ggf. eine Provision — für dich ohne
        Aufpreis.
      </p>

      {view3d && (
        <Product3DViewer product={view3d} onClose={() => setView3d(null)} />
      )}
    </div>
  );
}
