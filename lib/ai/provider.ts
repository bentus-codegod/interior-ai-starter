import "server-only";
import { env } from "@/lib/env";
import { comfyProvider } from "@/lib/ai/comfyProvider";

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

// --- Replicate: fertige Modell-API auf gemieteter GPU, Abrechnung PRO BILD.
// Keine Lizenz, keine Dauerkosten, keine eigene GPU. Der günstigste Weg zu
// echten Renders im Prototyp. Wird benutzt, wenn AI_PROVIDER=replicate und
// ein Token gesetzt ist; der Token bleibt serverseitig (diese Datei ist
// server-only).
//
// Zwei bewusste Entscheidungen:
//  * Das Modell wird über den Namen angesprochen (owner/name, env.replicateModel),
//    NICHT über einen festen Versions-Hash — der ändert sich ständig.
//  * Das Raumfoto geht als Data-URL direkt mit. Replicate akzeptiert Data-URIs,
//    deshalb braucht dieser Weg (anders als ModelsLab) KEIN R2/S3.
//
// Standardmodell "adirik/interior-design" erhält die Raumstruktur (Depth/MLSD)
// und erwartet die Felder image + prompt + negative_prompt. Bei einem anderen
// Modell ggf. die Eingabefelder hier anpassen.
const replicateProvider: ImageProvider = {
  async renderImage({ imageDataUrl, prompt }: RenderInput): Promise<RenderOutput> {
    if (!env.replicateToken) {
      throw new Error("REPLICATE_API_TOKEN fehlt.");
    }

    const create = await fetch(
      `https://api.replicate.com/v1/models/${env.replicateModel}/predictions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.replicateToken}`,
          "Content-Type": "application/json",
          // Bis zu 60 s auf das fertige Bild warten, statt sofort "starting".
          Prefer: "wait",
        },
        body: JSON.stringify({
          input: {
            image: imageDataUrl,
            prompt,
            negative_prompt:
              "blurry, distorted, deformed, low quality, warped walls, bad perspective, watermark, text",
          },
        }),
      }
    );

    if (!create.ok) {
      const detail = await create.text().catch(() => "");
      throw new Error(`Replicate-Fehler: ${create.status} ${detail}`.trim());
    }

    let prediction = await create.json();

    // Falls "Prefer: wait" nicht reichte: weiter pollen, bis fertig.
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
        `Replicate: Render nicht erfolgreich (Status ${prediction.status ?? "unbekannt"}).`
      );
    }

    // Output ist je nach Modell ein String oder ein Array von Bild-URLs.
    const output = Array.isArray(prediction.output)
      ? prediction.output[prediction.output.length - 1]
      : prediction.output;
    if (!output) throw new Error("Replicate: leeres Ergebnis.");

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
    case "comfyui":
      // Eigene KI (SDXL + ControlNet) auf gemieteter GPU, z. B. RunPod.
      // In eigener Datei, damit dieser Provider optionale Node-APIs
      // (fs, FormData) nur lädt, wenn er wirklich gebraucht wird.
      return comfyProvider;
    default:
      return mockProvider;
  }
}
