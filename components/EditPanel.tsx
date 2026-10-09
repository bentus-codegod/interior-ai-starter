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

  return (
    <div className="rounded-2xl border border-mist bg-white p-4">
      <h3 className="font-display text-sm text-ink/70">
        Möbel gezielt ändern <span className="text-ink/35">(Beta)</span>
      </h3>
      <p className="mt-1 text-xs text-ink/50">
        Einzelnes Stück tauschen oder behalten — die KI erkennt es, stellt es
        frei und malt nur diese Stelle neu.
      </p>

      <div className="mt-3 grid gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-ink/55">Welches Möbel?</span>
          <input
            value={targetObject}
            onChange={(e) => setTargetObject(e.target.value)}
            maxLength={120}
            placeholder="z. B. Sofa, Couch"
            className="w-full rounded-xl border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-sage"
          />
        </label>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Modus">
          <button
            type="button"
            aria-pressed={mode === "swap"}
            onClick={() => setMode("swap")}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              mode === "swap"
                ? "border-sage bg-sage text-white"
                : "border-mist bg-white text-ink/70 hover:border-sage/50"
            }`}
          >
            Tauschen
          </button>
          <button
            type="button"
            aria-pressed={mode === "keep"}
            onClick={() => setMode("keep")}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              mode === "keep"
                ? "border-sage bg-sage text-white"
                : "border-mist bg-white text-ink/70 hover:border-sage/50"
            }`}
          >
            Behalten, Rest ändern
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs text-ink/55">
            {mode === "swap"
              ? "Wodurch ersetzen?"
              : "Wie soll der Rest aussehen?"}{" "}
            <span className="text-ink/35">(optional)</span>
          </span>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={200}
            placeholder={
              mode === "swap"
                ? "z. B. graues Bouclé-Sofa"
                : "z. B. warme, helle Wände"
            }
            className="w-full rounded-xl border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-sage"
          />
        </label>

        <button
          type="button"
          onClick={apply}
          disabled={loading}
          className="w-full rounded-xl bg-ink px-5 py-3 text-sm font-medium text-paper transition hover:bg-ink/90 disabled:opacity-40"
        >
          {loading ? "Wird angewendet …" : "Anwenden"}
        </button>
        {error && <p className="text-sm text-clay">{error}</p>}
      </div>

      {resultUrl && (
        <figure className="mt-4 space-y-2">
          <div className="overflow-hidden rounded-2xl border border-mist bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="Bearbeitet" className="aspect-[4/3] w-full object-cover" />
          </div>
          <figcaption className="text-xs text-ink/50">Bearbeitet · du kannst darauf aufbauen</figcaption>
        </figure>
      )}
    </div>
  );
}
