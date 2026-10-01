import "server-only";

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

export function getMeasurer(): RoomMeasurer {
  // Hier später nach MEASURE_PROVIDER umschalten, wie bei getProvider().
  return noMeasurer;
}
