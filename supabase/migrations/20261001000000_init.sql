-- ---------------------------------------------------------------------------
-- Interior AI — erstes Datenbank-Schema (Supabase / Postgres)
--
-- Deckt ab:
--   * suppliers / products  -> Katalog für Affiliate UND Private Label
--   * orders / order_items  -> Bestellungen aus dem Stripe-Checkout
--   * render_events         -> Kosten-Protokoll pro KI-Render
--
-- Zugriff NUR serverseitig mit dem Service-Role-Key (lib/supabase.ts).
-- RLS ist überall an und es gibt bewusst KEINE Policies: Browser-Clients
-- mit dem anon-Key sehen damit gar nichts. Der Service-Role-Key umgeht RLS.
-- ---------------------------------------------------------------------------

-- Lieferanten (Private Label) bzw. Händler (Affiliate) -----------------------
create table public.suppliers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  kind          text not null default 'affiliate'
                check (kind in ('affiliate', 'private_label', 'manufacturer')),
  contact_email text,
  notes         text,
  created_at    timestamptz not null default now()
);

-- Produkte -------------------------------------------------------------------
create table public.products (
  sku                  text primary key,
  name                 text not null,
  category             text not null,
  product_group        text not null default 'moebel'
                       check (product_group in ('moebel', 'deko')),
  price_cents          integer not null check (price_cents >= 0),
  -- Einkaufspreis (Private Label) — Grundlage der Marge. Nie an den Browser.
  purchase_price_cents integer check (purchase_price_cents >= 0),
  width_cm             numeric not null default 0,
  depth_cm             numeric not null default 0,
  height_cm            numeric not null default 0,
  dimensions           text not null default '',
  tint                 text not null default '#C9C2B4',
  style_tags           text[] not null default '{}',
  retailer             text not null default '',
  affiliate_url        text not null default '',
  image_url            text,
  model_url            text,
  supplier_id          uuid references public.suppliers (id),
  -- 'affiliate' = Kauf beim Händler, 'private_label' = Kauf bei uns.
  source               text not null default 'affiliate'
                       check (source in ('affiliate', 'private_label')),
  stock                integer check (stock >= 0), -- null = nicht lagergeführt
  active               boolean not null default true,
  updated_at           timestamptz not null default now()
);
create index products_category_idx on public.products (category) where active;

-- Bestellungen -----------------------------------------------------------------
create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  stripe_session_id  text not null unique,
  status             text not null default 'pending'
                     check (status in ('pending', 'paid', 'expired',
                                       'shipped', 'delivered', 'cancelled', 'refunded')),
  amount_total_cents integer not null,
  currency           text not null default 'eur',
  customer_email     text,
  customer_name      text,
  shipping_address   jsonb,
  created_at         timestamptz not null default now(),
  paid_at            timestamptz
);

create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  sku              text not null references public.products (sku),
  name             text not null,           -- Name zum Zeitpunkt der Bestellung
  unit_price_cents integer not null,        -- Preis zum Zeitpunkt der Bestellung
  quantity         integer not null default 1 check (quantity > 0),
  supplier_id      uuid references public.suppliers (id)
);
create index order_items_order_idx on public.order_items (order_id);

-- Kosten-Protokoll pro Render --------------------------------------------------
-- Enthält bewusst KEINE Fotos und KEINE IP-Adressen (Datensparsamkeit).
create table public.render_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  provider    text not null,
  look_id     text,
  success     boolean not null,
  duration_ms integer not null,
  cost_eur    numeric(10, 4) not null default 0,
  error       text
);
create index render_events_created_idx on public.render_events (created_at);

-- Tagesübersicht für die Kostenrechnung
create view public.render_costs_daily
with (security_invoker = true) as
select
  date_trunc('day', created_at)::date               as day,
  provider,
  count(*)                                          as renders,
  count(*) filter (where success)                   as successful,
  round(avg(duration_ms) filter (where success))    as avg_duration_ms,
  sum(cost_eur)                                     as cost_eur
from public.render_events
group by 1, 2
order by 1 desc, 2;

-- RLS an, keine Policies -> nur der Server (Service Role) hat Zugriff.
alter table public.suppliers     enable row level security;
alter table public.products      enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.render_events enable row level security;
