"use client";

export function RenderResult({
  before,
  after,
  provider,
}: {
  before: string;
  after: string;
  provider: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <figure className="space-y-2">
        <div className="overflow-hidden rounded-2xl border border-mist bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={before} alt="Vorher" className="aspect-[4/3] w-full object-cover" />
        </div>
        <figcaption className="text-xs text-ink/50">Dein Raum</figcaption>
      </figure>

      <figure className="space-y-2">
        <div className="overflow-hidden rounded-2xl border border-mist bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={after} alt="Gestaltet" className="aspect-[4/3] w-full object-cover" />
        </div>
        <figcaption className="text-xs text-ink/50">
          Gestaltet {provider === "mock" && "· Platzhalter (Mock-Modus)"}
        </figcaption>
      </figure>
    </div>
  );
}
