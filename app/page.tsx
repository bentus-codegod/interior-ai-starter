"use client";

import { useState } from "react";
import { RoomUploader } from "@/components/RoomUploader";
import { RenderResult } from "@/components/RenderResult";
import { ShopTheLook } from "@/components/ShopTheLook";
import { EditPanel } from "@/components/EditPanel";
import {
  RoomMeasurements,
  emptyMeasurements,
  type Measurements,
  type Floorplan,
} from "@/components/RoomMeasurements";
import { looksForRoom, rooms } from "@/lib/catalog";
import { MAX_STYLE_TEXT } from "@/lib/stylePrompt";
import type { RenderRoomResult } from "@/lib/ai/renderRoom";
import type { RoomDims } from "@/lib/fitCheck";

// Wandelt die Texteingaben in Zahlen um. Gibt nur dann Raummaße zurück,
// wenn mindestens ein Wert eingegeben wurde — sonst kein Passform-Check.
function toRoomDims(m: Measurements): RoomDims | undefined {
  const widthCm = Number(m.widthCm) || 0;
  const lengthCm = Number(m.lengthCm) || 0;
  const doorWidthCm = Number(m.doorWidthCm) || 0;
  const ceilingHeightCm = Number(m.ceilingHeightCm) || 0;
  if (widthCm <= 0 && lengthCm <= 0 && doorWidthCm <= 0 && ceilingHeightCm <= 0) {
    return undefined;
  }
  return { widthCm, lengthCm, doorWidthCm, ceilingHeightCm };
}

// Antwort von /api/render. Nur der Typ wird importiert — der Server-Code
// selbst landet nicht im Browser-Bundle.
type Result = RenderRoomResult;

