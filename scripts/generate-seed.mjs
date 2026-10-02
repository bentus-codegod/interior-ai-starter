// Erzeugt supabase/seed.sql aus data/catalog.json, damit beide nicht
// auseinanderlaufen. Aufruf: npm run seed:generate
import { readFileSync, writeFileSync } from "node:fs";

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8"));
const q = (v) => (v === undefined || v === null ? "null" : `'${String(v).replace(/'/g, "''")}'`);

const rows = catalog.products.map((p) =>
  `  (${[
    q(p.sku), q(p.name), q(p.category), q(p.group), p.priceCents, p.widthCm, p.depthCm,
    p.heightCm, q(p.dimensions), q(p.tint), `'{${p.styleTags.join(",")}}'`, q(p.retailer),
    q(p.affiliateUrl), q(p.imageUrl), q(p.modelUrl), q(p.family),
  ].join(", ")})`
);

const sql = `-- Beispiel-Katalog (identisch mit data/catalog.json) für ein frisches Projekt.
-- Erzeugt mit \`npm run seed:generate\` — nicht von Hand bearbeiten.
-- Erst nach allen Migrationen ausführen.
insert into public.products
  (sku, name, category, product_group, price_cents, width_cm, depth_cm, height_cm,
   dimensions, tint, style_tags, retailer, affiliate_url, image_url, model_url, family)
values
${rows.join(",\n")}
on conflict (sku) do nothing;
`;
writeFileSync("supabase/seed.sql", sql);
console.log(`supabase/seed.sql: ${rows.length} Produkte`);
