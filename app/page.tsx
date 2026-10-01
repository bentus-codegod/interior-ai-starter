"use client";

import { useState } from "react";
import { RoomUploader } from "@/components/RoomUploader";
import { RenderResult } from "@/components/RenderResult";
import { ShopTheLook } from "@/components/ShopTheLook";
import {
  RoomMeasurements,
  emptyMeasurements,
  type Measurements,
  type Floorplan,
} from "@/components/RoomMeasurements";
import { looks, type Product } from "@/lib/catalog";
import type { RoomDims } from "@/lib/fitCheck";

// Wandelt die Texteingaben in Zahlen um. Gibt nur dann Raummaße zurück,
// wenn mindestens ein Wert eingegeben wurde — sonst kein Passform-Check.
function toRoomDims(m: Measurements): RoomDims | undefined {
  const widthCm = Number(m.widthCm) || 0;
  const lengthCm = Number(m.lengthCm) || 0;
  const doorWidthCm = Number(m.doorWidthCm) || 0;
  if (widthCm <= 0 && lengthCm <= 0 && doorWidthCm <= 0) return undefined;
  return { widthCm, lengthCm, doorWidthCm };
}

type Result = {
  renderImageUrl: string;
  provider: string;
  look: { id: string; name: string; description: string };
  items: Product[];
  subtotalCents: number;
  alternatives: Record<string, Product[]>;
};

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [lookId, setLookId] = useState<string>(looks[0].id);
  const [measurements, setMeasurements] =
    useState<Measurements>(emptyMeasurements);
  const [floorplan, setFloorplan] = useState<Floorplan | null>(null);
  const [budgetEur, setBudgetEur] = useState<number>(3000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function generate() {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: image,
          lookId,
          budgetCents: budgetEur > 0 ? budgetEur * 100 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Render nicht möglich.");
        return;
      }
      setResult(data);
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
      {/* Hero */}
      <header className="max-w-prose">
        <p className="font-body text-sm text-sage">Interior AI</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] sm:text-6xl">
          Dein Raum, fertig gestaltet — und sofort kaufbar.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink/70">
          Lade ein Foto deines Zimmers hoch, wähle einen Look, und sieh es neu
          eingerichtet. Gefällt es dir, legst du den ganzen Raum mit einem Klick
          in den Warenkorb.
        </p>
      </header>

      {/* Flow */}
      <section className="mt-12 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-sm text-ink/50">1 · Raumfoto</h2>
            <div className="mt-3">
              <RoomUploader imageDataUrl={image} onImage={setImage} />
            </div>
          </div>

          <div>
            <h2 className="font-display text-sm text-ink/50">2 · Look wählen</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {looks.map((l) => {
                const active = l.id === lookId;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLookId(l.id)}
                    aria-pressed={active}
                    className={`rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-sage bg-sage/5"
                        : "border-mist bg-white hover:border-sage/50"
                    }`}
                  >
                    <span className="block font-display">{l.name}</span>
                    <span className="mt-1 block text-xs text-ink/55">
                      {l.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="font-display text-sm text-ink/50">Budget</h2>
            <div className="mt-3 rounded-xl border border-mist bg-white p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-ink/55">
                  Gesamtbudget für den Raum
                </span>
                <span className="font-display text-sm">
                  {budgetEur.toLocaleString("de-DE")} €
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={6000}
                step={100}
                value={budgetEur}
                onChange={(e) => setBudgetEur(Number(e.target.value))}
                className="mt-3 w-full accent-sage"
              />
              <p className="mt-1 text-[11px] text-ink/40">
                Die KI füllt den Raum bis zu deinem Budget.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-sm text-ink/50">
              3 · Raummaße & Grundriss <span className="text-ink/35">(optional)</span>
            </h2>
            <div className="mt-3">
              <RoomMeasurements
                value={measurements}
                onChange={setMeasurements}
                floorplan={floorplan}
                onFloorplan={setFloorplan}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={!image || loading}
            className="w-full rounded-xl bg-ink px-5 py-3.5 text-sm font-medium text-paper transition hover:bg-ink/90 disabled:opacity-40"
          >
            {loading ? "Wird gestaltet …" : "Raum gestalten"}
          </button>
          {error && <p className="text-sm text-clay">{error}</p>}
        </div>

        <div className="space-y-6">
          <h2 className="font-display text-sm text-ink/50">4 · Ergebnis</h2>
          {result ? (
            <div className="space-y-6">
              <RenderResult
                before={image!}
                after={result.renderImageUrl}
                provider={result.provider}
              />
              <ShopTheLook
                key={result.look.id + "-" + result.subtotalCents}
                items={result.items}
                alternatives={result.alternatives}
                room={toRoomDims(measurements)}
              />
            </div>
          ) : (
            <div className="grid aspect-[4/3] place-items-center rounded-2xl border border-dashed border-mist text-sm text-ink/40">
              Dein gestalteter Raum erscheint hier.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
