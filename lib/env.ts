// "server-only" lässt den Build fehlschlagen, falls diese Datei
// versehentlich im Frontend importiert wird. So kann kein Secret
// je im Browser-Bundle landen — die goldene Regel, technisch erzwungen.
import "server-only";

export const env = {
  aiProvider: (process.env.AI_PROVIDER ?? "mock") as
    | "mock"
    | "modelslab"
    | "replicate",
  modelslabKey: process.env.MODELSLAB_API_KEY ?? "",
  replicateToken: process.env.REPLICATE_API_TOKEN ?? "",
  stripeSecret: process.env.STRIPE_SECRET_KEY ?? "",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  dailyCostCapEur: Number(process.env.DAILY_AI_COST_CAP_EUR ?? 5),
  costPerRenderEur: Number(process.env.AI_COST_PER_RENDER_EUR ?? 0.05),
};

export function hasStripe(): boolean {
  return env.stripeSecret.startsWith("sk_");
}
