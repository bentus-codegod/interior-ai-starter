# Affiliate-Netzwerke & echte Möbelhändler — Schritt-für-Schritt

Stand: 08.10.2026. Diese Anleitung ist das „Wie konkret"-Dokument zu
`AFFILIATE.md`. Sie zeigt mit **echten Netzwerken und echten Händlern**, wie du
aus den Beispielprodukten verlinkbare, Provision-tragende Möbel machst — und
liefert fertige `product_sources`-Einträge zum Kopieren.

> ⚠️ **Zahlen ändern sich.** Provisionssätze sind fast immer „bis zu"-Werte,
> Cookie-Zeiten und ob ein Programm gerade **offen** ist, hängen vom Netzwerk ab
> und wechseln. Die Werte hier sind der recherchierte Stand (Okt. 2026) zur
> Orientierung — den **verbindlichen** Satz siehst du erst im Netzwerk, nachdem
> der Händler dich angenommen hat. Prüf ihn dort, bevor du damit rechnest.

---

## 0. Das Wichtigste in einem Absatz

Du verdienst, indem du Nutzer über einen **getrackten Link** zum Händler
schickst; kaufen sie dort, bekommst du Provision. Den getrackten Link **und**
den Produkt-Feed (Bilder, Preise, Maße) bekommst du über ein **Affiliate-
Netzwerk**. Praktisch heißt das: bei **einem** Netzwerk anmelden → beim
Netzwerk die **Händler-Programme** freischalten lassen → pro Händler einen
**Feed-Link** erzeugen → diesen Link als `product_sources`-Zeile bei euch
eintragen → Dry-Run → Import. Fertig.

**Empfohlener erster Zug für dich:** Melde dich bei **Awin** an (ein Netzwerk,
das die meisten passenden Händler bündelt) und parallel bei **Daisycon** (dort
ist **Westwing** offen und passt optisch perfekt). Starte mit **OTTO Home &
Living** als erster echter Quelle — riesiger Katalog, eine Anmeldung, guter Satz.

---

## 1. Die Netzwerke (wo du dich anmeldest)

Ein Netzwerk ist der Marktplatz zwischen dir (Publisher) und den Händlern
(Advertisern). Du brauchst nicht alle — fang mit ein, zwei an.

### Awin — das wichtigste für euch
- **Warum:** größtes Netzwerk im DACH-Raum, bündelt viele passende Händler
  (OTTO, Home24, Etsy u. a.). Hat die fertige **„Create-a-Feed"**-Funktion, die
  genau den Feed-Link erzeugt, den euer Importer braucht.
- **Kosten:** **5 € Anmelde-Depot** bei der Registrierung. Awin ist das einzige
  Netzwerk, das das verlangt. Wirst du angenommen, wird das Geld deinem Konto
  gutgeschrieben und mit der ersten Auszahlung verrechnet — es ist also kein
  echter Verlust, nur eine Hürde gegen Spam-Anmeldungen.
- **Prüfung:** manuell, Ziel ~24 h (werktags). Du gibst deine Website/Domain an
  und beschreibst, wie du bewirbst. → **Deshalb brauchst du vorher deine Domain
  live** (die Vercel-URL oder eure eigene Domain), sonst wird die Anmeldung
  wahrscheinlich abgelehnt.
- **Anmeldung:** awin.com → „Sign up" als Publisher.

### Daisycon — für Westwing
- Niederländisches Netzwerk, **kostenlos** für Publisher. Führt **Westwing DE**
  als **offenes** Programm (4,9–6 %, 30 Tage Cookie). Lohnt sich allein deshalb,
  weil Westwing optisch exakt euer Stil ist.
- Anmeldung: daisycon.com → als Publisher registrieren.

### CJ Affiliate (Commission Junction) — für Wayfair & Co.
- Großes internationales Netzwerk, kostenlos. Führt **Wayfair** (5–7 %, 7 Tage),
  Houzz, Lumens u. a. Sinnvoll, sobald du über die DACH-Händler hinaus willst.

