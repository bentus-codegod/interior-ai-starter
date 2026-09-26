# Echte Produkte aus Händler-Katalogen (Affiliate)

So werden aus den 14 Beispielprodukten echte, verlinkbare Möbel aus den
Katalogen echter Händler — der Affiliate-first-Weg.

## Das Prinzip

Du holst die Produktdaten **nicht** per KI und **nicht** per Live-Scraping,
sondern über **Affiliate-Netzwerke**. Die geben dir pro Händler einen
Produkt-Feed (CSV/XML/API) mit Bild, Preis, getracktem Link, Kategorie, Maßen.
Kauft jemand über deinen Link, bekommst du eine Provision.

## Schritt für Schritt

1. **Bei einem Netzwerk anmelden:** Awin, CJ (Commission Junction), Impact,
   Amazon PartnerNet oder Belboon. Dort Händler-Programme freischalten.
2. **Feed laden:** Jedes Programm liefert einen Produkt-Feed (Download-URL
   oder API).
3. **Spalten mappen:** Die Feldnamen sind je Netzwerk anders. Normalisiere sie
   einmal auf die `FeedRow` in `lib/affiliateFeed.ts`.
4. **Importieren:** `importFeed(csv)` macht daraus Produkte im App-Format.
   In Produktion schreibst du sie in deine Produkt-Datenbank (Supabase/Postgres)
   statt in `data/catalog.json`.
5. **Aktuell halten:** Feeds täglich neu laden — Preise und Verfügbarkeit
   ändern sich, sonst hast du tote/falsche Links.

## Was schon eingebaut ist

- `lib/affiliateFeed.ts` — Parser (`parseCsvFeed`), Mapper (`feedRowToProduct`),
  `importFeed(csv)`.
- `data/sample-feed.csv` — ein Beispiel-Feed im erwarteten Format.
- Der Produkt-Typ hat bereits `retailer` und `affiliateUrl`; das Shop-the-Look-
  Panel zeigt „Beim Händler ansehen" (Affiliate-Link) und den Pflicht-Hinweis.

## Nächste echte Schritte

- Feed nicht mehr aus einer CSV-Datei, sondern per Netzwerk-API laden.
- Produkte in Supabase/Postgres statt in `catalog.json` speichern.
- Echte Produktbilder statt der farbigen Platzhalter-Kacheln.
- `styleTags` aus den Produktdaten ableiten (Kategorie/Titel/KI-Klassifikation),
  damit das Design-Hirn gut kuratieren kann.

## Rechtlich

Affiliate-Links müssen in Deutschland als Werbung gekennzeichnet sein — der
Hinweis im Shop-the-Look-Panel deckt das an der Stelle ab; zusätzlich brauchst
du Impressum, Datenschutzerklärung und einen allgemeinen Affiliate-Hinweis.
Das ist Rechts-, kein Code-Thema — im Zweifel kurz rechtlich prüfen lassen.
