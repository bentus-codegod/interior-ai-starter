"use client";

import { useRef, useState } from "react";
import {
  formatEur,
  isDeko,
  itemsTotalCents,
  type Product,
  type RoomItem,
} from "@/lib/catalog";
import { checkFit, type RoomDims, type FitVerdict } from "@/lib/fitCheck";
import {
  replaceWithCoupling,
  swipeDislike,
  swipeLike,
  type EditState,
} from "@/lib/roomEdit";
import { ArrowSquareOut, Cube, Heart, ShoppingBag, X } from "@phosphor-icons/react";
import { ProductThumb } from "@/components/ProductThumb";
import { Product3DViewer } from "@/components/Product3DViewer";

const fitStyles: Record<FitVerdict, { label: string; className: string }> = {
  fits: { label: "Passt", className: "text-accent" },
  tight: { label: "Knapp", className: "text-warn" },
  no: { label: "Passt nicht", className: "text-danger" },
};

// Ab dieser Wischstrecke (px) zählt eine Geste als Swipe.
const SWIPE_PX = 70;

export type ShopLook = {
  id: string;
  styleTag: string;
  couplings: string[][];
};

type SwipeAction = "like" | "dislike" | "swap_in" | "swap_out";

// Anonyme Swipe-Statistik an den Server (ohne Nutzer-ID). Fehler egal,
// die Statistik darf die Bedienung nie stören.
function track(lookId: string, events: { sku: string; action: SwipeAction }[]) {
  if (events.length === 0) return;
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: events.map((e) => ({ ...e, lookId })) }),
    keepalive: true,
  }).catch(() => {});
}

