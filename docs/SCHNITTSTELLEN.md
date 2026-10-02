# Schnittstellen

Überblick über alle Andockpunkte für echte Daten und externe Dienste.
Alles ist optional: Ohne Konfiguration läuft die App mit dem Beispiel-Katalog.

| Schnittstelle | Wo | Status |
| --- | --- | --- |
| Produkt-Import (Feeds, Händler-APIs, Lieferantenlisten) | `lib/sources/`, `/api/admin/import` | ✅ fertig, getestet mit Beispiel- und Awin-förmigen Daten |
| Klick-Tracking Händler-Links | `/go/[sku]` | ✅ |
| Swipe-Statistik | `/api/events`, View `product_feedback` | ✅ |
| Container-/Frachtschätzung | `lib/sourcing/container.ts`, `/api/logistics/estimate` | ✅ Rechnung fertig, **Raten sind Platzhalter** |
| Raumvermessung | `lib/ai/measure.ts`, `/api/measure` | ⚠️ nur Schnittstelle (antwortet 501) |
| Bildmodell | `lib/ai/provider.ts` | ✅ ComfyUI/RunPod, ModelsLab, Replicate (Gerüst), Mock |
| Zahlung | `/api/checkout`, `/api/stripe/webhook` | ✅ |

---

## 1. Produkt-Import — echte Möbel in die Datenbank

```
Quelle ──fetch──> Rohzeilen ──Mapping──> einheitliche Felder ──Prüfen & Einordnen──> products
(Feed/API/Liste)   (fetchers.ts)  (mapping.ts)                  (normalize.ts, classify.ts)  (importer.ts)
```

**Was automatisch passiert:**
- **Spalten-Mapping** mit Vorlagen: `awin` (Awin-Standardfeed), `generic`
  (deutsche/englische Händler- und Lieferantenlisten), `interior-ai` (unser Format).
  Einzelne Felder lassen sich pro Quelle überschreiben.
- **CSV** nach RFC 4180 (Anführungszeichen, Umbrüche in Feldern), Trennzeichen
  wird erkannt, `.gz` wird entpackt. **JSON-APIs** mit Pfad zur Produktliste
  und Seitenweise-Abruf.
- **Einordnung:** Kategorie (Stichwörter DE/EN in Name und Händler-Kategorie),
  Möbel/Deko, Material-Familie (Eiche, Nussbaum, Teak, Rattan, Bouclé, Weiß —
  wichtig für die Kopplung), Stil-Tags, Maße aus Text („B 220 x T 95 x H 85 cm“,
  „Ø 45 x 160“, mm/m), Preise in deutschen und englischen Formaten.
- **Prüfung:** Zeilen ohne ID, Name, Preis, mit fremder Währung (vorerst nur EUR),
  ohne gültigen Link (bei Affiliate) oder mit unbekannter Kategorie werden
  übersprungen und **mit Grund im Bericht gezählt** statt falsch importiert.
- **SKU** = Quellen-ID + ID beim Händler (z. B. `AWIN-NORDHEIM-12345`), damit
  ein erneuter Import dasselbe Produkt aktualisiert.
- **Aufräumen:** Produkte einer Quelle, die im neuen Feed fehlen, werden
  deaktiviert — aber nur, wenn der Feed überhaupt Produkte geliefert hat.
- **Protokoll** jedes Laufs in `import_runs`.

### Eine Quelle anlegen (Supabase SQL-Editor)

Awin-Feed eines Händlers:
```sql
insert into public.product_sources (id, name, kind, config) values (
  'awin-nordheim', 'Nordheim Wohnen', 'csv_url',
  '{
     "urlEnv": "AWIN_FEED_NORDHEIM_URL",
     "mappingPreset": "awin",
     "gzip": true,
     "categoryMap": { "Wohnzimmer > Sofas": "Sofa" }
   }'
);
```
Bei Awin steckt der API-Schlüssel in der Feed-URL. Deshalb steht hier nur der
**Name** einer Umgebungsvariable (`urlEnv`); die vollständige Feed-URL wird bei
Vercel als `AWIN_FEED_NORDHEIM_URL` gesetzt. Ohne Schlüssel geht auch `"url"`.

Händler-API mit Token (JSON):
```sql
insert into public.product_sources (id, name, kind, config) values (
  'haendler-api', 'Händler mit API', 'json_api',
  '{
     "url": "https://api.haendler.example/v1/products",
     "itemsPath": "data.items",
     "pagination": { "param": "page", "start": 1, "maxPages": 50 },
     "authEnv": "HAENDLER_API_TOKEN",
     "mappingPreset": "generic",
     "mapping": { "price": ["price.amount"], "imageUrl": ["images.0.url"] }
   }'
);
```
`HAENDLER_API_TOKEN` wird dann bei Vercel als Umgebungsvariable gesetzt —
Tokens stehen nie in der Datenbank.