### Belboon — deutsches Netzwerk
- Berliner Netzwerk, **kostenlos** für Publisher, viele kleinere DE-Shops
  (z. B. boho office). Gute Ergänzung, kein Muss zum Start.

### Amazon PartnerNet (Amazon Associates) — der einfachste Einstieg
- **Vorteil:** schnell angenommen, riesiger Katalog, alles aus einer Hand.
- **Nachteil:** **Cookie nur 24 Stunden** (bei Möbeln, die man tagelang
  überlegt, ein echter Nachteil) und niedriger Satz (~3 % in der Kategorie
  Möbel). Gut, um den Ablauf **einmal end-to-end** zu testen, schwächer als
  Dauerlösung.

> Weitere Netzwerke, die bei einzelnen Händlern auftauchen: **TradeTracker**,
> **Partnerize**, **Rakuten Advertising**, **Admitad**, **Webgains**,
> **MCANISM**. Du meldest dich nur dort an, wenn ein Händler, den du unbedingt
> willst, ausschließlich dort liegt.

---

## 2. Echte Händler, die zu euch passen

Sortiert nach „passt zum Interior-Stil **und** hat verwertbare Konditionen".
Alle Prozentzahlen sind Höchstsätze („bis zu").

| Händler | Netzwerk | Provision | Cookie | Warum / Hinweis |
|---|---|---|---|---|
| **OTTO** (Home & Living) | Awin | **12 %** (Home & Living; bis 15 % Mode) | 30 Tage | Riesiger Katalog, Basket-Attribution, eine Anmeldung. **Top-Start.** |
| **Westwing** | Daisycon (DE **offen**) | 4,9–6 % | 30 Tage | Optisch genau euer Stil (kuratiertes Design). Auch auf Awin, dort aber „closed". |
| **Home24** | Awin (DE) / Admitad | 4–10 % gestaffelt* | 30 Tage (Admitad) | Reiner Online-Möbelhändler. **Status prüfen** — war zuletzt teils „closed". |
| **Connox** | Awin | bis 8 % | — | Design-Interior, hochwertig; gehört zur Gruppe mit AmbienteDirect. |
| **AmbienteDirect** | — (Connox-Gruppe) | bis 8 % | — | Premium-Designmöbel. |
| **Cairo.de** | Partnerize | bis 8 % | — | Design-Möbel & Klassiker. |
| **Butlers** | — | bis 6 % | — | Deko & Accessoires — gut für die „Shop the Look"-Deko-Zeilen. |
| **Wayfair** | CJ Affiliate | 5–7 % | 7 Tage | Sehr großer Katalog; kurzer Cookie. |
| **Amazon PartnerNet** | Amazon | ~3 % (Möbel) | **24 Std.** | Einfachster Einstieg zum Testen, schwächste Dauerkonditionen. |

\* Home24-Staffel (Beispiel DE): bis 10 % je nach monatlichem Umsatz, aber nur
4 % bei Verkäufen mit Gutschein.

**Die 3, mit denen ich starten würde:**
1. **OTTO** (über Awin) — größter Hebel, eine Anmeldung, Home & Living passt.
2. **Westwing** (über Daisycon) — offen, kostenlos, perfekter Look.
3. **Home24** (über Awin) — reine Möbel, wenn gerade offen.

Damit deckst du Mainstream (OTTO), Design/Deko (Westwing) und reine Möbel
(Home24) ab — und brauchst nur **zwei** Netzwerk-Anmeldungen.

---

## 3. Schritt für Schritt — von Null zum ersten echten Produkt

### Schritt A — Voraussetzung: Seite muss erreichbar sein
Netzwerke nehmen nur Publisher mit einer sichtbaren Promo-Fläche. Eure Vercel-
Seite reicht, eine eigene Domain wirkt seriöser. Halte die URL bereit.

### Schritt B — Beim Netzwerk anmelden
- **Awin:** awin.com → Sign up → Publisher. Website-URL + kurze Beschreibung
  („KI-gestützte Interior-Design-App, die passende Möbel zu Raumfotos
  empfiehlt"). 5 € Depot zahlen. Auf Freigabe warten (~24 h).
- **Daisycon:** daisycon.com → Publisher-Registrierung (kostenlos).

### Schritt C — Händler-Programm beantragen
Im Netzwerk nach dem Händler suchen (z. B. „OTTO") → **„Join program" /
„Programm beantragen"**. Manche bestätigen automatisch, manche manuell
(1–3 Tage). Erst **nach Annahme** bekommst du den getrackten Link und den Feed.

### Schritt D — Den Produkt-Feed erzeugen (Beispiel Awin)
1. In Awin: **Toolbox → Create-a-Feed** (Produktdaten-Feed).
2. Angenommene(s) Programm(e) wählen, Format **CSV**, optional **gzip** an,
   Spalten übernehmen (Standard reicht; wichtig sind Name, Preis, Bild,
   Deeplink/getrackter Link, Kategorie, Maße).
3. Awin erzeugt eine **dauerhafte Download-URL** in der Form
   `https://productdata.awin.com/datafeed/download/apikey/DEINKEY/...`.
   **In dieser URL steckt dein Schlüssel** — sie gehört behandelt wie ein
   Secret (nur zu Vercel, nie ins GitHub).

### Schritt E — Feed-URL als Secret bei Vercel hinterlegen
Vercel → Projekt → Settings → Environment Variables. Name frei wählbar, aber
sprechend, z. B.:

| Name | Value |
|---|---|
| `AWIN_FEED_OTTO_URL` | die komplette Create-a-Feed-URL von OTTO |

### Schritt F — Quelle in `product_sources` eintragen (Supabase SQL-Editor)

**OTTO (Awin, gzip-CSV):**
```sql
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
       "Wohnen > Leuchten": "Lampe"
     }
   }'
);
```

**Home24 (Awin):**
```sql
insert into public.product_sources (id, name, kind, config) values (
  'awin-home24', 'home24', 'csv_url',
  '{ "urlEnv": "AWIN_FEED_HOME24_URL", "mappingPreset": "awin",
     "gzip": true, "source": "affiliate" }'
);
```

**Westwing (Daisycon — meist CSV/XML-Feed-URL mit Schlüssel):**
```sql
insert into public.product_sources (id, name, kind, config) values (
  'daisycon-westwing', 'Westwing', 'csv_url',
  '{ "urlEnv": "DAISYCON_FEED_WESTWING_URL", "mappingPreset": "generic",
     "delimiter": ";", "source": "affiliate" }'
);
```
> Bei Nicht-Awin-Feeds ist die Spaltenbenennung anders — darum
> `mappingPreset: "generic"`. Zeigt der Dry-Run falsch zugeordnete Felder,
> überschreibst du sie gezielt mit `"mapping": { ... }` (siehe
> `docs/SCHNITTSTELLEN.md`).

### Schritt G — Dry-Run (schreibt nichts, zeigt nur den Bericht)
```bash
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://DEINE-DOMAIN/api/admin/import?source=awin-otto&dryRun=1"
```
Der Bericht zeigt: wie viele Zeilen gelesen, wie viele importiert **würden**,
was übersprungen wird und **warum** (z. B. `kategorie_unbekannt` → dann die
`categoryMap` ergänzen). So lange anpassen, bis das Ergebnis sauber ist.

### Schritt H — Echter Import
Gleicher Aufruf **ohne** `&dryRun=1`. Danach läuft der Import **täglich
automatisch** per Vercel Cron (dafür ist `CRON_SECRET` da) — Preise/Verfügbarkeit
bleiben aktuell, verschwundene Produkte werden deaktiviert.

---

## 4. Rechtliche Pflichten (kurz, aber wichtig)

- **Werbekennzeichnung:** Affiliate-Links müssen als Werbung erkennbar sein. Der
  Pflicht-Hinweis im „Shop the Look"-Panel deckt die Stelle ab; zusätzlich
  gehört ein allgemeiner Affiliate-Hinweis in die Seite.
- **Impressum + Datenschutzerklärung:** Pflicht, sobald die Seite öffentlich ist
  — in der Datenschutzerklärung müssen die Tracking-/Netzwerk-Dienste genannt
  werden.
- **Netzwerk-AGB:** Jedes Netzwerk hat Publisher-Bedingungen (z. B. keine
  Marken-Gebote in Suchanzeigen, keine Gutschein-Spam). Einmal lesen.

Das ist Rechts-, kein Code-Thema — zum echten Launch kurz prüfen lassen.

---

## 5. Realistische Erwartung

- **Zeit bis zum ersten echten Produkt:** Netzwerk-Anmeldung + Händler-Freigabe
  = meist **2–5 Tage** Wartezeit (nicht Arbeit). Der technische Teil (Feed-URL →
  `product_sources` → Dry-Run → Import) ist in **~30 Minuten** erledigt.
- **Geld:** Mit euren Zahlen (≈7 % Provision, ~450 € Warenkorb) sind das
  ~31 € pro Kauf. Entscheidend ist die Conversion, nicht der Render — siehe
  `docs/SKALIERUNG-UND-ROADMAP.md`.
- **Erst beweisen, dann breiter:** Lieber 2–3 Händler sauber laufen lassen und
  echte Klicks/Käufe sammeln, als zehn Programme halb konfiguriert.

---

## 6. Checkliste

- [ ] Seite öffentlich erreichbar (Vercel-URL oder eigene Domain)
- [ ] Awin-Konto angelegt (5 € Depot gezahlt), Freigabe erhalten
- [ ] Daisycon-Konto angelegt
- [ ] OTTO-Programm beantragt & angenommen
- [ ] Westwing-Programm (Daisycon) beantragt & angenommen
- [ ] Create-a-Feed-URL(s) erzeugt
- [ ] Feed-URLs als `*_URL`-Env-Variablen bei Vercel hinterlegt
- [ ] `product_sources`-Zeile(n) in Supabase eingetragen
- [ ] Dry-Run sauber (Kategorien gemappt, wenige Skips)
- [ ] Echter Import gelaufen, Produkte im Table Editor sichtbar
- [ ] Affiliate-Hinweis + Impressum + Datenschutz gefüllt

---

## Quellen

- [Awin — Application process and joining fee (5 €/£5 Depot)](https://www.awin.com/gb/compliance-and-regulations/application-process-and-joining-fee)
- [OTTO Partnerprogramm (Sätze Home & Living 12 %, Cookie 30 Tage)](https://www.otto.de/partnerprogramm/)
- [Home24 Netzwerke & Staffel-Provision (affi.io)](https://affi.io/m/home24)
- [Westwing Programme & Status je Netzwerk (affi.io)](https://affi.io/m/westwing)
- [Möbel-Partnerprogramme-Übersicht DE (100partnerprogramme.de)](https://www.100partnerprogramme.de/thema/moebel/)
- [Connox-Partnerprogramm (bis 8 %)](https://www.100partnerprogramme.de/p/connox-de-993/)
- [AmbienteDirect-Partnerprogramm (bis 8 %)](https://www.100partnerprogramme.de/p/ambientedirect/)
- [Butlers-Partnerprogramm (bis 6 %)](https://www.100partnerprogramme.de/p/butlers-de-15456/)
- [Home-Decor/Furniture-Programme inkl. Wayfair/CJ (afftank.com)](https://afftank.com/blog/home-decor-furniture-affiliate-programs)
- [Belboon Publisher-Infos](https://www.erfahrungen.com/mit/belboon/)
