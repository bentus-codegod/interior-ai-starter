import { formatEur } from "@/lib/catalog";
import { getOrderSummary, type OrderStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

const statusText: Record<OrderStatus, string> = {
  pending: "Zahlung wird noch bestätigt",
  paid: "Bezahlt",
  expired: "Abgelaufen",
  shipped: "Versendet",
  delivered: "Zugestellt",
  cancelled: "Storniert",
  refunded: "Erstattet",
};

export default async function Success({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const order =
    typeof session_id === "string" && session_id.startsWith("cs_")
      ? await getOrderSummary(session_id).catch(() => null)
      : null;

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-prose place-items-center px-6 text-center">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Danke für deine Bestellung.</h1>
        {order ? (
          <div className="mx-auto mt-6 max-w-xs rounded-xl border border-line bg-panel p-4 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Status</span>
              <span>{statusText[order.status]}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted">Artikel</span>
              <span>{order.itemCount}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted">Summe</span>
              <span className="tabular-nums">{formatEur(order.amountTotalCents)}</span>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-muted">
            Deine Zahlung wurde an Stripe übergeben. Sobald sie bestätigt ist,
            bereiten wir deine Bestellung vor.
          </p>
        )}
        <a href="/" className="mt-6 inline-block text-accent underline underline-offset-4">
          Zurück zum Start
        </a>
      </div>
    </main>
  );
}
