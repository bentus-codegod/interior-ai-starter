import { NextRequest, NextResponse } from "next/server";
import { renderRoom } from "@/lib/ai/renderRoom";
import { validateImageUpload } from "@/lib/validation";
import { checkRateLimit, reserveRenderBudget, recordSpend } from "@/lib/rateLimit";
import { logRenderEvent } from "@/lib/renderLog";
import { env } from "@/lib/env";
import { cleanStyleText } from "@/lib/stylePrompt";
import { getLook } from "@/lib/catalog";

export const runtime = "nodejs";

// Client-IP für das Rate-Limit. Auf Vercel setzt die Plattform beide
// Header selbst (vom Client nicht fälschbar). Hinter einem eigenen Proxy
// muss dieser x-forwarded-for ÜBERSCHREIBEN, nicht anhängen.
function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// Dieser Endpunkt ist die einzige Stelle, die das KI-Modell aufruft.
// Der Browser redet nur mit dieser Route — nie direkt mit dem Anbieter.
// Reihenfolge der Schutzmechanismen: Rate-Limit -> Eingaben prüfen ->
// Kosten reservieren -> erst dann der teure Modell-Call.
export async function POST(req: NextRequest) {
  try {
    if (!(await checkRateLimit(clientIp(req)))) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte später erneut versuchen." },
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
    if (typeof lookId !== "string" || !getLook(lookId)) {
      return NextResponse.json({ error: "Kein gültiger Look gewählt." }, { status: 400 });
    }

    const budget =
      typeof budgetCents === "number" && Number.isFinite(budgetCents) && budgetCents > 0
        ? Math.min(Math.round(budgetCents), 10_000_000) // max. 100.000 €
        : 0;

    const release = await reserveRenderBudget(env.aiProvider);
    if (!release) {
      return NextResponse.json(
        { error: "Tageslimit erreicht. Morgen wieder verfügbar." },
        { status: 429 }
      );
    }

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
      recordSpend(env.aiProvider);
      await logRenderEvent({
        provider: env.aiProvider,
        lookId,
        success: false,
        durationMs: Date.now() - started,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    } finally {
      release();
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
