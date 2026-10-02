import { NextRequest, NextResponse } from "next/server";
import { getMeasurer } from "@/lib/ai/measure";
import { validateImageUpload } from "@/lib/validation";

export const runtime = "nodejs";

// Automatische Raumvermessung (Schnittstelle, siehe lib/ai/measure.ts).
//   POST { images: [dataUrl, ...] } -> RoomEstimate
// Solange kein Verfahren angebunden ist: 501 Not Implemented.
export async function POST(req: NextRequest) {
  const measurer = getMeasurer();
  if (measurer.name === "none") {
    return NextResponse.json(
      { error: "Automatische Vermessung ist noch nicht angebunden." },
      { status: 501 }
    );
  }
  const body = await req.json().catch(() => null);
  const images: unknown[] = Array.isArray(body?.images) ? body.images.slice(0, 5) : [];
  if (images.length === 0 || images.some((i) => !validateImageUpload(i).ok)) {
    return NextResponse.json({ error: "Ungültige Bilder." }, { status: 400 });
  }
  const estimate = await measurer.measure({ images: images as string[] });
  if (!estimate) {
    return NextResponse.json({ error: "Keine Schätzung möglich." }, { status: 422 });
  }
  return NextResponse.json(estimate);
}
