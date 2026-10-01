import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/productRepo";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

// Weiterleitung auf den Händler-Link mit Klick-Zählung:
//   /go/SF-LINEN-01?look=warm-minimal  ->  302 auf den Affiliate-Link
// Das Ziel kommt IMMER aus dem Katalog, nie aus der URL — so kann niemand
// unsere Domain für Weiterleitungen auf fremde Seiten missbrauchen.
// Gespeichert werden nur SKU, Look und Zeitpunkt (keine IP, keine Nutzer-ID).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  const { sku } = await params;
  const product = (await getProducts()).find((p) => p.sku === sku);
  if (!product?.affiliateUrl?.startsWith("http")) {
    return NextResponse.redirect(new URL("/", req.url), 302);
  }

  const lookParam = req.nextUrl.searchParams.get("look");
  const lookId = lookParam && /^[a-z0-9-]{1,64}$/.test(lookParam) ? lookParam : null;
  const db = getSupabase();
  if (db) {
    const { error } = await db.from("affiliate_clicks").insert({ sku, look_id: lookId });
    if (error) console.error("affiliate_click nicht gespeichert:", error.message);
  }

  return NextResponse.redirect(product.affiliateUrl, 302);
}