Lieferantenliste für Private Label (ohne Händler-Link, mit Einkaufspreis,
Herkunft, Volumen):
```sql
insert into public.suppliers (name, kind, country, lead_time_days, moq)
  values ('Lieferant A', 'private_label', 'PT', 45, 20) returning id;

insert into public.product_sources (id, name, kind, supplier_id, config) values (
  'lieferant-a', 'Lieferant A', 'csv_url', '<id von oben>',
  '{ "url": "https://.../preisliste.csv", "mappingPreset": "generic",
     "source": "private_label", "defaults": { "retailer": "Interior AI" } }'
);
```
Erkannte Spalten (Auszug): `sku/artikelnummer`, `name/bezeichnung`,
`preis/price`, `ek/einkaufspreis`, `breite/tiefe/hoehe` oder `masse`,
`cbm`, `gewicht_kg`, `herkunftsland`, `lieferzeit_tage`, `moq`, `material`,
`farbe`, `bild_url`. Vollständige Liste: `lib/sources/mapping.ts`.

### Import starten

Immer zuerst als **Dry-Run** — zeigt, was importiert würde, ohne zu schreiben:
```bash
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://DEINE-DOMAIN/api/admin/import?source=awin-nordheim&dryRun=1"
```
Antwort: gelesene Zeilen, importierbare Produkte, übersprungene mit Grund
(`kategorie_unbekannt`, `kein_preis`, …), Verteilung auf Kategorien und die
ersten 5 Produkte zur Kontrolle. Passt alles: ohne `dryRun` aufrufen.

Zum Ausprobieren ohne echte Quelle: `?source=sample` (Beispiel-Feed).

**Automatisch täglich:** `vercel.json` startet den Import jeden Tag um 03:17 UTC
für alle aktiven Quellen. Dafür bei Vercel `CRON_SECRET` setzen (Vercel schickt
es automatisch mit).

### Erweitern
- Neues Feed-Format: Vorlage in `MAPPING_PRESETS` (`lib/sources/mapping.ts`).
- Neue Kategorie: Regel in `RULES` (`lib/sources/classify.ts`) — Reihenfolge
  zählt, spezifische Regeln zuerst. Die Kategorie muss auch in einem Look
  vorkommen, damit sie vorgeschlagen wird.
- Unsichere Einordnung: Später kann `classifyCategory` durch eine KI-Einordnung
  ersetzt werden — die Funktion bleibt gleich.

---

## 2. Klick-Tracking — `/go/[sku]`

„Beim Händler ansehen“ führt über `/go/SKU?look=…`. Der Server zählt den Klick
in `affiliate_clicks` (nur SKU, Look, Zeit — keine IP, keine Nutzer-ID) und
leitet auf den Händler-Link aus dem **Katalog** weiter (nie aus der URL — keine
offene Weiterleitung). Auswertung zum Beispiel:
```sql
select sku, count(*) from affiliate_clicks
where created_at > now() - interval '30 days' group by sku order by 2 desc;
```

## 3. Swipe-Statistik — `/api/events`

Jedes ✕, ♥ und Tauschen wird anonym gezählt (`swipe_events`). Die View
`product_feedback` zeigt je Produkt Likes, Dislikes und Tausch-Häufigkeit —
Grundlage für Sortimentspflege und später ein Stilprofil.

## 4. Container-/Frachtschätzung — `/api/logistics/estimate`

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"items":[{"sku":"SF-LINEN-01","quantity":10},{"sku":"CHR-OAK-01","quantity":40}]}' \
  https://DEINE-DOMAIN/api/logistics/estimate
```
Rechnet je Herkunftsland Volumen und Gewicht (echte `cbm`/`weight_kg` oder aus
den Maßen geschätzt) und wählt die günstigste Mischung aus Stückgut (LCL),
20'- und 40'HC-Containern.
**Die Frachtraten sind Platzhalter** (`PLACEHOLDER_RATES`). Für echte Angebote
`FreightQuoteProvider` implementieren (Spediteur-API) oder die Raten mit
echten Angeboten ersetzen.

## 5. Raumvermessung — `/api/measure`

Nur die Schnittstelle (`RoomMeasurer` in `lib/ai/measure.ts`), antwortet heute
mit 501. Ein Verfahren (Tiefenschätzung + Referenzmaß, externer Dienst oder
LiDAR aus einer Handy-App) implementiert `measure()` und liefert Maße mit einer
ehrlichen `confidence`. Das Frontend kann damit die Maßfelder vorbefüllen.

---

## Umgebungsvariablen dazu

| Variable | Wofür |
| --- | --- |
| `ADMIN_TOKEN` | manueller Aufruf von `/api/admin/import` |
| `CRON_SECRET` | täglicher Import über Vercel Cron |
| beliebig, z. B. `HAENDLER_API_TOKEN` | Token einer Quelle (Name steht in `config.authEnv`) |
| beliebig, z. B. `AWIN_FEED_NORDHEIM_URL` | Feed-URL mit Schlüssel (Name steht in `config.urlEnv`) |

## Datenbank

Migrationen in Reihenfolge ausführen (`supabase/migrations/`), danach
optional `supabase/seed.sql`. Neu in dieser Runde:
`20261003000000_sources_sourcing_tracking.sql` (Quellen, Import-Läufe,
Sourcing-Felder, Klicks, Swipes).
