import "server-only";
import { env } from "@/lib/env";

// ---------------------------------------------------------------------------
// Schnittstelle: automatische Raumvermessung aus Foto/Video.
//
// Konzept §2.2: Maße, Deckenhöhe und Fenster aus dem Upload ableiten.
// Heute gibt es dafür noch KEIN Verfahren im Projekt — nur diese
// Schnittstelle, damit Frontend und API schon feststehen:
//
//   * Ein Anbieter implementiert `RoomMeasurer` (z. B. Tiefenschätzung mit
//     Depth Anything + Referenzmaß wie Türhöhe ~200 cm, ein externer
//     Vermessungsdienst, oder später LiDAR-Daten aus einer Handy-App).
//   * /api/measure gibt eine Schätzung zurück; das Frontend kann damit die
//     Maßfelder vorbefüllen — der Nutzer bestätigt oder korrigiert.
//
// Ehrlichkeit vor Bequemlichkeit: Aus einem einzelnen Foto sind nur grobe
// Proportionen möglich. `confidence` muss das widerspiegeln.
// ---------------------------------------------------------------------------

export type RoomEstimate = {
  widthCm?: number;
  lengthCm?: number;
  ceilingHeightCm?: number;
  doorWidthCm?: number;
  windows?: { widthCm: number; heightCm: number }[];
  confidence: number; // 0–1
  method: string; // z. B. "depth-anything+door-reference"
};

export type MeasureInput = {
  images: string[]; // Data-URLs (Foto oder Video-Standbilder)
  referenceCm?: { doorHeightCm?: number }; // bekannte Größe im Bild
};

export interface RoomMeasurer {
  name: string;
  measure(input: MeasureInput): Promise<RoomEstimate | null>;
}

// Platzhalter: misst nicht, sagt das aber ehrlich.
const noMeasurer: RoomMeasurer = {
  name: "none",
  async measure() {
    return null;
  },
};

// Erste positive Zahl aus einem Wert ziehen (Modell liefert mal 250, mal "250 cm").
function num(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
}

// Grobe Raum-Schätzung über ein Vision-Modell auf Replicate.
// EHRLICH: Aus einem einzelnen Foto sind nur ungefähre Proportionen möglich —
// darum niedrige confidence und als Vorbefüllung gedacht, die der Nutzer prüft.
const replicateMeasurer: RoomMeasurer = {
  name: "replicate-vision",
  async measure({ images }): Promise<RoomEstimate | null> {
    if (!env.replicateToken || images.length === 0) return null;
    const prompt =
      "You are estimating the dimensions of the room in this photo. " +
      "Use typical references (a standard interior door is ~200 cm tall and ~80 cm wide, " +
      "a ceiling is ~250 cm) to estimate. Answer with ONLY a compact JSON object, no prose, " +
      'in centimeters: {"widthCm":<number>,"lengthCm":<number>,"ceilingHeightCm":<number>,"doorWidthCm":<number>}. ' +
      "If something is not visible, estimate a plausible typical value.";

    let output: unknown;
    try {
      const create = await fetch(
        `https://api.replicate.com/v1/models/${env.replicateMeasureModel}/predictions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.replicateToken}`,
            "Content-Type": "application/json",
            Prefer: "wait",
          },
          body: JSON.stringify({ input: { image: images[0], prompt } }),
        }
      );
      if (!create.ok) return null;
      let prediction = await create.json();
      const started = Date.now();
      while (
        prediction.status !== "succeeded" &&
        prediction.status !== "failed" &&
        prediction.status !== "canceled" &&
        prediction.urls?.get &&
        Date.now() - started < 60_000
      ) {
        await new Promise((r) => setTimeout(r, 1500));
        const poll = await fetch(prediction.urls.get, {
          headers: { Authorization: `Bearer ${env.replicateToken}` },
        });
        prediction = await poll.json();
      }
      if (prediction.status !== "succeeded") return null;
      output = prediction.output;
    } catch {
      return null;
    }

    // Vision-Modelle liefern Text oft als Array von Tokens — zusammenfügen.
    const text = Array.isArray(output) ? output.join("") : String(output ?? "");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(match[0]);
    } catch {
      return null;
    }

    const estimate: RoomEstimate = {
      widthCm: num(data.widthCm),
      lengthCm: num(data.lengthCm),
      ceilingHeightCm: num(data.ceilingHeightCm),
      doorWidthCm: num(data.doorWidthCm),
      confidence: 0.3, // einzelnes Foto -> bewusst niedrig
      method: `${env.replicateMeasureModel} (grobe Schätzung)`,
    };
    // Nur zurückgeben, wenn wenigstens ein Maß herauskam.
    const any = estimate.widthCm || estimate.lengthCm || estimate.ceilingHeightCm || estimate.doorWidthCm;
    return any ? estimate : null;
  },
};

export function getMeasurer(): RoomMeasurer {
  // Mit Replicate-Anbieter + gesetztem Modell: grobe Vision-Schätzung.
  if (env.aiProvider === "replicate" && env.replicateToken && env.replicateMeasureModel) {
    return replicateMeasurer;
  }
  return noMeasurer;
}
