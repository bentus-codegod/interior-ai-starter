-- Beispiel-Katalog (identisch mit data/catalog.json) für ein frisches Projekt.
-- Erzeugt aus data/catalog.json. Echte Produkte kommen später per Feed-Import.
insert into public.products
  (sku, name, category, product_group, price_cents, width_cm, depth_cm, height_cm,
   dimensions, tint, style_tags, retailer, affiliate_url, image_url, model_url)
values
  ('SF-LINEN-01', 'Leinensofa 3-Sitzer „Havel“', 'Sofa', 'moebel', 89900, 220, 95, 85, '220 × 95 × 85 cm', '#C9C2B4', '{warm-minimal,soft-modern}', 'Nordheim Wohnen', 'https://example-haendler.de/p/SF-LINEN-01?aff=interior-ai', null, null),
  ('SF-BOUCLE-01', 'Bouclé-Sofa „Wandse“', 'Sofa', 'moebel', 109900, 230, 98, 82, '230 × 98 × 82 cm', '#E7E2D6', '{soft-modern}', 'Casa Verde', 'https://example-haendler.de/p/SF-BOUCLE-01?aff=interior-ai', null, null),
  ('SF-CORD-01', 'Cord-Sofa „Bille“', 'Sofa', 'moebel', 79900, 210, 92, 84, '210 × 92 × 84 cm', '#B7A98C', '{warm-minimal}', 'Elbmöbel', 'https://example-haendler.de/p/SF-CORD-01?aff=interior-ai', null, null),
  ('CH-BOUCLE-01', 'Sessel Bouclé „Finkenau“', 'Sessel', 'moebel', 44900, 78, 82, 74, '78 × 82 × 74 cm', '#E7E2D6', '{soft-modern}', 'Casa Verde', 'https://example-haendler.de/p/CH-BOUCLE-01?aff=interior-ai', null, '/models/sheen-chair.glb'),
  ('CH-LEATHER-01', 'Ledersessel „Kontor“', 'Sessel', 'moebel', 59900, 80, 84, 76, '80 × 84 × 76 cm', '#8A6B4A', '{warm-minimal}', 'Elbmöbel', 'https://example-haendler.de/p/CH-LEATHER-01?aff=interior-ai', null, null),
  ('TB-OAK-01', 'Couchtisch Eiche „Elbe“', 'Couchtisch', 'moebel', 32900, 110, 60, 40, '110 × 60 × 40 cm', '#B08948', '{warm-minimal,soft-modern}', 'Nordheim Wohnen', 'https://example-haendler.de/p/TB-OAK-01?aff=interior-ai', null, null),
  ('TB-MARBLE-01', 'Couchtisch Marmor „Alster“', 'Couchtisch', 'moebel', 44900, 100, 100, 38, '100 × 100 × 38 cm', '#D8D5CE', '{soft-modern}', 'Casa Verde', 'https://example-haendler.de/p/TB-MARBLE-01?aff=interior-ai', null, null),
  ('RUG-WOOL-01', 'Wollteppich „Deich“', 'Teppich', 'moebel', 24900, 200, 300, 2, '200 × 300 cm', '#9C6B4A', '{warm-minimal,soft-modern}', 'Nordheim Wohnen', 'https://example-haendler.de/p/RUG-WOOL-01?aff=interior-ai', null, null),
  ('RUG-BERBER-01', 'Berber-Teppich „Moor“', 'Teppich', 'moebel', 29900, 170, 240, 2, '170 × 240 cm', '#CFC6B4', '{warm-minimal}', 'Elbmöbel', 'https://example-haendler.de/p/RUG-BERBER-01?aff=interior-ai', null, null),
  ('LMP-BRASS-01', 'Stehleuchte Messing „Isar“', 'Leuchte', 'moebel', 18900, 28, 28, 155, 'Ø 28 × 155 cm', '#B99A5B', '{warm-minimal}', 'Nordheim Wohnen', 'https://example-haendler.de/p/LMP-BRASS-01?aff=interior-ai', null, null),
  ('LMP-PAPER-01', 'Papierleuchte „Spree“', 'Leuchte', 'moebel', 12900, 45, 45, 160, 'Ø 45 × 160 cm', '#EEE9DE', '{soft-modern}', 'Casa Verde', 'https://example-haendler.de/p/LMP-PAPER-01?aff=interior-ai', null, null),
  ('SH-OAK-01', 'Regal Eiche „Kontor“', 'Regal', 'moebel', 39900, 80, 32, 200, '80 × 200 × 32 cm', '#8A6B4A', '{warm-minimal,soft-modern}', 'Elbmöbel', 'https://example-haendler.de/p/SH-OAK-01?aff=interior-ai', null, null),
  ('SB-OAK-01', 'Sideboard Eiche „Speicher“', 'Sideboard', 'moebel', 54900, 160, 45, 70, '160 × 45 × 70 cm', '#9A7B52', '{warm-minimal}', 'Nordheim Wohnen', 'https://example-haendler.de/p/SB-OAK-01?aff=interior-ai', null, null),
  ('SB-WHITE-01', 'Sideboard weiß „Neruda“', 'Sideboard', 'moebel', 49900, 150, 42, 68, '150 × 42 × 68 cm', '#EDEBE6', '{soft-modern}', 'Casa Verde', 'https://example-haendler.de/p/SB-WHITE-01?aff=interior-ai', null, null),
  ('DK-PILLOW-01', 'Kissen-Set Leinen „Watt“ (2 Stück)', 'Kissen', 'deko', 5900, 50, 15, 50, '50 × 50 × 15 cm', '#D9CFBD', '{warm-minimal}', 'Nordheim Wohnen', 'https://example-haendler.de/p/DK-PILLOW-01?aff=interior-ai', null, null),
  ('DK-PILLOW-02', 'Kissen-Set Bouclé „Düne“ (2 Stück)', 'Kissen', 'deko', 6900, 45, 15, 45, '45 × 45 × 15 cm', '#EFEBE2', '{soft-modern}', 'Casa Verde', 'https://example-haendler.de/p/DK-PILLOW-02?aff=interior-ai', null, null),
  ('DK-PLAID-01', 'Wollplaid „Föhr“', 'Plaid', 'deko', 7900, 130, 170, 1, '130 × 170 cm', '#A88B6A', '{warm-minimal}', 'Elbmöbel', 'https://example-haendler.de/p/DK-PLAID-01?aff=interior-ai', null, null),
  ('DK-PLAID-02', 'Bouclé-Plaid „Sylt“', 'Plaid', 'deko', 8900, 140, 180, 1, '140 × 180 cm', '#E4DED2', '{soft-modern}', 'Casa Verde', 'https://example-haendler.de/p/DK-PLAID-02?aff=interior-ai', null, null),
  ('DK-VASE-01', 'Keramikvase „Ton“', 'Vase', 'deko', 4900, 18, 18, 35, 'Ø 18 × 35 cm', '#B4876A', '{warm-minimal}', 'Nordheim Wohnen', 'https://example-haendler.de/p/DK-VASE-01?aff=interior-ai', null, null),
  ('DK-VASE-02', 'Glasvase „Welle“', 'Vase', 'deko', 3900, 16, 16, 30, 'Ø 16 × 30 cm', '#C8D2CC', '{soft-modern}', 'Casa Verde', 'https://example-haendler.de/p/DK-VASE-02?aff=interior-ai', null, null),
  ('DK-ART-01', 'Kunstdruck gerahmt „Horizont“', 'Wandbild', 'deko', 9900, 70, 3, 100, '70 × 100 cm', '#CBBFA8', '{warm-minimal,soft-modern}', 'Elbmöbel', 'https://example-haendler.de/p/DK-ART-01?aff=interior-ai', null, null),
  ('DK-PLANT-01', 'Kunstpflanze Olivenbaum „Hain“', 'Pflanze', 'deko', 11900, 60, 60, 150, 'Ø 60 × 150 cm', '#7F8A6A', '{soft-modern,warm-minimal}', 'Nordheim Wohnen', 'https://example-haendler.de/p/DK-PLANT-01?aff=interior-ai', null, null)
on conflict (sku) do nothing;
