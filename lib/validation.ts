export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

export type UploadCheck =
  | { ok: true; mime: string; bytes: number }
  | { ok: false; error: string };

// Erwartet eine Data-URL wie "data:image/jpeg;base64,...."
// Prüft Format, MIME-Typ und Größe, BEVOR irgendetwas an ein
// KI-Modell geschickt wird. Nie ungeprüfte Uploads weiterreichen.
export function validateImageUpload(dataUrl: unknown): UploadCheck {
  if (typeof dataUrl !== "string") {
    return { ok: false, error: "Kein Bild empfangen." };
  }
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return { ok: false, error: "Ungültiges Bildformat." };
  }
  const [, mime, base64] = match;
  if (!ALLOWED_MIME.includes(mime)) {
    return {
      ok: false,
      error: "Nur JPEG, PNG oder WebP sind erlaubt.",
    };
  }
  // Base64 -> ungefähre Bytegröße
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Bild ist zu groß (max. 8 MB)." };
  }
  return { ok: true, mime, bytes };
}
