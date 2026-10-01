# Interior AI — Starter

Ein **sicherer Prototyp-Bausatz** für dein KI-Interior-Produkt: Raumfoto hoch,
Look wählen, gestalteten Raum sehen, den ganzen Look über Stripe kaufen. Er läuft
**sofort mit Platzhaltern** — du steckst nur deine Keys rein.

Das deckt Phase A–D deiner Schritt-für-Schritt-Anleitung ab. Der echte Betrieb
mit Live-Zahlungen und vielen Personendaten ist Phase E — dazu unten mehr.

## Starten

Du brauchst [Node.js](https://nodejs.org) (Version 20 oder neuer).

```bash
npm install
cp .env.example .env.local   # Werte eintragen (siehe unten)
npm run dev
```

Tests: `npm test` (Vitest) · Typen: `npm run typecheck` · beides: `npm run check`

Dann `http://localhost:3000` öffnen. Ohne jeden Key läuft alles im **Mock-Modus**:
Der Render ist ein Platzhalter, der komplette Ablauf ist trotzdem sichtbar.

## Keys eintragen (in `.env.local`, nie im Code)

| Variable | Wofür | Nötig? |
| --- | --- | --- |
| `AI_PROVIDER` | `mock`, `comfyui`, `modelslab` oder `replicate` | Standard `mock` |
| `COMFYUI_URL` | eigene KI auf RunPod (siehe `comfy/README.md`) | nur bei `comfyui` |
| `MODELSLAB_API_KEY` | echte Interior-Render-API | nur bei `modelslab` |
| `REPLICATE_API_TOKEN` | alternatives Bildmodell | nur bei `replicate` |
| `STRIPE_SECRET_KEY` | Checkout (Test-Modus, `sk_test_…`) | für echten Kauf-Flow |
| `STRIPE_WEBHOOK_SECRET` | Stripe meldet bezahlte Bestellungen (`whsec_…`) | für Bestellstatus |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Datenbank: Katalog, Bestellungen, Kosten-Protokoll | optional |
| `DAILY_AI_COST_CAP_EUR` | harte Tages-Kostenbremse | Standard 5 |
| `LOGISTICS_SHARE` | Budget-Anteil für Logistik (0–0,6) | Standard 0 |
| `UPSTASH_REDIS_REST_URL` + `_TOKEN` | Rate-Limit über alle Server-Instanzen | optional |
| `ADMIN_TOKEN` / `CRON_SECRET` | Produkt-Import (manuell / täglich) | für Import |

Ohne `STRIPE_SECRET_KEY` funktioniert alles außer dem Checkout-Button.
Ohne Supabase läuft alles mit `data/catalog.json`; Bestellungen und
Render-Kosten landen dann nur im Server-Log.

## Datenbank einrichten (Supabase, optional)

1. Supabase-Projekt anlegen (Region EU, z. B. Frankfurt).
2. Im SQL-Editor nacheinander ausführen:
   - alle Dateien in `supabase/migrations/` in Namensreihenfolge
   - `supabase/seed.sql` — der Beispiel-Katalog (neu erzeugen mit
     `npm run seed:generate`, wenn sich `data/catalog.json` ändert)
3. `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API)
   in `.env.local` bzw. bei Vercel eintragen.

Ab dann kommen die Produkte aus der Tabelle `products`, jede Bestellung
landet in `orders`/`order_items`, und jeder Render in `render_events`.
Die Tagesübersicht für die Kostenrechnung: `select * from render_costs_daily;`

Alle Tabellen haben Row Level Security ohne Policies — nur der Server mit
dem Service-Role-Key kommt heran, der Browser nie.

## Echte Produkte importieren

Feeds von Affiliate-Netzwerken, Händler-APIs und Lieferantenlisten werden über
`/api/admin/import` eingelesen, automatisch eingeordnet und täglich
aktualisiert. Anleitung mit Beispielen: **docs/SCHNITTSTELLEN.md**.

## Bestellungen (Stripe-Webhook)

„Ganzen Look kaufen“ legt eine Bestellung mit Status `pending` an und fragt
bei Stripe die Lieferadresse (DE/AT/CH) ab. Ist die Zahlung durch, meldet
Stripe das an `/api/stripe/webhook` → Status `paid`, mit E-Mail und Adresse.
Einrichten: Stripe-Dashboard → Developers → Webhooks → Endpoint
`https://DEINE-DOMAIN/api/stripe/webhook` mit den Events
`checkout.session.completed`, `checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`, `checkout.session.expired`.
Lokal: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Wie es aufgebaut ist

- `app/page.tsx` — der Wow-Flow (Upload → Raum & Look → Render → Shop the Look)
- `lib/roomEdit.ts` — Swipe, Tauschen und Kopplung (Sets, Material-Familien)
- `lib/stylePrompt.ts` — Freitext-Stil → Render-Prompt
- `lib/budget.ts` — Aufteilung Budget in Einrichtung und Logistik
- `lib/sources/` — Produkt-Import aus Feeds, Händler-APIs und Lieferantenlisten
  (Mapping, automatische Einordnung, Bericht) → `/api/admin/import`
- `lib/sourcing/container.ts` — Container-/Frachtschätzung → `/api/logistics/estimate`
- `app/go/[sku]` — Händler-Links mit Klick-Zählung; `app/api/events` — Swipe-Statistik
- `lib/ai/measure.ts` — Schnittstelle für automatische Raumvermessung (noch ohne Verfahren)
- `docs/` — Schnittstellen, Konzept-Abgleich, Protokoll der Overnight-Sessions
- `app/api/render` — ruft das KI-Modell auf (serverseitig, geschützt)
- `app/api/checkout` — erzeugt die Stripe-Checkout-Session + Bestellung
- `app/api/stripe/webhook` — Stripe meldet bezahlte/abgelaufene Bestellungen
- `lib/ai/provider.ts` — die Modell-Abstraktion (Modell wechselbar)
- `lib/ai/renderRoom.ts` — verbindet Render mit echten SKUs
- `lib/catalog.ts` + `data/catalog.json` — Produkttypen, Looks, Beispiel-Katalog
  (Möbel + Deko & Accessoires)
- `lib/productRepo.ts` — holt Produkte aus Supabase, sonst aus `catalog.json`
- `lib/designBrain.ts` — wählt Produkte nach Stil und Budget (Deko nur, wenn
  sie noch ins Budget passt)
- `lib/orders.ts` — Bestellungen anlegen und Status setzen
- `lib/renderLog.ts` — Kosten-Protokoll pro Render
- `lib/imageResize.ts` — verkleinert Fotos im Browser auf max. 1536 px
- `components/Product3DViewer.tsx` — 3D-Ansicht mit `<model-viewer>` (Modelle
  in `public/models/`)
- `supabase/` — Datenbank-Schema und Beispiel-Daten
- `lib/fitCheck.ts` + `components/RoomMeasurements.tsx` — optionale Raummaß-Eingabe
  und Passform-Check („passt / knapp / passt nicht"). Richtwert gegen teure
  Retouren, keine Garantie. AR/LiDAR-Messen kommt später in einer nativen App.
- `lib/rateLimit.ts` — Rate-Limit + Kosten-Cap
- `lib/validation.ts` — Upload-Prüfung
- `lib/env.ts` — Secrets, nur serverseitig

## Online stellen (für alle erreichbar)

Siehe **DEPLOYMENT.md** — bringt den Starter über GitHub + Vercel online und
richtet das zweigleisige Setup ein: eine stabile Live-Version (`main`) und ein
zweites Gleis (`dev`) mit eigener Preview-URL, an dem du gefahrlos weiterbaust.

## Die Sicherheits-Patterns, die schon eingebaut sind

- **Secrets nur serverseitig.** `lib/env.ts` ist mit `server-only` geschützt —
  der Build bricht ab, falls ein Key ins Frontend rutscht.
- **Backend-Proxy.** Der Browser redet nur mit deinen API-Routen, nie direkt
  mit KI-Anbieter oder Stripe.
- **Preise kommen vom Server.** Der Checkout nimmt nur SKUs entgegen und holt
  die Preise aus dem Katalog — Preis-Manipulation im Frontend ist unmöglich.
- **Rate-Limit + Kosten-Cap** auf dem Render-Endpunkt, bevor er erreichbar ist.
- **Upload-Validierung** (Typ und Größe) vor jedem Modell-Call. Fotos werden
  schon im Browser verkleinert (Vercel nimmt nur ~4,5 MB pro Anfrage an).
- **Webhook mit Signaturprüfung** — nur echte Stripe-Nachrichten ändern
  einen Bestellstatus.
- **Keine Kartendaten.** Bezahlung läuft komplett über Stripes gehostetes
  Checkout.

## Was noch Platzhalter / Stub ist

- **Render im Mock-Modus** — echtes Modell einstöpseln über `AI_PROVIDER=replicate`
  und die Modell-Version in `lib/ai/provider.ts`.
- **Kein Login.** Für den reinen Wow-Test nicht nötig. Sobald du E-Mails oder
  Personendaten sammelst: Managed-Auth (Clerk/Auth0/Supabase) einbauen.
- **Rate-Limit pro IP im Arbeitsspeicher** — für Produktion auf Upstash/Redis
  umstellen. (Die Tages-Kostenbremse nutzt mit Supabase schon die Datenbank.)
- **Bestellungen ja, Fulfillment nein** — Bestellungen werden gespeichert,
  Versand, Retouren und Lieferanten-Weitergabe fehlen noch.
- **Beispiel-Katalog** — Händler, Links und das 3D-Modell sind Platzhalter.

## Die Linie (Phase E) — bevor echtes Geld fließt

Dieser Bausatz bringt dich zu einem sauberen, sicheren **Prototyp**. Vor einem
echten Launch mit Live-Zahlungen und vielen Personendaten gilt:

- Sicherheits-Review / Pentest durch jemanden mit Erfahrung
- richtiges Commerce-Backend, Bestell-Management, Auth, DSGVO-Umsetzung
- spätestens jetzt einen technischen Mitgründer an Bord

Ein vibe-gecodeter Prototyp zum Testen ist in Ordnung. Ein Produktivsystem mit
echtem Geld und DSGVO-Daten ist kein Solo-Job.
