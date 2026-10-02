// Verkleinert ein Bild im Browser, BEVOR es an /api/render geht.
//
// Warum: Handyfotos haben oft 3–8 MB. Als Base64 werden sie noch ~33 %
// größer, und Vercel nimmt pro Anfrage nur ~4,5 MB an. Außerdem braucht
// das Bildmodell keine 12 Megapixel — ~1536 px an der langen Seite reichen
// für SDXL & Co. völlig. Ergebnis: typischerweise 200–600 KB als JPEG.

export const MAX_SIDE_PX = 1536;
const JPEG_QUALITY = 0.85;

// Zeichnet eine Bildquelle verkleinert auf ein Canvas und gibt eine
// JPEG-Data-URL zurück. Kleinere Bilder werden nicht vergrößert.
export function drawScaled(
  source: CanvasImageSource,
  width: number,
  height: number,
  maxSide = MAX_SIDE_PX
): string {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar.");
  // Weißer Hintergrund, falls ein PNG Transparenz hat (JPEG kennt keine).
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

// Lädt eine Bilddatei und gibt sie verkleinert als JPEG-Data-URL zurück.
// createImageBitmap berücksichtigt die EXIF-Drehung von Handyfotos.
export async function resizeImageFile(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    return drawScaled(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}