export function ShopTheLook({
  items: initialItems,
  alternatives,
  look,
  room,
  furnitureBudgetCents,
  logisticsCents,
}: {
  items: RoomItem[];
  // Tausch-Kandidaten je Kategorie, vom Server mitgeliefert.
  alternatives: Record<string, Product[]>;
  look: ShopLook;
  room?: RoomDims;
  furnitureBudgetCents: number; // 0 = ohne Budget
  logisticsCents: number; // geschätzte Logistik (0 = keine)
}) {
  const [state, setState] = useState<EditState>({
    items: initialItems,
    liked: new Set(),
    disliked: new Set(),
  });
  const [swapFor, setSwapFor] = useState<string | null>(null);
  const [view3d, setView3d] = useState<Product | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { items } = state;
  const subtotalCents = itemsTotalCents(items);

  // Neuen Zustand übernehmen und melden, was die Kopplung mitgeändert hat.
  function commit(next: EditState, changedIndex: number) {
    const coupled = next.items
      .map((it, i) => ({ it, before: state.items[i] }))
      .filter(
        ({ it, before }, i) => i !== changedIndex && it.product.sku !== before.product.sku
      )
      .map(({ it }) => it.product.category);
    setNotice(coupled.length ? `Passend dazu angepasst: ${coupled.join(", ")}` : null);
    setState(next);
  }

  function swap(index: number, next: Product) {
    track(look.id, [
      { sku: state.items[index].product.sku, action: "swap_out" },
      { sku: next.sku, action: "swap_in" },
    ]);
    commit({ ...state, items: replaceWithCoupling(state, index, next, look, alternatives) }, index);
    setSwapFor(null);
  }

  function dislike(index: number) {
    const next = swipeDislike(state, index, look, alternatives);
    if (!next) {
      setNotice(`Keine weiteren ${state.items[index].product.category}-Vorschläge.`);
      return;
    }
    track(look.id, [{ sku: state.items[index].product.sku, action: "dislike" }]);
    commit(next, index);
  }

  function like(index: number) {
    if (!state.liked.has(state.items[index].product.sku)) {
      track(look.id, [{ sku: state.items[index].product.sku, action: "like" }]);
    }
    setState(swipeLike(state, index));
  }

  async function checkout(lines: RoomItem[], key: string) {
    setLoading(key);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Nur SKU + Stückzahl — die Preise bestimmt der Server aus dem Katalog.
        body: JSON.stringify({
          items: lines.map((i) => ({ sku: i.product.sku, quantity: i.quantity })),
        }),
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
      setLoading(null);
    }
  }

  function renderItem(item: RoomItem, index: number) {
    const p = item.product;
    // Passform-Check nur für Möbel — bei Deko ist er sinnlos.
    const fit = room && !isDeko(p) ? checkFit(p, room) : null;
    const alts = (alternatives[p.category] ?? []).filter((a) => a.sku !== p.sku);
    const open = swapFor === p.sku;
    const liked = state.liked.has(p.sku);
    const linkBtn =
      "press inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-muted transition-colors hover:text-ink disabled:opacity-50";
    return (
      <SwipeRow
        key={p.category}
        onSwipeLeft={() => dislike(index)}
        onSwipeRight={() => like(index)}
      >
        <div className="flex items-start gap-4">
          <ProductThumb product={p} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium leading-snug">
              {item.quantity > 1 && <span className="text-accent">{item.quantity} × </span>}
              {p.name}
            </span>
            <span className="mt-0.5 block text-xs text-subtle">
              {p.dimensions}, {p.retailer}
              {p.leadTimeDays ? `, Lieferzeit ca. ${p.leadTimeDays} Tage` : ""}
            </span>
            {fit && (
              <span className="mt-1 block text-xs">
                <span className={`font-medium ${fitStyles[fit.verdict].className}`}>
                  {fitStyles[fit.verdict].label}.
                </span>{" "}
                <span className="text-subtle">{fit.reason}</span>
              </span>
            )}
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-sm font-medium tabular-nums">
              {formatEur(p.priceCents * item.quantity)}
            </span>
            {item.quantity > 1 && (
              <span className="block text-xs tabular-nums text-subtle">
                je {formatEur(p.priceCents)}
              </span>
            )}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 pl-[72px] text-xs">
          {/* Swipe als Knöpfe, für Maus und Tastatur */}
          <button
            type="button"
            onClick={() => dislike(index)}
            aria-label={`${p.name}: gefällt mir nicht, nächsten Vorschlag zeigen`}
            title="Gefällt mir nicht"
            className="press grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:text-danger"
          >
            <X size={14} />
          </button>
          <button
            type="button"
            onClick={() => like(index)}
            aria-pressed={liked}
            aria-label={`${p.name}: gefällt mir, behalten`}
            title="Gefällt mir"
            className={`press mr-2 grid h-8 w-8 place-items-center rounded-full transition-colors ${
              liked ? "text-accent" : "text-muted hover:text-accent"
            }`}
          >
            <Heart size={14} weight={liked ? "fill" : "bold"} />
          </button>
          {alts.length > 0 && (
            <button
              type="button"
              onClick={() => setSwapFor(open ? null : p.sku)}
              aria-expanded={open}
              className={linkBtn}
            >
              {open ? "Schließen" : "Tauschen"}
            </button>
          )}
          {p.modelUrl && (
            <button type="button" onClick={() => setView3d(p)} className={linkBtn}>
              <Cube size={14} /> 3D
            </button>
          )}
          {p.affiliateUrl && (
            // Über /go/: zählt den Klick und leitet auf den Händler-Link weiter.
            <a
              href={`/go/${encodeURIComponent(p.sku)}?look=${encodeURIComponent(look.id)}`}
              target="_blank"
              rel="noopener sponsored"
              className={linkBtn}
            >
              Händler <ArrowSquareOut size={13} />
            </a>
          )}
          <button
            type="button"
            onClick={() => checkout([item], p.sku)}
            disabled={loading !== null}
            className={linkBtn}
          >
            {loading === p.sku ? "Öffnet …" : "Einzeln kaufen"}
          </button>
        </div>

        {open && (
          <div className="enter mt-2 ml-[72px] space-y-1 border-l border-line pl-2">
            {alts.map((a) => (
              <button
                key={a.sku}
                type="button"
                onClick={() => swap(index, a)}
                className="press flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:text-accent"
              >
                <ProductThumb product={a} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{a.name}</span>
                  <span className="block text-xs text-subtle">{a.retailer}</span>
                </span>
                <span className="text-xs tabular-nums text-muted">{formatEur(a.priceCents)}</span>
              </button>
            ))}
          </div>
        )}
      </SwipeRow>
    );
  }

  const indexed = items.map((item, index) => ({ item, index }));
  const furniture = indexed.filter(({ item }) => !isDeko(item.product));
  const deko = indexed.filter(({ item }) => isDeko(item.product));
  const overBudget = furnitureBudgetCents > 0 && subtotalCents > furnitureBudgetCents;

  return (
    <section aria-labelledby="shop-title" className="enter">
      <div className="border-b border-line pb-4">
        <h2 id="shop-title" className="text-base font-medium tracking-tight">
          Diesen Look kaufen
        </h2>
        <p className="mt-1 text-sm text-muted">
          Wische ein Stück nach links für einen neuen Vorschlag, nach rechts zum Behalten.
          Zusammengehörige Stücke ziehen mit.
        </p>
        {notice && (
          <p role="status" className="enter mt-3 text-sm text-accent">
            {notice}
          </p>
        )}
      </div>

      <ul className="divide-y divide-line">
        {furniture.map(({ item, index }) => renderItem(item, index))}
      </ul>

      {deko.length > 0 && (
        <>
          <h3 className="border-t border-line pt-6 text-sm font-medium">
            Deko und Accessoires
          </h3>
          <ul className="divide-y divide-line">
            {deko.map(({ item, index }) => renderItem(item, index))}
          </ul>
        </>
      )}

      <div className="space-y-1.5 border-t border-line py-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted">Zwischensumme</span>
          <span className="text-xl font-medium tabular-nums">{formatEur(subtotalCents)}</span>
        </div>
        {furnitureBudgetCents > 0 && (
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-subtle">Budget für Möbel und Deko</span>
            <span className={`tabular-nums ${overBudget ? "font-medium text-danger" : "text-subtle"}`}>
              {formatEur(furnitureBudgetCents)}
              {overBudget && ", überschritten"}
            </span>
          </div>
        )}
        {logisticsCents > 0 && (
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-subtle">Reserviert für Logistik (Schätzung)</span>
            <span className="tabular-nums text-subtle">{formatEur(logisticsCents)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-line pt-4">
        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        <button
          type="button"
          onClick={() => checkout(items, "all")}
          disabled={loading !== null}
          className="press inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-medium text-surface hover:bg-ink/85 disabled:opacity-60"
        >
          <ShoppingBag size={18} />
          {loading === "all" ? "Kasse öffnet …" : "Ganzen Look kaufen"}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-subtle">
          Bezahlung über Stripe (Test-Modus). Links zu Händlern sind Werbe- bzw.
          Affiliate-Links: Kaufst du darüber, erhalten wir eventuell eine Provision.
          Für dich ändert sich der Preis nicht.
        </p>
      </div>

      {view3d && <Product3DViewer product={view3d} onClose={() => setView3d(null)} />}
    </section>
  );
}

// Listenzeile, die sich per Touch/Maus seitlich wischen lässt.
// Nach links = gefällt mir nicht, nach rechts = gefällt mir.
function SwipeRow({
  children,
  onSwipeLeft,
  onSwipeRight,
}: {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [dx, setDx] = useState(0);

  function onPointerDown(e: React.PointerEvent) {
    // Nur auf der Zeile selbst wischen, nicht auf Knöpfen/Links.
    if ((e.target as HTMLElement).closest("button, a")) return;
    start.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!start.current) return;
    const x = e.clientX - start.current.x;
    const y = e.clientY - start.current.y;
    // Senkrechtes Scrollen nicht stören.
    if (Math.abs(y) > Math.abs(x) && Math.abs(x) < 10) return;
    setDx(Math.max(-140, Math.min(140, x)));
  }
  function onPointerEnd() {
    if (!start.current) return;
    start.current = null;
    if (dx <= -SWIPE_PX) onSwipeLeft();
    else if (dx >= SWIPE_PX) onSwipeRight();
    setDx(0);
  }

  const hint = dx <= -SWIPE_PX ? "bg-danger/5" : dx >= SWIPE_PX ? "bg-tint/60" : "";
  return (
    <li
      className={`touch-pan-y select-none py-3 transition-colors ${hint}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onPointerLeave={onPointerEnd}
    >
      <div
        style={{
          transform: dx ? `translateX(${dx}px)` : undefined,
          transition: dx ? "none" : "transform 200ms var(--ease-out)",
        }}
      >
        {children}
      </div>
    </li>
  );
}
