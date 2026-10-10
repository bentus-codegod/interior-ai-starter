"use client";

import { useEffect, useState } from "react";
import { ArrowsLeftRight } from "@phosphor-icons/react";

// Vorher/Nachher-Vergleich: Das Nachher-Bild liegt unten, das Vorher-Bild
// darüber und wird per clip-path bis zur Trennlinie abgeschnitten
// (Emil Kowalski: "Comparison sliders" - kein zusätzliches DOM, GPU-beschleunigt).
// Bedienung über ein unsichtbares <input type="range"> über dem Bild:
// Maus, Touch und Pfeiltasten funktionieren ohne eigenen Drag-Code.
//
// Der eine inszenierte Moment der Seite: Beim ersten Anzeigen wischt die
// Trennlinie von rechts zur Mitte und zeigt so, dass man ziehen kann.
export function CompareSlider({
  before,
  after,
  provider,
  beforeAlt = "Dein Raum vorher",
  afterAlt = "Dein Raum, neu eingerichtet",
  aspect = "aspect-[4/3]",
  note,
}: {
  before: string;
  after: string;
  provider?: string;
  beforeAlt?: string;
  afterAlt?: string;
  aspect?: string;
  // Optionaler Hinweis unter dem Bild (z. B. Herkunft eines Demobilds).
  note?: React.ReactNode;
}) {
  const [pos, setPos] = useState(100);
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPos(50);
      setIntro(false);
      return;
    }
    // Zwei Frames warten, damit der Browser den Startzustand gemalt hat.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPos(50));
    });
    const done = window.setTimeout(() => setIntro(false), 900);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(done);
    };
  }, []);

  const transition = intro ? "clip-path 800ms var(--ease-out), left 800ms var(--ease-out)" : "none";

  return (
    <figure className="enter">
      <div className={`relative ${aspect} overflow-hidden rounded-md bg-sunken`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt={afterAlt} className="absolute inset-0 h-full w-full object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before}
          alt={beforeAlt}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)`, transition }}
        />

        {/* Trennlinie mit Griff */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-px bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
          style={{ left: `${pos}%`, transition }}
        >
          <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#141816] shadow-[0_2px_10px_rgba(20,24,22,0.25)]">
            <ArrowsLeftRight size={18} />
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={pos}
          aria-label="Vorher und Nachher vergleichen"
          aria-valuetext={`${pos} Prozent Vorher`}
          onChange={(e) => {
            setIntro(false);
            setPos(Number(e.target.value));
          }}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <figcaption className="mt-2 text-xs text-subtle">
        <span className="flex items-center justify-between">
          <span>Vorher</span>
          <span>{provider === "mock" ? "Nachher (Platzhalter, Mock-Modus)" : "Nachher"}</span>
        </span>
        {note && <span className="mt-1 block leading-relaxed">{note}</span>}
      </figcaption>
    </figure>
  );
}
