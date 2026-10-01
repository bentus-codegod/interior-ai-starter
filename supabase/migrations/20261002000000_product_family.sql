-- Material-/Serien-Familie je Produkt (z. B. 'eiche', 'nussbaum').
-- Gekoppelte Stücke eines Looks (Bett + Nachttische, Tisch + Stühle)
-- werden aus derselben Familie gewählt — siehe lib/roomEdit.ts.
alter table public.products add column family text;
create index products_family_idx on public.products (family) where family is not null;
