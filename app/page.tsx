"use client";

import { useState } from "react";
import { ArrowDown, Camera, Swatches, ShoppingBag } from "@phosphor-icons/react";
import { RoomUploader } from "@/components/RoomUploader";
import { CompareSlider } from "@/components/CompareSlider";
import { ShopTheLook } from "@/components/ShopTheLook";
import { LookPreview } from "@/components/LookPreview";
import { EditPanel } from "@/components/EditPanel";
import {
  RoomMeasurements,
  emptyMeasurements,
  type Measurements,
  type Floorplan,
} from "@/components/RoomMeasurements";
import { formatEur, getLook, looksForRoom, rooms } from "@/lib/catalog";
import { MAX_STYLE_TEXT } from "@/lib/stylePrompt";
import type { RenderRoomResult } from "@/lib/ai/renderRoom";
import type { RoomDims } from "@/lib/fitCheck";

// Wandelt die Texteingaben in Zahlen um. Gibt nur dann Raummaße zurück,
// wenn mindestens ein Wert eingegeben wurde, sonst kein Passform-Check.
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

// Antwort von /api/render. Nur der Typ wird importiert, der Server-Code
// selbst landet nicht im Browser-Bundle.
type Result = RenderRoomResult;

// Gemeinsamer Rahmen für einen Eingabe-Block der linken Spalte.
function Step({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line pt-8 first:border-t-0 first:pt-0">
      <h2 className="text-base font-medium tracking-tight">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Home() {
  const [image, setImageState] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<string>(rooms[0].id);
  const roomLooks = looksForRoom(roomType);
  const [lookId, setLookId] = useState<string>(roomLooks[0].id);
  const [styleText, setStyleText] = useState("");
  const [renderCount, setRenderCount] = useState(0);
  const [measurements, setMeasurements] = useState<Measurements>(emptyMeasurements);
  const [floorplan, setFloorplan] = useState<Floorplan | null>(null);
  const [budgetEur, setBudgetEur] = useState<number>(3000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateNote, setEstimateNote] = useState<string | null>(null);
  // Welche der erzeugten Varianten gerade groß gezeigt wird (Position, nicht
  // URL: zwei Varianten können dieselbe Adresse haben, z. B. im Mock-Modus).
  const [chosenVariant, setChosenVariant] = useState(0);

  const look = getLook(lookId) ?? roomLooks[0];

  // Neues Foto/Standbild = altes Ergebnis passt nicht mehr dazu.
  function setImage(next: string | null) {
    setImageState(next);
    setResult(null);
    setChosenVariant(0);
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
        setError(data.error ?? "Das Bild konnte nicht erstellt werden.");
        return;
      }
      setResult(data);
      setChosenVariant(0);
      setRenderCount((n) => n + 1);
      // Auf kleinen Bildschirmen zum Ergebnis springen.
      if (window.matchMedia("(max-width: 1023px)").matches) {
        document.getElementById("ergebnis")?.scrollIntoView({ block: "start" });
      }
    } catch {
      setError("Keine Verbindung. Bitte prüfe dein Internet und versuche es erneut.");
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
        setEstimateNote(data.error ?? "Schätzung nicht möglich. Bitte trage die Maße selbst ein.");
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
      setEstimateNote("Grobe KI-Schätzung eingetragen. Bitte prüfen und anpassen.");
    } catch {
      setEstimateNote("Keine Verbindung. Bitte versuche es erneut.");
    } finally {
      setEstimating(false);
    }
  }

  const shownRender = result
    ? result.variantUrls?.[chosenVariant] ?? result.renderImageUrl
    : null;

  return (
    <main>
      {/* Hero: erst zeigen, was rauskommt, dann zum Gestalten einladen */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:pb-24 lg:pt-16">
        <div>
          <h1 className="text-4xl font-normal leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-[2rem] xl:text-[2.75rem]">
            Dein Raum, eingerichtet und kaufbar.
          </h1>
          <p className="mt-5 max-w-prose text-lg leading-relaxed text-muted">
            Ein Foto genügt. Wir richten deinen Raum in deinem Stil und Budget ein, und jedes
            Stück im Bild kannst du direkt kaufen.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href="#gestalten"
              className="press inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-medium text-surface hover:bg-ink/85"
            >
              Raum gestalten
              <ArrowDown size={16} />
            </a>
            <a
              href="#ablauf"
              className="text-sm text-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
            >
              So funktioniert es
            </a>
          </div>
        </div>
        <CompareSlider
          before="/demo/vorher.webp"
          after="/demo/nachher.webp"
          beforeAlt="Leerer Wohnraum mit Fenster und Holzboden"
          afterAlt="Derselbe Raum, eingerichtet mit Sofa, Sessel, Couchtisch, Teppich und Pflanze"
          aspect="aspect-[16/10]"
          note="Testbild, gerendert aus 3D-Modellen der Khronos glTF Sample Assets (Eric Chadwick, Rico Cilliers; CC BY 4.0 und CC0)."
        />
      </section>

      {/* Arbeitsfläche: links Eingaben, rechts Ergebnis */}
      <div
        id="gestalten"
        className="mx-auto grid max-w-7xl scroll-mt-6 gap-10 border-t border-line px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:pt-16"
      >
        <div>
          <h2 className="text-3xl font-normal leading-tight tracking-[-0.03em]">
            Gestalte deinen Raum.
          </h2>
          <p className="mt-3 max-w-prose text-muted">
            Foto hochladen, Stil und Budget wählen. Rechts siehst du, was wir aussuchen würden.
          </p>

          <div className="mt-10 space-y-8">
            <Step title="Foto deines Raums">
              <RoomUploader imageDataUrl={image} onImage={setImage} />
            </Step>

            <Step title="Raum und Stil">
              <div className="flex flex-wrap gap-x-5 gap-y-2" role="radiogroup" aria-label="Raumtyp">
                {rooms.map((r) => {
                  const active = r.id === roomType;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setRoomType(r.id);
                        setLookId(looksForRoom(r.id)[0].id);
                      }}
                      className={`press border-b py-1 text-sm transition-colors ${
                        active
                          ? "border-ink text-ink"
                          : "border-transparent text-muted hover:text-ink"
                      }`}
                    >
                      {r.name}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-x-8 sm:grid-cols-2" role="radiogroup" aria-label="Stil">
                {roomLooks.map((l) => {
                  const active = l.id === lookId;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setLookId(l.id)}
                      className="group flex items-start gap-3 border-b border-line py-3 text-left"
                    >
                      <span
                        aria-hidden
                        className={`mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors ${
                          active ? "border-accent" : "border-ink/25 group-hover:border-ink/50"
                        }`}
                      >
                        {active && <span className="h-2 w-2 rounded-full bg-accent" />}
                      </span>
                      <span>
                        <span className={`block text-sm font-medium ${active ? "text-ink" : "text-ink/80"}`}>
                          {l.name}
                        </span>
                        <span className="mt-0.5 block text-sm leading-snug text-muted">
                          {l.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <label className="mt-6 block">
                <span className="mb-1.5 block text-xs font-medium text-muted">
                  Eigene Wünsche, optional
                </span>
                <textarea
                  value={styleText}
                  maxLength={MAX_STYLE_TEXT}
                  rows={2}
                  onChange={(e) => setStyleText(e.target.value)}
                  placeholder="Zum Beispiel: hell, viel Holz, grüne Akzente"
                  className="w-full resize-none rounded-none border-0 border-b border-line bg-transparent px-0 py-2 text-sm outline-none transition-colors placeholder:text-subtle focus:border-accent"
                />
                <span className="mt-1 block text-right text-xs tabular-nums text-subtle">
                  {styleText.length} / {MAX_STYLE_TEXT}
                </span>
              </label>
            </Step>

            <Step title="Budget" hint="Wir füllen den Raum mit den besten Stücken, die hineinpassen.">
              <div className="flex items-baseline justify-between">
                <label htmlFor="budget" className="text-sm text-muted">
                  Gesamtbudget
                </label>
                <output htmlFor="budget" className="text-lg font-medium tabular-nums">
                  {formatEur(budgetEur * 100).replace(",00", "")}
                </output>
              </div>
              <input
                id="budget"
                type="range"
                min={500}
                max={30000}
                step={250}
                value={budgetEur}
                onChange={(e) => setBudgetEur(Number(e.target.value))}
                className="mt-3 w-full cursor-pointer"
              />
              <div className="mt-1 flex justify-between text-xs tabular-nums text-subtle">
                <span>500 €</span>
                <span>30.000 €</span>
              </div>
            </Step>

            <section className="border-t border-line pt-6">
              <details className="group">
                <summary className="press flex cursor-pointer list-none items-center justify-between rounded-md text-base font-medium tracking-tight">
                  Maße und Grundriss
                  <span className="text-sm font-normal text-subtle group-open:hidden">optional</span>
                </summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <button
                      type="button"
                      onClick={autoEstimate}
                      disabled={!image || estimating}
                      className="text-sm text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink disabled:cursor-not-allowed disabled:text-subtle disabled:no-underline"
                    >
                      {estimating ? "Wird geschätzt …" : "Maße aus dem Foto schätzen (Beta)"}
                    </button>
                    {!image && (
                      <p className="mt-1.5 text-xs text-subtle">Dafür zuerst ein Foto hochladen.</p>
                    )}
                    {estimateNote && (
                      <p role="status" className="mt-1.5 text-sm text-muted">
                        {estimateNote}
                      </p>
                    )}
                  </div>
                  <RoomMeasurements
                    value={measurements}
                    onChange={setMeasurements}
                    floorplan={floorplan}
                    onFloorplan={setFloorplan}
                  />
                </div>
              </details>
            </section>

            <div className="border-t border-line pt-6">
              <button
                type="button"
                onClick={generate}
                disabled={!image || loading}
                className="press inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-5 py-3.5 text-sm font-medium text-surface hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Raum wird gestaltet …" : "Raum gestalten"}
              </button>
              {!image && (
                <p className="mt-2 text-center text-xs text-subtle">
                  Lade zuerst ein Foto deines Raums hoch.
                </p>
              )}
              {error && (
                <p role="alert" className="mt-3 text-sm text-danger">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ergebnis-Spalte: Vorschau, Laden, Ergebnis */}
        <div id="ergebnis" className="scroll-mt-6 lg:sticky lg:top-6 lg:self-start">
          {loading ? (
            <div className="space-y-6" aria-live="polite" aria-busy="true">
              <span className="sr-only">Dein Raum wird gestaltet.</span>
              <div className="skeleton aspect-[4/3] rounded-md" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="skeleton h-14 w-14 rounded-md" />
                    <span className="flex-1 space-y-2">
                      <span className="skeleton block h-3 w-2/3 rounded" />
                      <span className="skeleton block h-3 w-1/3 rounded" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <CompareSlider
                key={`img-${renderCount}`}
                before={image ?? ""}
                after={shownRender ?? result.renderImageUrl}
                provider={result.provider}
              />
              {result.variantUrls && result.variantUrls.length > 1 && (
                <fieldset>
                  <legend className="mb-2 text-sm text-muted">Varianten: wähle deine liebste</legend>
                  <div className="flex flex-wrap gap-2">
                    {result.variantUrls.map((url, i) => {
                      const active = i === chosenVariant;
                      return (
                        <button
                          key={url + i}
                          type="button"
                          onClick={() => setChosenVariant(i)}
                          aria-pressed={active}
                          aria-label={`Variante ${i + 1}`}
                          className={`press overflow-hidden rounded-md ring-2 ring-offset-2 ring-offset-surface ${
                            active ? "ring-accent" : "ring-transparent hover:ring-line"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="h-16 w-20 object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}
              {result.provider === "replicate" && (
                <EditPanel baseImageUrl={shownRender ?? result.renderImageUrl} />
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
            <LookPreview lookId={lookId} lookName={look.name} budgetCents={budgetEur * 100} />
          )}
        </div>
      </div>

      {/* So funktioniert's: Verben als Überschriften, keine Nummern-Etiketten */}
      <section id="ablauf" className="scroll-mt-6 border-t border-line">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:py-20">
          <h2 className="text-3xl font-normal leading-tight tracking-[-0.03em]">
            Vom Foto zum fertigen Raum.
          </h2>
          <dl className="grid gap-8 sm:grid-cols-[auto_1fr] sm:gap-x-6">
            {[
              {
                icon: Camera,
                title: "Fotografieren",
                text: "Ein Foto oder ein kurzes Video reicht. Aus dem Video wählst du das beste Standbild.",
              },
              {
                icon: Swatches,
                title: "Stil wählen",
                text: "Raum, Stil und Budget festlegen. Die KI richtet deinen Raum ein und behält Wände und Fenster bei.",
              },
              {
                icon: ShoppingBag,
                title: "Kaufen",
                text: "Jedes Stück ist ein echtes Produkt. Tausche, was dir nicht gefällt, und kaufe den ganzen Look oder einzelne Teile.",
              },
            ].map(({ icon: IconCmp, title, text }) => (
              <div key={title} className="contents">
                <dt className="flex items-center gap-3 text-base font-medium sm:pt-0.5">
                  <IconCmp size={22} className="text-accent" />
                  {title}
                </dt>
                <dd className="-mt-5 max-w-prose text-muted sm:mt-0 sm:pt-1.5">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}
