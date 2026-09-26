import "server-only";
import { env } from "@/lib/env";

// Einheitliche Schnittstelle für jedes Bildmodell. So kannst du den
// Anbieter wechseln (Replicate, fal, Google ...), ohne den Rest der
// App anzufassen. Genau die Abstraktionsschicht aus dem Bauplan.
export type RenderInput = {
  imageDataUrl: string; // das Raumfoto des Nutzers
  prompt: string; // der Stil-Prompt des gewählten Looks
};

export type RenderOutput = {
  imageUrl: string; // Ergebnis-Render (URL oder Data-URL)
  provider: string;
};

export interface ImageProvider {
  renderImage(input: RenderInput): Promise<RenderOutput>;
}

// --- Mock: läuft ohne jeden API-Key, gibt einen Platzhalter zurück.
// So startet die App sofort; du siehst den kompletten Ablauf, bevor
// du echtes Geld für Modell-Calls ausgibst.
const mockProvider: ImageProvider = {
  async renderImage(): Promise<RenderOutput> {
    // Kleine künstliche Verzögerung, damit der Ladezustand sichtbar ist.
    await new Promise((r) => setTimeout(r, 900));
    return { imageUrl: "/render-placeholder.svg", provider: "mock" };
  },
};

// --- Replicate: echtes Muster für einen produktiven Aufruf.
// Wird nur benutzt, wenn AI_PROVIDER=replicate und ein Token gesetzt ist.
// Der Token bleibt serverseitig (diese Datei ist server-only).
const replicateProvider: ImageProvider = {
  async renderImage({ imageDataUrl, prompt }: RenderInput): Promise<RenderOutput> {
    if (!env.replicateToken) {
      throw new Error("REPLICATE_API_TOKEN fehlt.");
    }
    // Modell-Version bewusst als Platzhalter — trage die aktuell beste
    // Inpainting-/img2img-Version ein. Modelle wechseln im Monatstakt,
    // deshalb steckt der Aufruf hinter dieser Abstraktion.
    const create = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.replicateToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // TODO: version + input-Felder an dein gewähltes Modell anpassen.
        version: "REPLACE_WITH_MODEL_VERSION",
        input: { image: imageDataUrl, prompt },
      }),
    });

    if (!create.ok) {
      throw new Error(`Replicate-Fehler: ${create.status}`);
    }

    let prediction = await create.json();

    // Einfaches Polling, bis das Ergebnis fertig ist.
    const started = Date.now();
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      Date.now() - started < 60_000
    ) {
      await new Promise((r) => setTimeout(r, 1500));
      const poll = await fetch(prediction.urls.get, {
        headers: { Authorization: `Bearer ${env.replicateToken}` },
      });
      prediction = await poll.json();
    }

    if (prediction.status !== "succeeded") {
      throw new Error("Render fehlgeschlagen.");
    }

    const output = Array.isArray(prediction.output)
      ? prediction.output[prediction.output.length - 1]
      : prediction.output;

    return { imageUrl: String(output), provider: "replicate" };
  },
};

// --- ModelsLab: konkrete, kommerziell nutzbare Interior-API.
// Wird benutzt, wenn AI_PROVIDER=modelslab und ein Key gesetzt ist.
// Endpoint und Felder aus der offiziellen Doku (api/v6/interior/make).
//
// WICHTIG: ModelsLab erwartet als init_image eine ÖFFENTLICH erreichbare
// Bild-URL, keine Data-URL. Das Raumfoto des Nutzers muss also vorher
// irgendwo gehostet werden (z. B. Cloudflare R2 / S3) und diese URL hier
// hereinkommen. Für den Prototyp: solange du noch keinen Bild-Upload hast,
// bleibt AI_PROVIDER=mock. Sobald du R2/S3 anbindest, lädst du das Foto
// dort hoch und reichst die entstehende URL als imageDataUrl durch.
const modelslabProvider: ImageProvider = {
  async renderImage({ imageDataUrl, prompt }: RenderInput): Promise<RenderOutput> {
    if (!env.modelslabKey) {
      throw new Error("MODELSLAB_API_KEY fehlt.");
    }
    if (imageDataUrl.startsWith("data:")) {
      throw new Error(
        "ModelsLab braucht eine gehostete Bild-URL (kein Data-URL). Foto zuerst nach R2/S3 hochladen."
      );
    }

    const start = async () =>
      fetch("https://modelslab.com/api/v6/interior/make", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: env.modelslabKey,
          init_image: imageDataUrl, // hier bereits eine öffentliche URL
          prompt,
          negative_prompt: "bad quality, distorted, unrealistic",
          strength: 0.85,
          num_inference_steps: 31,
          base64: false,
        }),
      });

    let res = await start();
    if (!res.ok) throw new Error(`ModelsLab-Fehler: ${res.status}`);
    let data = await res.json();

    // Async-Fall: Status "processing" -> fetch_result pollen, bis fertig.
    const started = Date.now();
    while (data.status === "processing" && Date.now() - started < 90_000) {
      await new Promise((r) => setTimeout(r, Math.max(1000, (data.eta ?? 3) * 1000)));
      const fetchUrl = data.fetch_result ?? data.future_links?.[0];
      if (!fetchUrl) break;
      const poll = await fetch(fetchUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: env.modelslabKey }),
      });
      data = await poll.json();
    }

    if (data.status !== "success" || !Array.isArray(data.output) || !data.output[0]) {
      throw new Error(`ModelsLab: kein Ergebnis (Status ${data.status}).`);
    }
    return { imageUrl: String(data.output[0]), provider: "modelslab" };
  },
};

export function getProvider(): ImageProvider {
  switch (env.aiProvider) {
    case "modelslab":
      return modelslabProvider;
    case "replicate":
      return replicateProvider;
    default:
      return mockProvider;
  }
}
