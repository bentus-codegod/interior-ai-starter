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
2. **Feed-Link holen:** Jedes Programm liefert einen Produkt-Feed (CSV/XML,
   oft `.gz`) oder eine API.
3. **Quelle anlegen:** eine Zeile in `product_sources` mit Mapping-Vorlage
   (`awin` oder `generic`) — Beispiele in `docs/SCHNITTSTELLEN.md`.
4. **Dry-Run:** `/api/admin/import?source=…&dryRun=1` zeigt, was importiert
   würde und warum Zeilen übersprungen werden. Mapping/`categoryMap` anpassen.
5. **Importieren:** ohne `dryRun`. Danach täglich automatisch per Vercel Cron —
   Preise und Verfügbarkeit bleiben aktuell, verschwundene Produkte werden
   deaktiviert.

## Was schon eingebaut ist

- `lib/sources/` — Abruf (CSV/JSON, gzip, Seiten), Spalten-Mapping mit
  Vorlagen, automatische Einordnung (Kategorie, Möbel/Deko, Material, Stil,
  Maße, Preise), Import mit Bericht.
- `/go/[sku]` — Händler-Links laufen darüber, Klicks werden gezählt
  (`affiliate_clicks`, ohne IP).
- Shop-the-Look zeigt „Beim Händler ansehen“ und den Pflicht-Hinweis.
- `data/sample-feed.csv` — Beispiel-Feed (`?source=sample`).

## Nächste echte Schritte

- Erstes Partnerprogramm freischalten und den Feed per Dry-Run prüfen.
- Produktbilder kommen über den Feed (`imageUrl`) automatisch mit.
- Provisionen der Netzwerke mit den Klicks abgleichen (Conversion-Rate).

## Rechtlich

Affiliate-Links müssen in Deutschland als Werbung gekennzeichnet sein — der
Hinweis im Shop-the-Look-Panel deckt das an der Stelle ab; zusätzlich brauchst
du Impressum, Datenschutzerklärung und einen allgemeinen Affiliate-Hinweis.
Das ist Rechts-, kein Code-Thema — im Zweifel kurz rechtlich prüfen lassen.
