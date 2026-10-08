import "server-only";
import { env } from "@/lib/env";

// ---------------------------------------------------------------------------
// PHASE 2 — Objektgenaues Bearbeiten ("Möbel tauschen", "Möbel behalten").
//
// Das Phase-1-Modell (adirik/interior-design, in provider.ts) malt immer das
// GANZE Bild neu. Für "tausche nur das Sofa" oder "behalte das Sofa, ändere
// den Rest" braucht es eine Kette aus zwei Modellen — beide Open Source, beide
// auf Replicate:
//
//   1) SEGMENTIEREN  (schananas/grounded_sam = Grounding DINO + SAM)
//      Text ("sofa, couch")  ->  pixelgenaue Maske des Objekts
//
//   2) INPAINTING    (stable-diffusion-inpainting)
//      Bild + Maske + Prompt ->  nur der maskierte Bereich wird neu gemalt
//
// Beide Modell-Namen stehen in env (REPLICATE_SEGMENT_MODEL / _INPAINT_MODEL)
// und sind ohne Code-Änderung austauschbar — exakt wie beim Phase-1-Modell.
//
// WICHTIG (ehrlich): Diese Datei ist das getestet-typsichere Gerüst. Die
// genauen Ausgabe-Felder der Fremdmodelle (welcher Rückgabewert die Maske ist,
// Schwarz/Weiß-Polarität) müssen beim ERSTEN echten Lauf mit Token einmal
// bestätigt werden — dafür ist unten jede Stelle markiert. Es ist dann ein
// Einzeiler, kein Umbau.
// ---------------------------------------------------------------------------

type ReplicateInput = Record<string, unknown>;

// Ein Replicate-Modell synchron aufrufen (create + ggf. pollen). Gespiegelt
// aus lib/ai/provider.ts, damit beide dieselbe bewährte Logik nutzen.
async function callReplicate(model: string, input: ReplicateInput): Promise<unknown> {
  if (!env.replicateToken) throw new Error("REPLICATE_API_TOKEN fehlt.");

  const create = await fetch(
    `https://api.replicate.com/v1/models/${model}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.replicateToken}`,
        "Content-Type": "application/json",
        Prefer: "wait", // bis zu 60 s auf das Ergebnis warten
      },
      body: JSON.stringify({ input }),
    }
  );
  if (!create.ok) {
    const detail = await create.text().catch(() => "");
    throw new Error(`Replicate (${model}): ${create.status} ${detail}`.trim());
  }

  let prediction = await create.json();
  const started = Date.now();
  while (
    prediction.status !== "succeeded" &&
    prediction.status !== "failed" &&
    prediction.status !== "canceled" &&
    prediction.urls?.get &&
    Date.now() - started < 90_000
  ) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(prediction.urls.get, {
      headers: { Authorization: `Bearer ${env.replicateToken}` },
    });
    prediction = await poll.json();
  }
  if (prediction.status !== "succeeded") {
    throw new Error(
      `Replicate (${model}): nicht erfolgreich (Status ${prediction.status ?? "unbekannt"}).`
    );
  }
  return prediction.output;
}

// Replicate gibt Bilder mal als String, mal als Array von URLs zurück.
function firstUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return String(output[0]);
  throw new Error("Replicate: leeres Ergebnis.");
}
function lastUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return String(output[output.length - 1]);
  throw new Error("Replicate: leeres Ergebnis.");
}

export type EditMode =
  | "swap" // das erkannte Objekt ERSETZEN (innerhalb der Maske neu malen)
  | "keep"; // das erkannte Objekt BEHALTEN, drumherum neu gestalten

export type EditInput = {
  // Replicate akzeptiert Data-URLs direkt — wie in provider.ts, also kein
  // vorheriges Hochladen nötig. Darf auch eine öffentliche Bild-URL sein.
  imageDataUrl: string;
  targetObject: string; // was erkannt wird, z. B. "sofa, couch"
  prompt: string; // was an die Stelle (swap) bzw. drumherum (keep) soll
  negativePrompt?: string;
  mode?: EditMode; // Standard: "swap"
};

export type EditResult = {
  imageUrl: string; // Ergebnisbild
  maskUrl: string; // die verwendete Maske (zur Kontrolle)
  provider: string;
  steps: string[]; // welche Modelle liefen (für Logging/Debug)
};

const DEFAULT_NEGATIVE =
  "blurry, distorted, deformed, low quality, warped walls, bad perspective, watermark, text";

// Schritt 1: Objekt per Text zu einer Maske machen.
async function segment(imageDataUrl: string, targetObject: string): Promise<string> {
  const output = await callReplicate(env.replicateSegmentModel, {
    image: imageDataUrl,
    mask_prompt: targetObject,
    negative_mask_prompt: "",
    adjustment_factor: 0, // Maske minimal vergrößern/verkleinern (0 = unverändert)
  });
  // ⚠️ ERSTER-LAUF-CHECK: grounded_sam liefert mehrere Bilder zurück
  // (u. a. die Schwarz/Weiß-Maske). Hier wird das letzte als Maske genommen.
  // Falls der Inpaint-Schritt an der falschen Stelle malt, ist der Rückgabe-
  // Index die einzige Stellschraube — mit firstUrl() statt lastUrl() tauschen.
  return lastUrl(output);
}

// Schritt 2: Nur den maskierten Bereich neu malen.
async function inpaint(
  imageDataUrl: string,
  maskUrl: string,
  prompt: string,
  negativePrompt: string,
  invertMask: boolean
): Promise<string> {
  const output = await callReplicate(env.replicateInpaintModel, {
    image: imageDataUrl,
    mask: maskUrl,
    prompt,
    negative_prompt: negativePrompt,
    // "keep" malt AUSSERHALB der Objektmaske -> Maske invertieren. Nicht jedes
    // Inpaint-Modell kann das per Flag; unterstützt das gewählte Modell kein
    // invert_mask, braucht "keep" einen kleinen Masken-Invertier-Schritt
    // (Bildbearbeitung) — siehe KI-MODELLE-LANDKARTE, Phase-2-Notiz.
    invert_mask: invertMask,
  });
  return firstUrl(output);
}

// Die komplette Kette: erkennen -> maskieren -> gezielt neu malen.
export async function editRoom(input: EditInput): Promise<EditResult> {
  const mode: EditMode = input.mode ?? "swap";
  const negativePrompt = input.negativePrompt?.trim() || DEFAULT_NEGATIVE;

  const maskUrl = await segment(input.imageDataUrl, input.targetObject);
  const imageUrl = await inpaint(
    input.imageDataUrl,
    maskUrl,
    input.prompt,
    negativePrompt,
    mode === "keep" // behalten = außerhalb der Maske malen
  );

  return {
    imageUrl,
    maskUrl,
    provider: "replicate",
    steps: [env.replicateSegmentModel, env.replicateInpaintModel],
  };
}