export default function Home() {
  const [image, setImageState] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<string>(rooms[0].id);
  const roomLooks = looksForRoom(roomType);
  const [lookId, setLookId] = useState<string>(roomLooks[0].id);
  const [styleText, setStyleText] = useState("");
  const [renderCount, setRenderCount] = useState(0);
  const [measurements, setMeasurements] =
    useState<Measurements>(emptyMeasurements);
  const [floorplan, setFloorplan] = useState<Floorplan | null>(null);
  const [budgetEur, setBudgetEur] = useState<number>(3000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateNote, setEstimateNote] = useState<string | null>(null);
  // Welche der erzeugten Varianten gerade groß gezeigt wird.
  const [chosenRender, setChosenRender] = useState<string | null>(null);

  // Neues Foto/Standbild = altes Ergebnis passt nicht mehr dazu.
  function setImage(next: string | null) {
    setImageState(next);
    setResult(null);
    setChosenRender(null);
    setError(null);
  }

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
          styleText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Render nicht möglich.");
        return;
      }
      setResult(data);
      setChosenRender(data.renderImageUrl);
      setRenderCount((n) => n + 1);
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  // Grobe Raum-Schätzung per Vision-Modell -> füllt die Maßfelder vor.
  async function autoEstimate() {
    if (!image) return;
    setEstimating(true);
    setEstimateNote(null);
    try {
      const res = await fetch("/api/measure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [image] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEstimateNote(data.error ?? "Schätzung nicht möglich — bitte manuell eintragen.");
        return;
      }
      setMeasurements({
        widthCm: data.widthCm ? String(data.widthCm) : measurements.widthCm,
        lengthCm: data.lengthCm ? String(data.lengthCm) : measurements.lengthCm,
        doorWidthCm: data.doorWidthCm ? String(data.doorWidthCm) : measurements.doorWidthCm,
        ceilingHeightCm: data.ceilingHeightCm
          ? String(data.ceilingHeightCm)
          : measurements.ceilingHeightCm,
      });
      setEstimateNote("Grobe KI-Schätzung eingetragen — bitte prüfen und anpassen.");
    } catch {
      setEstimateNote("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setEstimating(false);
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
            <h2 className="font-display text-sm text-ink/50">2 · Raum &amp; Look</h2>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Raumtyp">
              {rooms.map((r) => {
                const active = r.id === roomType;
                return (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setRoomType(r.id);
                      setLookId(looksForRoom(r.id)[0].id);
                    }}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      active
                        ? "border-sage bg-sage text-white"
                        : "border-mist bg-white text-ink/70 hover:border-sage/50"
                    }`}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {roomLooks.map((l) => {
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
            <label className="mt-3 block">
              <span className="mb-1 block text-xs text-ink/55">
                Eigener Stil in Worten <span className="text-ink/35">(optional)</span>
              </span>
              <textarea
                value={styleText}
                maxLength={MAX_STYLE_TEXT}
                rows={2}
                onChange={(e) => setStyleText(e.target.value)}
                placeholder="z. B. hell, skandinavisch, viel Holz, grüne Akzente"
                className="w-full resize-none rounded-xl border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-sage"
              />
              <span className="block text-right text-[11px] text-ink/35">
                {styleText.length}/{MAX_STYLE_TEXT} · fließt in das KI-Bild ein
              </span>
            </label>
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
                max={30000}
                step={250}
                value={budgetEur}
                onChange={(e) => setBudgetEur(Number(e.target.value))}
                className="mt-3 w-full accent-sage"
              />
              <p className="mt-1 text-[11px] text-ink/40">
                Die KI füllt den Raum bis zu deinem Budget — auch für eine
                Komplettausstattung.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-sm text-ink/50">
              3 · Raummaße & Grundriss <span className="text-ink/35">(optional)</span>
            </h2>
            <div className="mt-3">
              <button
                type="button"
                onClick={autoEstimate}
                disabled={!image || estimating}
                className="rounded-full border border-sage bg-sage/5 px-3.5 py-1.5 text-sm text-sage transition hover:bg-sage/10 disabled:opacity-40"
              >
                {estimating ? "Wird geschätzt …" : "Maße automatisch schätzen (Beta)"}
              </button>
              {estimateNote && (
                <p className="mt-2 text-xs text-ink/55">{estimateNote}</p>
              )}
            </div>
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
                before={image ?? ""}
                after={chosenRender ?? result.renderImageUrl}
                provider={result.provider}
              />
              {result.variantUrls && result.variantUrls.length > 1 && (
                <div>
                  <p className="mb-2 text-xs text-ink/55">
                    Varianten — wähle deine liebste:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.variantUrls.map((url, i) => {
                      const active = (chosenRender ?? result.renderImageUrl) === url;
                      return (
                        <button
                          key={url + i}
                          type="button"
                          onClick={() => setChosenRender(url)}
                          aria-pressed={active}
                          className={`overflow-hidden rounded-xl border-2 transition ${
                            active ? "border-sage" : "border-mist hover:border-sage/50"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Variante ${i + 1}`}
                            className="h-16 w-20 object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {result.provider === "replicate" && (
                <EditPanel baseImageUrl={chosenRender ?? result.renderImageUrl} />
              )}
              <ShopTheLook
                key={renderCount}
                items={result.items}
                alternatives={result.alternatives}
                look={result.look}
                room={toRoomDims(measurements)}
                furnitureBudgetCents={result.budget.furnitureBudgetCents}
                logisticsCents={result.budget.logisticsCents}
              />
            </div>
          ) : (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-mist px-6 text-center">
              <p className="text-sm text-ink/60">
                Dein gestalteter Raum erscheint hier.
              </p>
              <ol className="space-y-1 text-xs text-ink/45">
                <li>1 · Raumfoto hochladen (oder kurzes Video)</li>
                <li>2 · Look wählen oder in Worten beschreiben</li>
                <li>3 · „Raum gestalten" → Varianten vergleichen</li>
                <li>4 · Passende Möbel direkt beim Händler ansehen</li>
              </ol>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
