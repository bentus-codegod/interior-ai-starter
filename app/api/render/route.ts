import { NextRequest, NextResponse } from "next/server";
import { renderRoom } from "@/lib/ai/renderRoom";
import { validateImageUpload } from "@/lib/validation";
import { checkRateLimit, checkCostCap, recordSpend } from "@/lib/rateLimit";
import { logRenderEvent } from "@/lib/renderLog";
import { env } from "@/lib/env";
import { cleanStyleText } from "@/lib/stylePrompt";

export const runtime = "nodejs";

// Dieser Endpunkt ist die einzige Stelle, die das KI-Modell aufruft.
// Der Browser redet nur mit dieser Route — nie direkt mit dem Anbieter.
// Reihenfolge der Schutzmechanismen: Rate-Limit -> Kosten-Cap ->
// Upload-Validierung -> erst dann der teure Modell-Call.
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

    if (!(await checkRateLimit(ip))) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte später erneut versuchen." },
        { status: 429 }
      );
    }

    const cap = await checkCostCap();
    if (!cap.ok) {
      return NextResponse.json(
        { error: "Tageslimit erreicht. Morgen wieder verfügbar." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }

    const { imageDataUrl, lookId, budgetCents, styleText } = body as {
      imageDataUrl?: unknown;
      lookId?: unknown;
      budgetCents?: unknown;
      styleText?: unknown;
    };

    const check = validateImageUpload(imageDataUrl);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    if (typeof lookId !== "string") {
      return NextResponse.json({ error: "Kein Look gewählt." }, { status: 400 });
    }

    const budget =
      typeof budgetCents === "number" && Number.isFinite(budgetCents) && budgetCents > 0
        ? Math.min(Math.round(budgetCents), 10_000_000) // max. 100.000 €
        : 0;

    // Ab hier kostet es Geld -> jeden Versuch protokollieren.
    const started = Date.now();
    try {
      const result = await renderRoom(imageDataUrl as string, lookId, {
        budgetCents: budget,
        styleText: cleanStyleText(styleText),
      });
      recordSpend(result.provider);
      await logRenderEvent({
        provider: result.provider,
        lookId,
        success: true,
        durationMs: Date.now() - started,
      });
      return NextResponse.json(result);
    } catch (err) {
      await logRenderEvent({
        provider: env.aiProvider,
        lookId,
        success: false,
        durationMs: Date.now() - started,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  } catch (err) {
    // Fehler bewusst generisch nach außen — keine internen Details leaken.
    console.error("render error:", err);
    return NextResponse.json(
      { error: "Render fehlgeschlagen. Bitte erneut versuchen." },
      { status: 500 }
    );
  }
}
