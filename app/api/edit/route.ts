import { NextRequest, NextResponse } from "next/server";
import { editRoom, type EditMode } from "@/lib/ai/editPipeline";
import { validateImageUpload } from "@/lib/validation";
import { checkRateLimit, reserveRenderBudget, recordSpend } from "@/lib/rateLimit";
import { env } from "@/lib/env";
import { cleanStyleText } from "@/lib/stylePrompt";

export const runtime = "nodejs";
// Zwei Modell-Calls hintereinander (Segmentieren + Inpainting) -> etwas mehr
// Zeit als ein einzelner Render. 120 s nur im Vercel-Pro-Tarif; im Hobby-Tarif
// ggf. auf 60 s stellen und knappere Prompts nutzen.
export const maxDuration = 120;

// PHASE 2 — objektgenaues Bearbeiten.
//   POST { imageDataUrl, targetObject, prompt, mode?: "swap"|"keep" }
// "swap": das erkannte Möbel ersetzen. "keep": es behalten, Rest neu gestalten.
// Wie /api/render: nur diese Route spricht mit dem Anbieter, nie der Browser.
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-real-ip")?.trim() ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (!(await checkRateLimit(ip))) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte später erneut versuchen." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }
    const { imageDataUrl, targetObject, prompt, mode } = body as {
      imageDataUrl?: unknown;
      targetObject?: unknown;
      prompt?: unknown;
      mode?: unknown;
    };

    // Zu bearbeiten ist meist das generierte Render — das kommt als
    // https-URL von Replicate. Daneben erlauben wir eine hochgeladene
    // Data-URL. Data-URLs werden streng geprüft; https-URLs lassen wir
    // durch (sie werden nur an Replicate als Bildquelle weitergereicht,
    // nicht vom Server selbst geladen).
    const isHttps = typeof imageDataUrl === "string" && /^https:\/\//.test(imageDataUrl);
    if (!isHttps) {
      const check = validateImageUpload(imageDataUrl);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
    }
    if (typeof targetObject !== "string" || targetObject.trim().length === 0) {
      return NextResponse.json(
        { error: "Kein Zielobjekt angegeben (z. B. \"sofa\")." },
        { status: 400 }
      );
    }
    const editMode: EditMode = mode === "keep" ? "keep" : "swap";

    // Nur echte Modell-Anbieter kosten Geld und laufen hier. Im Mock-/ComfyUI-
    // Betrieb ist diese Phase-2-Route (noch) nicht vorgesehen.
    if (env.aiProvider !== "replicate") {
      return NextResponse.json(
        { error: "Objektgenaues Bearbeiten braucht AI_PROVIDER=replicate." },
        { status: 501 }
      );
    }

    const release = await reserveRenderBudget(env.aiProvider);
    if (!release) {
      return NextResponse.json(
        { error: "Tageslimit erreicht. Morgen wieder verfügbar." },
        { status: 429 }
      );
    }
    try {
      const result = await editRoom({
        imageDataUrl: imageDataUrl as string,
        targetObject: targetObject.trim().slice(0, 200),
        prompt: cleanStyleText(typeof prompt === "string" ? prompt : ""),
        mode: editMode,
      });
      recordSpend(env.aiProvider);
      return NextResponse.json(result);
    } finally {
      release();
    }
  } catch (err) {
    console.error("edit error:", err);
    return NextResponse.json(
      { error: "Bearbeitung fehlgeschlagen. Bitte erneut versuchen." },
      { status: 500 }
    );
  }
}
