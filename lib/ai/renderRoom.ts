import "server-only";
import { getProvider } from "@/lib/ai/provider";
import { getLook, type Product } from "@/lib/catalog";
import { alternativesByCategory, composeRoom } from "@/lib/designBrain";
import { getProducts } from "@/lib/productRepo";

export type RenderRoomResult = {
  renderImageUrl: string;
  provider: string;
  look: { id: string; name: string; description: string };
  items: Product[];
  subtotalCents: number;
  // Tausch-Kandidaten je Kategorie (für "Tauschen" im Shop-the-Look).
  alternatives: Record<string, Product[]>;
};

// Rendert den Raum und stellt über das Design-Hirn den kaufbaren Look
// zusammen — passende Produkte aus dem Katalog nach Stil und Budget.
export async function renderRoom(
  imageDataUrl: string,
  lookId: string,
  budgetCents = 0
): Promise<RenderRoomResult> {
  const look = getLook(lookId);
  if (!look) {
    throw new Error("Unbekannter Look.");
  }

  // Katalog und Render parallel holen — der Render dauert ohnehin länger.
  const [catalog, render] = await Promise.all([
    getProducts(),
    getProvider().renderImage({ imageDataUrl, prompt: look.prompt }),
  ]);

  const { items, subtotalCents } = composeRoom(catalog, look, budgetCents);

  return {
    renderImageUrl: render.imageUrl,
    provider: render.provider,
    look: { id: look.id, name: look.name, description: look.description },
    items,
    subtotalCents,
    alternatives: alternativesByCategory(catalog, look.categories),
  };
}
