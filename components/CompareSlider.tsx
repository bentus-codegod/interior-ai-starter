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
}: {
  before: string;
  after: string;
  provider: string;
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
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-sunken">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt="Dein Raum, neu eingerichtet" className="absolute inset-0 h-full w-full object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before}
          alt="Dein Raum vorher"
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
            <ArrowsLeftRight size={18} weight="bold" />
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
      <figcaption className="mt-2 flex items-center justify-between text-xs text-subtle">
        <span>Vorher</span>
        <span>
          {provider === "mock" ? "Nachher (Platzhalter, Mock-Modus)" : "Nachher"}
        </span>
      </figcaption>
    </figure>
  );
}
