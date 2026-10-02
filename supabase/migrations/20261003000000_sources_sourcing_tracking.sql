-- ---------------------------------------------------------------------------
-- Schnittstellen für echte Möbeldaten und Säule 1 (Sourcing)
--
--   product_sources  -> woher Produkte kommen (Affiliate-Feed, Händler-API,
--                       Lieferanten-Liste). Secrets stehen NICHT hier,
--                       sondern als Umgebungsvariable (config.authEnv).
--   import_runs      -> Protokoll jedes Imports
--   suppliers / products erweitert um Sourcing-Daten (Herkunft, MOQ,
--                       Lieferzeit, Volumen für die Container-Planung)
--   affiliate_clicks -> Klicks auf Händler-Links (ohne IP, ohne Nutzer-ID)
--   swipe_events     -> anonyme Swipe-Statistik (welche Stücke gefallen)
-- ---------------------------------------------------------------------------

-- Lieferanten: Sourcing-Angaben ---------------------------------------------
alter table public.suppliers
  add column country         text,                  -- ISO-Code, z. B. 'PT', 'VN'
  add column currency        text not null default 'EUR',
  add column lead_time_days  integer check (lead_time_days >= 0),
  add column moq             integer check (moq >= 0), -- Mindestbestellmenge
  add column incoterm        text,                  -- z. B. 'FOB', 'EXW', 'DDP'
  add column port_of_loading text,                  -- z. B. 'CNSHA', 'PTLEI'
  add column website         text;

-- Produktquellen ---------------------------------------------------------------
create table public.product_sources (
  id          text primary key,          -- kurz & stabil, wird SKU-Präfix
  name        text not null,
  kind        text not null check (kind in ('csv_url', 'json_api', 'manual')),
  supplier_id uuid references public.suppliers (id),
  -- Nicht-geheime Einstellungen: url, format, mapping, delimiter, itemsPath,
  -- authEnv (NAME der Umgebungsvariable mit dem API-Key), defaults ...
  config      jsonb not null default '{}'::jsonb,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  last_run_at timestamptz
);

create table public.import_runs (
  id          bigint generated always as identity primary key,
  source_id   text not null references public.product_sources (id) on delete cascade,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  status      text not null default 'running'
              check (status in ('running', 'ok', 'failed')),
  dry_run     boolean not null default false,
  rows_read   integer not null default 0,
  upserted    integer not null default 0,
  skipped     integer not null default 0,
  deactivated integer not null default 0,
  error       text
);
create index import_runs_source_idx on public.import_runs (source_id, started_at desc);

-- Produkte: Herkunft und Sourcing-Daten -----------------------------------------
alter table public.products
  add column source_id      text references public.product_sources (id),
  add column external_id    text,            -- ID beim Händler/Lieferanten
  add column supplier_sku   text,
  add column currency       text not null default 'EUR',
  add column lead_time_days integer check (lead_time_days >= 0),
  add column moq            integer check (moq >= 0),
  add column cbm            numeric check (cbm >= 0),        -- Packvolumen m³
  add column weight_kg      numeric check (weight_kg >= 0),  -- Packgewicht
  add column origin_country text,
  add column last_seen_at   timestamptz;
create unique index products_source_external_idx
  on public.products (source_id, external_id) where source_id is not null;

-- Klicks auf Händler-Links ---------------------------------------------------------
create table public.affiliate_clicks (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  sku        text not null,
  look_id    text
);
create index affiliate_clicks_sku_idx on public.affiliate_clicks (sku, created_at);

-- Anonyme Swipe-Statistik -----------------------------------------------------------
create table public.swipe_events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  look_id    text not null,
  sku        text not null,
  action     text not null check (action in ('like', 'dislike', 'swap_in', 'swap_out'))
);
create index swipe_events_sku_idx on public.swipe_events (sku, action);

-- Auswertung: Beliebtheit je Produkt
create view public.product_feedback
with (security_invoker = true) as
select
  sku,
  count(*) filter (where action = 'like')                        as likes,
  count(*) filter (where action = 'dislike')                     as dislikes,
  count(*) filter (where action = 'swap_in')                     as swapped_in,
  count(*) filter (where action = 'swap_out')                    as swapped_out
from public.swipe_events
group by sku;

alter table public.product_sources  enable row level security;
alter table public.import_runs      enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.swipe_events     enable row level security;
