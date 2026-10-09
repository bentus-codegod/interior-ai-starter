// "server-only" lässt den Build fehlschlagen, falls diese Datei
// versehentlich im Frontend importiert wird. So kann kein Secret
// je im Browser-Bundle landen — die goldene Regel, technisch erzwungen.
import "server-only";

export const env = {
  aiProvider: (process.env.AI_PROVIDER ?? "mock") as
    | "mock"
    | "modelslab"
    | "replicate"
    | "comfyui",
  modelslabKey: process.env.MODELSLAB_API_KEY ?? "",
  replicateToken: process.env.REPLICATE_API_TOKEN ?? "",
  // Welches Replicate-Modell gerendert wird (owner/name). Standard ist ein
  // Interior-Redesign-Modell, das die Raumstruktur erhält. Wechselbar, ohne
  // Code zu ändern — bei einem anderen Modell ggf. die Eingabefelder anpassen.
  replicateModel: process.env.REPLICATE_MODEL ?? "adirik/interior-design",
  // --- Phase 2: objektgenaues Bearbeiten (Möbel tauschen/freistellen) ---
  // Text -> Maske (Grounding DINO + SAM in einem Call). Owner/Name, wechselbar.
  replicateSegmentModel:
    process.env.REPLICATE_SEGMENT_MODEL ?? "schananas/grounded_sam",
  // Maske + Bild + Prompt -> nur der maskierte Bereich wird neu gemalt.
  replicateInpaintModel:
    process.env.REPLICATE_INPAINT_MODEL ?? "stability-ai/stable-diffusion-inpainting",
  // Vision-Modell für die grobe Raum-Schätzung (Maße/Tiefe aus Foto).
  // Muss `image` + `prompt` annehmen und Text zurückgeben. Austauschbar.
  replicateMeasureModel:
    process.env.REPLICATE_MEASURE_MODEL ?? "yorickvp/llava-13b",
  // Basis-URL deiner eigenen ComfyUI-Instanz (RunPod). Ohne / am Ende,
  // z. B. https://abc123-3000.proxy.runpod.net
  comfyUrl: (process.env.COMFYUI_URL ?? "").replace(/\/$/, ""),
  stripeSecret: process.env.STRIPE_SECRET_KEY ?? "",
  // Signatur-Geheimnis des Stripe-Webhooks ("whsec_..."), siehe
  // app/api/stripe/webhook/route.ts.
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  // Supabase: Projekt-URL + Service-Role-Key. Der Service-Role-Key hat
  // Vollzugriff auf die Datenbank — er darf NIE in den Browser.
  supabaseUrl: (process.env.SUPABASE_URL ?? "").replace(/\/$/, ""),
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  // Optional: Upstash Redis (REST) für ein Rate-Limit, das über alle
  // Server-Instanzen gilt. Ohne Werte: Zähler im Arbeitsspeicher.
  upstashUrl: (process.env.UPSTASH_REDIS_REST_URL ?? "").replace(/\/$/, ""),
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
  dailyCostCapEur: Number(process.env.DAILY_AI_COST_CAP_EUR ?? 5),
  // Anteil des Gesamtbudgets, der für Logistik/Lieferung reserviert wird
  // (0 bis 0,6). Affiliate: 0, der Händler liefert. Private Label mit
  // Container-Import: laut Konzept ~0,35–0,45 (20.000 € -> 7.000–9.000 €).
  logisticsShare: Math.min(0.6, Math.max(0, Number(process.env.LOGISTICS_SHARE ?? 0) || 0)),
  costPerRenderEur: Number(process.env.AI_COST_PER_RENDER_EUR ?? 0.05),
};

export function hasSupabase(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseServiceKey);
}

export function hasStripe(): boolean {
  return env.stripeSecret.startsWith("sk_");
}
