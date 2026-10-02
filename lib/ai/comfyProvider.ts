import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import type { ImageProvider, RenderInput, RenderOutput } from "@/lib/ai/provider";

// ---------------------------------------------------------------------------
// ComfyUI-Provider (eigene KI auf gemieteter GPU, z. B. RunPod).
//
// So passt dein selbstgehostetes SDXL + ControlNet in die BESTEHENDE App:
// gleiche Schnittstelle wie mock/modelslab/replicate. Du stellst nur
// AI_PROVIDER=comfyui und COMFYUI_URL — Frontend und /api/render bleiben
// unverändert.
//
// Ablauf pro Render:
//   1. Raumfoto (Data-URL) -> nach ComfyUI hochladen (/upload/image)
//   2. Workflow-JSON laden, Foto + Prompt + Parameter hineinschreiben
//   3. Workflow starten (/prompt) und auf das Ergebnis warten (/history)
//   4. Ergebnisbild holen (/view) und als Data-URL zurückgeben
//
// Die Node-IDs unten müssen zu comfy/interior_workflow.json passen.
// ---------------------------------------------------------------------------

// Node-IDs im Workflow, die dieser Provider zur Laufzeit befüllt.
const NODE = {
  loadImage: "10", // LoadImage  -> inputs.image  = hochgeladener Dateiname
  positive: "6", // CLIPTextEncode (positiv) -> inputs.text
  negative: "7", // CLIPTextEncode (negativ) -> inputs.text
  sampler: "3", // KSampler -> seed / steps / cfg / denoise
  // PreviewImage statt SaveImage: Das Ergebnis landet nur im temp-Ordner,
  // den ComfyUI bei jedem Start leert — nicht dauerhaft in output/.
  saveImage: "9",
} as const;

const DEFAULT_NEGATIVE =
  "blurry, distorted, deformed, low quality, artifacts, warped walls, " +
  "bad perspective, unrealistic proportions, watermark, text";

type ComfyImageRef = { filename: string; subfolder: string; type: string };

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const m = /^data:(.+?);base64,(.*)$/.exec(dataUrl);
  if (!m) throw new Error("ComfyUI: Erwartet ein Data-URL-Bild.");
  return { mime: m[1], buffer: Buffer.from(m[2], "base64") };
}

async function loadWorkflow(): Promise<Record<string, any>> {
  const file = path.join(process.cwd(), "comfy", "interior_workflow.json");
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw);
}

async function uploadImage(base: string, dataUrl: string): Promise<string> {
  const { buffer, mime } = dataUrlToBuffer(dataUrl);
  const ext = mime.includes("png") ? "png" : "jpg";
  // Fester Präfix, damit comfy/cleanup.sh genau diese Uploads findet.
  const filename = `interior_ai_room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const form = new FormData();
  form.append("image", new Blob([new Uint8Array(buffer)], { type: mime }), filename);
  form.append("overwrite", "true");

  const res = await fetch(`${base}/upload/image`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`ComfyUI-Upload fehlgeschlagen: ${res.status}`);
  const data = (await res.json()) as { name?: string };
  if (!data.name) throw new Error("ComfyUI: Upload ohne Dateinamen.");
  return data.name;
}

function buildPrompt(
  workflow: Record<string, any>,
  imageName: string,
  prompt: string
): Record<string, any> {
  const wf = structuredClone(workflow);

  if (wf[NODE.loadImage]?.inputs) wf[NODE.loadImage].inputs.image = imageName;
  if (wf[NODE.positive]?.inputs) wf[NODE.positive].inputs.text = prompt;
  if (wf[NODE.negative]?.inputs) wf[NODE.negative].inputs.text = DEFAULT_NEGATIVE;
  if (wf[NODE.sampler]?.inputs) {
    // Zufalls-Seed pro Render, damit nicht immer dasselbe Bild kommt.
    wf[NODE.sampler].inputs.seed = Math.floor(Math.random() * 1e15);
  }
  return wf;
}

async function queuePrompt(
  base: string,
  wf: Record<string, any>,
  clientId: string
): Promise<string> {
  const res = await fetch(`${base}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: wf, client_id: clientId }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ComfyUI-Start fehlgeschlagen: ${res.status} ${detail}`);
  }
  const data = (await res.json()) as { prompt_id?: string };
  if (!data.prompt_id) throw new Error("ComfyUI: keine prompt_id erhalten.");
  return data.prompt_id;
}

async function waitForResult(base: string, promptId: string): Promise<ComfyImageRef> {
  const started = Date.now();
  // Render dauert je nach GPU ~10-40 s; wir warten bis zu 120 s.
  while (Date.now() - started < 120_000) {
    const res = await fetch(`${base}/history/${promptId}`);
    if (res.ok) {
      const hist = (await res.json()) as Record<string, any>;
      const entry = hist[promptId];
      const images: ComfyImageRef[] | undefined =
        entry?.outputs?.[NODE.saveImage]?.images;
      if (images && images[0]) return images[0];
      if (entry?.status?.status_str === "error") {
        throw new Error("ComfyUI: Render mit Fehler abgebrochen.");
      }
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("ComfyUI: Zeitüberschreitung beim Warten auf das Ergebnis.");
}

async function fetchResultAsDataUrl(
  base: string,
  ref: ComfyImageRef
): Promise<string> {
  const qs = new URLSearchParams({
    filename: ref.filename,
    subfolder: ref.subfolder ?? "",
    type: ref.type ?? "temp",
  });
  const res = await fetch(`${base}/view?${qs.toString()}`);
  if (!res.ok) throw new Error(`ComfyUI: Ergebnis nicht abrufbar (${res.status}).`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = ref.filename.endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export const comfyProvider: ImageProvider = {
  async renderImage({ imageDataUrl, prompt }: RenderInput): Promise<RenderOutput> {
    if (!env.comfyUrl) {
      throw new Error("COMFYUI_URL fehlt (deine RunPod-Adresse).");
    }
    if (!imageDataUrl.startsWith("data:")) {
      throw new Error("ComfyUI erwartet das Raumfoto als Data-URL.");
    }

    const base = env.comfyUrl;
    const clientId = `interior-ai-${Date.now()}`;

    const workflow = await loadWorkflow();
    const imageName = await uploadImage(base, imageDataUrl);
    const wf = buildPrompt(workflow, imageName, prompt);
    const promptId = await queuePrompt(base, wf, clientId);
    const ref = await waitForResult(base, promptId);
    const imageUrl = await fetchResultAsDataUrl(base, ref);

    return { imageUrl, provider: "comfyui" };
  },
};
