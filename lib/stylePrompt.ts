// Freitext-Stil des Nutzers ("hell, skandinavisch, viel Holz, keine
// Metalloptik") -> sauberer Zusatz für den Render-Prompt.
//
// Sicherheit: Der Text geht nur an das Bildmodell, nie in Datenbank-
// Abfragen oder HTML. Trotzdem begrenzen und säubern wir ihn: Länge,
// Steuerzeichen, Klammern (die bei manchen Modellen Gewichtungen auslösen).
//
// Hinweis: SDXL versteht Englisch am besten. Deutsche Beschreibungen
// wirken, aber schwächer — eine Übersetzung (z. B. per LLM) ist ein
// späterer Ausbau.

export const MAX_STYLE_TEXT = 300;

export function cleanStyleText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>{}\[\]()\\|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_STYLE_TEXT);
}

export function buildPrompt(lookPrompt: string, styleText: string): string {
  return styleText ? `${lookPrompt}, ${styleText}` : lookPrompt;
}
