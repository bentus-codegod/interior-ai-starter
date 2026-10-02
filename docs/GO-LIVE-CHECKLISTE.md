# Go-Live-Checkliste: APIs anbinden & hosten

Praktische Reihenfolge, um aus dem Prototyp eine echt laufende Seite zu machen.
Alle Schlüssel kommen bei **Vercel → Settings → Environment Variables** rein
(verschlüsselt, serverseitig) — **nie** in den Code oder ins GitHub.

Reihenfolge ist bewusst gewählt: Datenbank zuerst (danach ist alles „echt"),
dann KI (der wichtigste Beweis), dann Zahlung, dann echte Produkte.

Legende: ☐ = offen · die `MONOSPACE`-Namen sind die exakten Variablennamen aus dem Code.

---

## 0. Vorbereitung (5 Min)
- ☐ Bei Vercel ins Projekt `interior-ai` → **Settings → Environment Variables** finden
- ☐ `NEXT_PUBLIC_BASE_URL` auf die echte Adresse setzen (die Vercel-URL oder später die eigene Domain)
- ☐ Zwei lange Zufalls-Passwörter erzeugen und eintragen:
  - `ADMIN_TOKEN` (für manuelle Produkt-Importe)
  - `CRON_SECRET` (für den täglichen Auto-Import)

---

## 1. Supabase — Datenbank (kostenlos, ~30 Min)
Danach sind Katalog, Bestellungen und Kostenbremse „echt" statt Fallback.

- ☐ Konto auf supabase.com, neues Projekt anlegen (Region: **EU**, z. B. Frankfurt)
- ☐ Im **SQL-Editor** die 3 Migrationen **in dieser Reihenfolge** ausführen
  (Inhalt aus `supabase/migrations/`):
  1. `20261001000000_init.sql`
  2. `20261002000000_product_family.sql`
  3. `20261003000000_sources_sourcing_tracking.sql`
- ☐ Optional `supabase/seed.sql` ausführen (49 Beispielprodukte zum Testen)
- ☐ Unter **Project Settings → API** holen und bei Vercel eintragen:
  - `SUPABASE_URL` (Project URL)
  - `SUPABASE_SERVICE_ROLE_KEY` (service_role, **nicht** der anon-Key — hat Vollzugriff, nur hier!)
- ✅ **Prüfen:** nach Redeploy zeigt die Seite Produkte aus der DB statt aus `catalog.json`

---

## 2. RunPod — die eigene KI (der wichtigste Schritt)
Beweist das Kernprodukt. Anleitung im Detail: `comfy/README.md`.

- ☐ RunPod-Konto, Pod mit **RTX 4090** + ComfyUI-Template starten
- ☐ Über den ComfyUI-Manager installieren:
  - Custom Node „ComfyUI's ControlNet Auxiliary Preprocessors"
  - Modelle: SDXL Base 1.0, ControlNet Depth SDXL, Depth Anything V2
- ☐ `comfy/interior_workflow.json` laden und mit einem Testfoto rendern
- ☐ `comfy/cleanup.sh` auf den Pod kopieren + cron einrichten (DSGVO-Löschung)
- ☐ Bei Vercel eintragen:
  - `COMFYUI_URL` = die Connect-URL des Pods (ohne `/` am Ende)
  - `AI_PROVIDER` = `comfyui`
- ✅ **Prüfen:** echtes Raumfoto hochladen → echter Render statt Platzhalter
- 💡 Kosten gering halten: später auf **Serverless** umstellen (zahlt nur pro Render)

---

## 3. Stripe — Zahlung (Test-Modus zuerst)
- ☐ Stripe-Konto, im **Test-Modus** bleiben
- ☐ `STRIPE_SECRET_KEY` holen (beginnt mit `sk_test_…`) → bei Vercel eintragen
- ☐ **Developers → Webhooks → Add endpoint:**
  - URL: `https://DEINE-DOMAIN/api/stripe/webhook`
  - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
    `checkout.session.async_payment_failed`, `checkout.session.expired`
- ☐ Das angezeigte Signing Secret (`whsec_…`) als `STRIPE_WEBHOOK_SECRET` eintragen
- ✅ **Prüfen:** Test-Bestellung mit Stripe-Testkarte `4242 4242 4242 4242` → Bestellung wird „paid"

---

## 4. Awin — echte Möbel (Antrag dauert extern ein paar Tage)
- ☐ Bei Awin (oder CJ) anmelden, passende Händler-Programme beantragen
- ☐ Nach Freigabe: Feed-URL (mit Schlüssel) bei Vercel als Variable setzen,
  z. B. `AWIN_FEED_NORDHEIM_URL`
- ☐ Eine Quelle in `product_sources` anlegen (SQL-Vorlage in `docs/SCHNITTSTELLEN.md` §1)
- ☐ **Immer erst Dry-Run:**
  `curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" ".../api/admin/import?source=…&dryRun=1"`
- ☐ Passt der Bericht → ohne `dryRun` echt importieren. Täglicher Auto-Import läuft dann über Vercel Cron.
- ✅ **Prüfen:** echte, kaufbare Produkte erscheinen im Shop-the-Look

---

## 5. Optional: Upstash Redis (Rate-Limit über mehrere Server)
- ☐ Nur nötig bei viel Traffic. `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` setzen.
  Ohne Werte läuft das Rate-Limit im Arbeitsspeicher — für den Start völlig ok.

---

## 6. Hosten / scharf schalten
- ☐ Nach jedem Schlüssel-Eintrag bei Vercel **neu deployen** (oder Vercel macht es automatisch beim nächsten Push)
- ☐ **Vor dem echten Publikum:** Impressum & Datenschutz ausfüllen
  (`app/impressum/page.tsx`, `app/datenschutz/page.tsx` — die `[[…]]`-Felder) und von jemandem mit DSGVO-Erfahrung prüfen lassen
- ☐ Optional: eigene Domain bei Vercel verbinden, `NEXT_PUBLIC_BASE_URL` darauf setzen
- ☐ Erst mit kleinem Kreis testen (Freunde, Uni), dann breiter

---

## Alle Umgebungsvariablen auf einen Blick

| Variable | Dienst | Pflicht? |
|---|---|---|
| `AI_PROVIDER` = `comfyui` | KI | ja (sonst Mock) |
| `COMFYUI_URL` | RunPod | ja für echten Render |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Datenbank | ja für echte Daten |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Zahlung | ja für Checkout |
| `NEXT_PUBLIC_BASE_URL` | überall | ja |
| `ADMIN_TOKEN` / `CRON_SECRET` | Produkt-Import | ja für Import |
| `AWIN_FEED_…_URL` o. Ä. | Produktquelle | sobald echte Quelle da |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Rate-Limit | optional |
| `LOGISTICS_SHARE`, `DAILY_AI_COST_CAP_EUR`, `AI_COST_PER_RENDER_EUR` | Feintuning | haben Standardwerte |

**Faustregel:** Keine echten Schlüssel ins GitHub. Nur `.env.example` (ohne Werte)
bleibt im Repo; die echten Werte leben ausschließlich bei Vercel.
