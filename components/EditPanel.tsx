"use client";

import { useState } from "react";

type EditMode = "swap" | "keep";

// Ruft die Phase-2-Pipeline (/api/edit) auf: Objekt erkennen -> freistellen
// -> nur diese Stelle neu malen. Bearbeitet standardmäßig das generierte
// Render. So nutzt die App die Modelle Grounding DINO + SAM + Inpainting.
export function EditPanel({ baseImageUrl }: { baseImageUrl: string }) {
  const [targetObject, setTargetObject] = useState("");
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<EditMode>("swap");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  // Welches Bild wird bearbeitet: zuerst das Render, danach das letzte Ergebnis
  // (so lassen sich mehrere Änderungen stapeln).
  const source = resultUrl ?? baseImageUrl;

  async function apply() {
    if (!targetObject.trim()) {
      setError("Bitte ein Möbelstück angeben, z. B. Sofa.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: source,
          targetObject: targetObject.trim(),
          prompt: prompt.trim(),
          mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Bearbeitung nicht möglich.");
        return;
      }
      setResultUrl(data.imageUrl);
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  const segBtn = (active: boolean) =>
    `press rounded-full border px-3.5 py-1.5 text-sm ${
      active
        ? "border-accent/40 bg-tint text-ink"
        : "border-line bg-panel text-muted hover:border-ink/30 hover:text-ink"
    }`;
  const field =
    "w-full rounded-md border border-line bg-panel px-3 py-2 text-sm outline-none transition-colors placeholder:text-subtle focus:border-accent";

  return (
    <section aria-labelledby="edit-title" className="enter rounded-md border border-line bg-panel p-5">
      <h2 id="edit-title" className="text-base font-medium tracking-tight">
        Möbel gezielt ändern <span className="text-sm font-normal text-subtle">Beta</span>
      </h2>
      <p className="mt-1 text-sm text-muted">
        Ein Stück tauschen oder behalten. Die KI erkennt es, stellt es frei und malt nur
        diese Stelle neu.
      </p>

      <div className="mt-4 grid gap-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Welches Möbelstück?</span>
          <input
            value={targetObject}
            onChange={(e) => setTargetObject(e.target.value)}
            maxLength={120}
            placeholder="Zum Beispiel: Sofa"
            className={field}
          />
        </label>

        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Modus">
          <button
            type="button"
            role="radio"
            aria-checked={mode === "swap"}
            onClick={() => setMode("swap")}
            className={segBtn(mode === "swap")}
          >
            Tauschen
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "keep"}
            onClick={() => setMode("keep")}
            className={segBtn(mode === "keep")}
          >
            Behalten, Rest ändern
          </button>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            {mode === "swap" ? "Wodurch ersetzen?" : "Wie soll der Rest aussehen?"}{" "}
            <span className="font-normal text-subtle">optional</span>
          </span>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={200}
            placeholder={
              mode === "swap" ? "Zum Beispiel: graues Bouclé-Sofa" : "Zum Beispiel: warme, helle Wände"
            }
            className={field}
          />
        </label>

        <button
          type="button"
          onClick={apply}
          disabled={loading}
          className="press w-full rounded-md bg-ink px-5 py-3 text-sm font-medium text-surface hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Wird angewendet …" : "Anwenden"}
        </button>
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      {loading && <div className="skeleton mt-4 aspect-[4/3] rounded-md" aria-hidden />}

      {resultUrl && !loading && (
        <figure className="enter mt-4">
          <div className="overflow-hidden rounded-md border border-line bg-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="Bearbeitetes Bild" className="aspect-[4/3] w-full object-cover" />
          </div>
          <figcaption className="mt-2 text-xs text-subtle">
            Bearbeitet. Weitere Änderungen bauen auf diesem Bild auf.
          </figcaption>
        </figure>
      )}
    </section>
  );
}
