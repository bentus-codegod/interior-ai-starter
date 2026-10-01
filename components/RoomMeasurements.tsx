"use client";

import { useRef } from "react";

export type Measurements = {
  widthCm: string;
  lengthCm: string;
  doorWidthCm: string;
  ceilingHeightCm: string;
};

export const emptyMeasurements: Measurements = {
  widthCm: "",
  lengthCm: "",
  doorWidthCm: "",
  ceilingHeightCm: "",
};

// Optionaler Grundriss (Bild oder PDF). Wird erfasst und angezeigt; die
// KI-Nutzung fürs Layout ist ein späterer Ausbau (Phase 2).
export type Floorplan = { dataUrl: string; name: string; isImage: boolean };

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink/55">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-sage"
      />
    </label>
  );
}

// Leichte, geräteunabhängige Maßeingabe fürs Web-MVP, plus optionaler
// Grundriss-Upload. Kein AR/LiDAR — das kommt später als natives Feature.
// Ohne Eingabe läuft der Ablauf normal weiter, nur ohne Passform-Check.
export function RoomMeasurements({
  value,
  onChange,
  floorplan,
  onFloorplan,
}: {
  value: Measurements;
  onChange: (m: Measurements) => void;
  floorplan: Floorplan | null;
  onFloorplan: (f: Floorplan | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFloorplan(file: File) {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      alert("Grundriss als Bild (JPEG, PNG, WebP) oder PDF.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert("Grundriss ist zu groß (max. 15 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      onFloorplan({ dataUrl: String(reader.result), name: file.name, isImage });
    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-xl border border-mist bg-white p-4">
      <p className="text-xs text-ink/55">
        Optional — für den Passform-Check. In Zentimetern.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field
          label="Raumbreite"
          value={value.widthCm}
          onChange={(v) => onChange({ ...value, widthCm: v })}
          placeholder="z. B. 400"
        />
        <Field
          label="Raumlänge"
          value={value.lengthCm}
          onChange={(v) => onChange({ ...value, lengthCm: v })}
          placeholder="z. B. 520"
        />
        <Field
          label="Türbreite"
          value={value.doorWidthCm}
          onChange={(v) => onChange({ ...value, doorWidthCm: v })}
          placeholder="z. B. 80"
        />
        <Field
          label="Deckenhöhe"
          value={value.ceilingHeightCm}
          onChange={(v) => onChange({ ...value, ceilingHeightCm: v })}
          placeholder="z. B. 250"
        />
      </div>

      {/* Optionaler Grundriss-Upload */}
      <div className="mt-4 border-t border-mist pt-4">
        <span className="mb-2 block text-xs text-ink/55">
          Grundriss (optional) — Bild oder PDF
        </span>
        {floorplan ? (
          <div className="flex items-center gap-3">
            {floorplan.isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={floorplan.dataUrl}
                alt="Grundriss"
                className="h-16 w-16 rounded-lg border border-mist object-cover"
              />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-lg border border-mist bg-paper text-xs text-ink/50">
                PDF
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-sm text-ink/70">
              {floorplan.name}
            </span>
            <button
              type="button"
              onClick={() => onFloorplan(null)}
              className="text-xs text-ink/50 underline underline-offset-4 hover:text-ink"
            >
              Entfernen
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-dashed border-mist px-4 py-2 text-sm text-ink/60 transition hover:border-sage"
          >
            Grundriss hochladen
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFloorplan(file);
            // Zurücksetzen, damit dieselbe Datei erneut gewählt werden kann.
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
