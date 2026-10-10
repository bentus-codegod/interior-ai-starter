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
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <span className="relative block">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-line bg-panel py-2 pl-3 pr-9 text-sm tabular-nums outline-none transition-colors placeholder:text-subtle focus:border-accent"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs text-subtle">
          cm
        </span>
      </span>
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
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Für den Passform-Check: Wir prüfen, ob jedes Stück durch die Tür und in den Raum passt.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Raumbreite"
          value={value.widthCm}
          onChange={(v) => onChange({ ...value, widthCm: v })}
          placeholder="400"
        />
        <Field
          label="Raumlänge"
          value={value.lengthCm}
          onChange={(v) => onChange({ ...value, lengthCm: v })}
          placeholder="520"
        />
        <Field
          label="Türbreite"
          value={value.doorWidthCm}
          onChange={(v) => onChange({ ...value, doorWidthCm: v })}
          placeholder="80"
        />
        <Field
          label="Deckenhöhe"
          value={value.ceilingHeightCm}
          onChange={(v) => onChange({ ...value, ceilingHeightCm: v })}
          placeholder="250"
        />
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-medium text-muted">Grundriss, Bild oder PDF</span>
        {floorplan ? (
          <div className="flex items-center gap-3 rounded-md border border-line bg-panel p-2">
            {floorplan.isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={floorplan.dataUrl}
                alt="Grundriss"
                className="h-12 w-12 rounded-md object-cover"
              />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-md bg-sunken text-xs text-muted">
                PDF
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-sm">{floorplan.name}</span>
            <button
              type="button"
              onClick={() => onFloorplan(null)}
              className="press rounded-md px-2 py-1 text-sm text-muted hover:bg-sunken hover:text-ink"
            >
              Entfernen
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="press rounded-md border border-line bg-panel px-3 py-2 text-sm text-muted hover:border-accent/50 hover:text-ink"
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
