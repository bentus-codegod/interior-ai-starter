# Online stellen & zweigleisig arbeiten

Diese Anleitung bringt den Starter online — für alle erreichbar — und richtet
das **zweigleisige Setup** ein: eine stabile Live-Version, die Nutzer sehen,
und ein zweites Gleis, an dem du gefahrlos weiterbaust. Fällt im zweiten Gleis
ein Bug an, merkt die Live-Version nichts davon.

Alles hier läuft über **GitHub + Vercel** — beides von denselben Leuten wie
Next.js, kostenlos zum Starten, kein Extra-Werkzeug nötig.

## Das Prinzip in einem Bild

- **Branch `main`** → die **Live-Version** (Produktions-URL), die alle sehen.
- **Branch `dev`** (und jeder `feature/…`-Branch) → bekommt von Vercel
  automatisch eine **eigene, isolierte Preview-URL**. Hier baust und testest du.
- Erst wenn `dev` sauber läuft, führst du `dev` → `main` zusammen (Merge) —
  **dann** geht es live. Ein Bug im `dev`-Gleis erreicht die Kunden nie.

## Schritt 1 — Code zu GitHub

- [ ] GitHub-Konto anlegen (mit 2FA), falls noch nicht vorhanden.
- [ ] Neues, **privates** Repository anlegen.
- [ ] Projekt hochladen und zwei Branches anlegen:

```bash
git init
git add .
git commit -m "Interior AI Starter"
git branch -M main
git remote add origin https://github.com/DEIN-NAME/interior-ai.git
git push -u origin main
git checkout -b dev        # das zweite Gleis
git push -u origin dev
```

`.gitignore` sorgt dafür, dass `.env.local` (deine Secrets) **nie** mit
hochgeladen wird.

## Schritt 2 — Mit Vercel verbinden

- [ ] Vercel-Konto anlegen (mit GitHub einloggen).
- [ ] „Add New Project" → dein Repo auswählen. Vercel erkennt Next.js
      automatisch, du musst nichts konfigurieren.
- [ ] Deploy drücken. Vercel gibt dir eine öffentliche `…vercel.app`-URL,
      weltweit erreichbar, mit HTTPS und CDN.

Ab jetzt gilt: **jeder Push auf `main` aktualisiert die Live-Version**, jeder
Push auf `dev` erzeugt/aktualisiert eine **Preview-URL** — automatisch.

## Schritt 3 — Umgebungsvariablen setzen (Secrets)

In Vercel unter **Settings → Environment Variables** eintragen — nie im Code.
Vercel trennt sauber nach Umgebung:

| Variable | Production (`main`) | Preview (`dev`) |
| --- | --- | --- |
| `AI_PROVIDER` | `modelslab` (echt) | `mock` oder `modelslab` |
| `MODELSLAB_API_KEY` | dein Live-Key | ggf. Test-Key |
| `STRIPE_SECRET_KEY` | **Live** `sk_live_…` (erst später) | **Test** `sk_test_…` |
| `NEXT_PUBLIC_BASE_URL` | deine Produktions-URL | die Preview-URL |
| `DAILY_AI_COST_CAP_EUR` | z. B. `20` | z. B. `5` |

So kann Testen im `dev`-Gleis **nie** echte Zahlungen auslösen oder echte
Daten berühren — Preview nutzt Test-Keys, Produktion die echten.

## Schritt 4 — So arbeitest du ab jetzt

1. Neues Feature/Bugfix immer auf `dev` (oder einem `feature/…`-Branch) bauen.
2. Push → Vercel baut automatisch die Preview-URL. Dort testen.
3. Läuft es sauber? `dev` → `main` mergen (per Pull Request auf GitHub).
4. Erst dann geht es live. Nie direkt auf `main` arbeiten.

## Das Sicherheitsnetz — Sofort-Rückfall

Sollte doch mal etwas Kaputtes live gehen: In Vercel unter **Deployments**
das letzte funktionierende Deployment auswählen → **„Promote to Production"**
(Rollback). Die Live-Version ist in Sekunden wieder heil — ohne Code-Änderung.

## Reihenfolge auf einen Blick

1. `npm install`, `npm run dev` — lokal testen (Mock-Modus).
2. Render-API einhängen: `AI_PROVIDER=modelslab` + `MODELSLAB_API_KEY` in
   `.env.local` (siehe README). Hinweis: ModelsLab braucht eine gehostete
   Bild-URL — dazu später R2/S3-Upload ergänzen.
3. Zu GitHub pushen (`main` + `dev`).
4. Mit Vercel verbinden, Env-Variablen setzen.
5. Ab jetzt: auf `dev` bauen → Preview testen → nach `main` mergen.

---

**Was du selbst tun musst** (braucht deine eigenen Logins): GitHub- und
Vercel-Konto anlegen, den ModelsLab-Key besorgen, die Env-Variablen eintragen,
Deploy drücken. Den Code und diese Struktur habe ich vorbereitet.

**Die Phase-E-Linie bleibt:** Bis zum sicheren Prototyp kommst du (mit
KI-Coding-Assistenten) selbst. Sobald echtes Geld (Stripe Live) und viele
Personendaten fließen, gehört der Produktivbetrieb in die Hände eines
technischen Mitgründers — dieses zweigleisige Setup ist genau das, was diese
Person dann sauber betreibt.
