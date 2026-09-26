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

Dann `http://localhost:3000` öffnen. Ohne jeden Key läuft alles im **Mock-Modus**:
Der Render ist ein Platzhalter, der komplette Ablauf ist trotzdem sichtbar.

## Keys eintragen (in `.env.local`, nie im Code)

| Variable | Wofür | Nötig? |
| --- | --- | --- |
| `AI_PROVIDER` | `mock`, `modelslab` oder `replicate` | Standard `mock` |
| `MODELSLAB_API_KEY` | echte Interior-Render-API | nur bei `modelslab` |
| `REPLICATE_API_TOKEN` | alternatives Bildmodell | nur bei `replicate` |
| `STRIPE_SECRET_KEY` | Checkout (Test-Modus, `sk_test_…`) | für echten Kauf-Flow |
| `DAILY_AI_COST_CAP_EUR` | harte Tages-Kostenbremse | Standard 5 |

Ohne `STRIPE_SECRET_KEY` funktioniert alles außer dem Checkout-Button.

## Wie es aufgebaut ist

- `app/page.tsx` — der Wow-Flow (Upload → Look → Render → Shop the Look)
- `app/api/render` — ruft das KI-Modell auf (serverseitig, geschützt)
- `app/api/checkout` — erzeugt die Stripe-Checkout-Session (serverseitig)
- `lib/ai/provider.ts` — die Modell-Abstraktion (Modell wechselbar)
- `lib/ai/renderRoom.ts` — verbindet Render mit echten SKUs
- `lib/catalog.ts` + `data/catalog.json` — Produkte (inkl. Maße) und Capsule-Looks
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
- **Upload-Validierung** (Typ und Größe) vor jedem Modell-Call.
- **Keine Kartendaten.** Bezahlung läuft komplett über Stripes gehostetes
  Checkout.

## Was noch Platzhalter / Stub ist

- **Render im Mock-Modus** — echtes Modell einstöpseln über `AI_PROVIDER=replicate`
  und die Modell-Version in `lib/ai/provider.ts`.
- **Kein Login.** Für den reinen Wow-Test nicht nötig. Sobald du E-Mails oder
  Personendaten sammelst: Managed-Auth (Clerk/Auth0/Supabase) einbauen.
- **Rate-Limit im Arbeitsspeicher** — für Produktion auf Upstash/Redis umstellen.
- **Kein echtes Bestell-/Fulfillment-System.**

## Die Linie (Phase E) — bevor echtes Geld fließt

Dieser Bausatz bringt dich zu einem sauberen, sicheren **Prototyp**. Vor einem
echten Launch mit Live-Zahlungen und vielen Personendaten gilt:

- Sicherheits-Review / Pentest durch jemanden mit Erfahrung
- richtiges Commerce-Backend, Bestell-Management, Auth, DSGVO-Umsetzung
- spätestens jetzt einen technischen Mitgründer an Bord

Ein vibe-gecodeter Prototyp zum Testen ist in Ordnung. Ein Produktivsystem mit
echtem Geld und DSGVO-Daten ist kein Solo-Job.
