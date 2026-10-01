import type { Product } from "@/lib/catalog";

// Raummaße, die der Nutzer eingibt (in cm). Alles optional — ohne
// Eingabe zeigt die App keinen Passform-Check.
export type RoomDims = {
  widthCm: number;
  lengthCm: number;
  doorWidthCm: number;
  ceilingHeightCm?: number; // 0/leer = unbekannt
};

export type FitVerdict = "fits" | "tight" | "no";

export type FitResult = {
  verdict: FitVerdict;
  reason: string;
};

// WICHTIG: Das ist ein Richtwert, keine Garantie. Er soll die groben
// Fehlkäufe abfangen (Sofa passt nicht durch die Tür, Stück ist zu
// groß für den Raum) — genau die, die teure Retouren auslösen.
//
// Annahmen, bewusst einfach gehalten:
// - Türhöhe ist üblicherweise reichlich (~200 cm), daher ist die
//   Türbreite die bindende Größe.
// - Durch die Tür passt ein Stück, wenn seine KLEINSTE Kante hindurchgeht
//   (man kann es kippen). Mit etwas Puffer.
// - In den Raum passt es, wenn seine größere Grundfläche-Kante in die
//   kürzere Raumseite passt, mit Lauf-Freiraum.
export function checkFit(p: Product, room: RoomDims): FitResult {
  const dims = [p.widthCm, p.depthCm, p.heightCm].sort((a, b) => a - b);
  const smallest = dims[0];

  // --- Tür-Prüfung ---
  if (room.doorWidthCm > 0) {
    if (smallest > room.doorWidthCm) {
      return {
        verdict: "no",
        reason: `Passt nicht durch die Tür (braucht ~${smallest} cm, Tür ${room.doorWidthCm} cm).`,
      };
    }
    if (smallest > room.doorWidthCm * 0.9) {
      return {
        verdict: "tight",
        reason: `Knapp — muss evtl. gekippt durch die Tür (${room.doorWidthCm} cm).`,
      };
    }
  }

  // --- Deckenhöhe (hohe Regale, Stehleuchten, Betten mit Kopfteil) ---
  const ceiling = room.ceilingHeightCm ?? 0;
  if (ceiling > 0) {
    if (p.heightCm > ceiling) {
      return {
        verdict: "no",
        reason: `Zu hoch für den Raum (${p.heightCm} cm, Decke ${ceiling} cm).`,
      };
    }
    if (p.heightCm > ceiling - 15) {
      return {
        verdict: "tight",
        reason: `Knapp unter der Decke (${p.heightCm} cm von ${ceiling} cm).`,
      };
    }
  }

  // --- Raum-Prüfung (Grundfläche) ---
  if (room.widthCm > 0 && room.lengthCm > 0) {
    const footprint = Math.max(p.widthCm, p.depthCm);
    const roomShort = Math.min(room.widthCm, room.lengthCm);
    if (footprint > roomShort) {
      return {
        verdict: "no",
        reason: `Zu groß für den Raum (${footprint} cm auf ${roomShort} cm Seite).`,
      };
    }
    if (footprint > roomShort - 60) {
      return {
        verdict: "tight",
        reason: "Passt, lässt aber wenig Laufraum.",
      };
    }
  }

  return { verdict: "fits", reason: "Passt bequem durch Tür und in den Raum." };
}
