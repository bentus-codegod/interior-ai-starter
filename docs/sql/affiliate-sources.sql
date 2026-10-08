-- Affiliate-Produktquellen für Interior AI
-- --------------------------------------------------------------------------
-- Im Supabase SQL-Editor ausführen, NACHDEM das jeweilige Programm im Netzwerk
-- angenommen ist und die Feed-URL als Env-Variable bei Vercel hinterlegt wurde.
-- Pro Programm NUR den Block einfügen, den du wirklich freigeschaltet hast.
--
-- Die Feed-URL steht NICHT hier (sie enthält deinen API-Key), sondern als
-- Umgebungsvariable; hier referenzieren wir nur deren NAMEN über "urlEnv".
--
-- Danach Dry-Run:
--   curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
--     "https://DEINE-DOMAIN/api/admin/import?source=awin-otto&dryRun=1"
-- --------------------------------------------------------------------------

-- 1) OTTO Home & Living (Awin) — 12 %, 30 Tage Cookie -----------------------
insert into public.product_sources (id, name, kind, config) values (
  'awin-otto', 'OTTO Home & Living', 'csv_url',
  '{
     "urlEnv": "AWIN_FEED_OTTO_URL",
     "mappingPreset": "awin",
     "gzip": true,
     "source": "affiliate",
     "categoryMap": {
       "Wohnen > Sofas & Couches": "Sofa",
       "Wohnen > Betten": "Bett",
       "Wohnen > Tische": "Tisch",
       "Wohnen > Stühle": "Stuhl",
       "Wohnen > Regale": "Regal",
       "Wohnen > Leuchten": "Lampe",
       "Wohnen > Schränke & Kommoden": "Regal",
       "Wohnen > Sitzbänke": "Stuhl"
     }
   }'::jsonb
)
on conflict (id) do update set config = excluded.config, name = excluded.name, active = true;

-- 2) Westwing (Daisycon) — 4,9–6 %, 30 Tage Cookie --------------------------
insert into public.product_sources (id, name, kind, config) values (
  'daisycon-westwing', 'Westwing', 'csv_url',
  '{
     "urlEnv": "DAISYCON_FEED_WESTWING_URL",
     "mappingPreset": "generic",
     "delimiter": ";",
     "source": "affiliate",
     "categoryMap": {
       "Sofas": "Sofa",
       "Betten": "Bett",
       "Tische": "Tisch",
       "Stühle": "Stuhl",
       "Regale": "Regal",
       "Leuchten": "Lampe"
     }
   }'::jsonb
)
on conflict (id) do update set config = excluded.config, name = excluded.name, active = true;

-- 3) home24 (Awin) — 4–10 % gestaffelt — NUR wenn Programm offen/aktiv ------
insert into public.product_sources (id, name, kind, config) values (
  'awin-home24', 'home24', 'csv_url',
  '{
     "urlEnv": "AWIN_FEED_HOME24_URL",
     "mappingPreset": "awin",
     "gzip": true,
     "source": "affiliate"
   }'::jsonb
)
on conflict (id) do update set config = excluded.config, name = excluded.name, active = true;

-- Kontrolle: welche Quellen sind aktiv?
-- select id, name, active from public.product_sources order by id;
