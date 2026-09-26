import "server-only";
import { getProvider } from "@/lib/ai/provider";
import { getLook, type Product } from "@/lib/catalog";
import { composeRoom } from "@/lib/designBrain";

export type RenderRoomResult = {
  renderImageUrl: string;
  provider: string;
  look: { id: string; name: string; description: string };
  items: Product[];
  subtotalCents: number;
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

  const provider = getProvider();
  const render = await provider.renderImage({
    imageDataUrl,
    prompt: look.prompt,
  });

  const { items, subtotalCents } = composeRoom(look, budgetCents);

  return {
    renderImageUrl: render.imageUrl,
    provider: render.provider,
    look: { id: look.id, name: look.name, description: look.description },
    items,
    subtotalCents,
  };
}
