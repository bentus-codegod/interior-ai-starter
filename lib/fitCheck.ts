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
// - In den Raum passt es, wenn es (ggf. gedreht) auf die Grundfläche
//   passt; unter 60 cm Laufweg auf der engeren Seite gilt es als knapp.
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
  // Das Stück darf gedreht werden: lange Kante an die lange Wand.
  if (room.widthCm > 0 && room.lengthCm > 0) {
    const itemLong = Math.max(p.widthCm, p.depthCm);
    const itemShort = Math.min(p.widthCm, p.depthCm);
    const roomLong = Math.max(room.widthCm, room.lengthCm);
    const roomShort = Math.min(room.widthCm, room.lengthCm);
    if (itemLong > roomLong || itemShort > roomShort) {
      return {
        verdict: "no",
        reason: `Zu groß für den Raum (${itemLong} × ${itemShort} cm auf ${roomLong} × ${roomShort} cm).`,
      };
    }
    // Weniger als 60 cm Laufweg auf der engeren Seite -> knapp.
    if (roomShort - itemShort < 60) {
      return {
        verdict: "tight",
        reason: "Passt, lässt aber wenig Laufraum.",
      };
    }
  }

  return { verdict: "fits", reason: "Passt bequem durch Tür und in den Raum." };
}
