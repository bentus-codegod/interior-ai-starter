import "server-only";
import { getProvider } from "@/lib/ai/provider";
import { getLook, type Product, type RoomItem } from "@/lib/catalog";
import { alternativesByCategory, composeRoom } from "@/lib/designBrain";
import { getProducts } from "@/lib/productRepo";
import { buildPrompt } from "@/lib/stylePrompt";
import { env } from "@/lib/env";
import { splitBudget, type BudgetSplit } from "@/lib/budget";

export type RenderRoomResult = {
  renderImageUrl: string;
  provider: string;
  look: {
    id: string;
    name: string;
    description: string;
    styleTag: string;
    couplings: string[][];
  };
  items: RoomItem[];
  subtotalCents: number;
  budget: BudgetSplit;
  // Tausch-Kandidaten je Kategorie (für Tauschen und Swipen).
  alternatives: Record<string, Product[]>;
};

// Rendert den Raum und stellt über das Design-Hirn den kaufbaren Look
// zusammen — passende Produkte aus dem Katalog nach Stil und Budget.
export async function renderRoom(
  imageDataUrl: string,
  lookId: string,
  opts: { budgetCents?: number; styleText?: string } = {}
): Promise<RenderRoomResult> {
  const look = getLook(lookId);
  if (!look) {
    throw new Error("Unbekannter Look.");
  }

  // Katalog und Render parallel holen — der Render dauert ohnehin länger.
  const [catalog, render] = await Promise.all([
    getProducts(),
    getProvider().renderImage({
      imageDataUrl,
      prompt: buildPrompt(look.prompt, opts.styleText ?? ""),
    }),
  ]);

  const budget = splitBudget(opts.budgetCents ?? 0, env.logisticsShare);
  const { items, subtotalCents } = composeRoom(catalog, look, budget.furnitureBudgetCents);

  return {
    renderImageUrl: render.imageUrl,
    provider: render.provider,
    look: {
      id: look.id,
      name: look.name,
      description: look.description,
      styleTag: look.styleTag,
      couplings: look.couplings ?? [],
    },
    items,
    subtotalCents,
    budget,
    alternatives: alternativesByCategory(catalog, look.categories),
  };
}
