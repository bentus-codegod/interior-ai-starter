# Supabase einrichten — Schritt für Schritt

Ziel: die Datenbank anlegen und mit der App verbinden. Dauer ~30 Min, gratis.
Du brauchst nichts zu programmieren — nur kopieren, einfügen, „Run".

---

## Schritt 1 — Projekt anlegen

1. Auf **supabase.com** → **Start your project** → mit GitHub oder E-Mail anmelden.
2. **New project**:
   - Name: `interior-ai`
   - Datenbank-Passwort: eins erzeugen lassen und **sicher speichern** (brauchst du selten, aber aufheben).
   - **Region: Central EU (Frankfurt)** — wichtig für den Datenschutz.
3. **Create new project** → 1–2 Minuten warten, bis es bereit ist.

---

## Schritt 2 — Die drei Migrationen ausführen

Die Migrationen liegen im GitHub-Repo unter **`supabase/migrations/`**.
Du führst sie **in genau dieser Reihenfolge** aus:

1. `20261001000000_init.sql`
2. `20261002000000_product_family.sql`
3. `20261003000000_sources_sourcing_tracking.sql`

**Für jede der drei Dateien:**
1. In Supabase links auf **SQL Editor** → **New query**.
2. Im GitHub-Repo die Datei öffnen, **gesamten Inhalt** kopieren (Knopf „Copy raw file").
3. In das SQL-Editor-Feld einfügen.
4. Unten rechts **Run** drücken.
5. Es sollte **„Success. No rows returned"** erscheinen → nächste Datei.

> ⚠️ Reihenfolge einhalten. Datei 2 und 3 bauen auf Datei 1 auf. Kommt ein
> Fehler wie „relation already exists", hast du sie evtl. doppelt laufen
> lassen — dann einfach mit der nächsten weitermachen.

---

## Schritt 3 — Beispielprodukte laden (optional, zum Testen)

Genauso wie oben, aber mit der Datei **`supabase/seed.sql`**. Danach sind
49 Beispielprodukte drin, damit die Seite nicht leer aussieht. (Kannst du
später löschen, wenn echte Produkte kommen.)

**Prüfen:** links **Table Editor** → Tabelle `products` → du siehst die Zeilen.

---

## Schritt 4 — Die zwei Schlüssel holen

1. Links unten **Project Settings** (Zahnrad) → **API**.
2. Du brauchst genau zwei Werte:
   - **Project URL** (z. B. `https://xxxx.supabase.co`)
   - **service_role** Schlüssel — unter „Project API keys". **Nicht** der
     `anon`-Schlüssel! Der `service_role` hat Vollzugriff.

> 🔒 Der `service_role`-Schlüssel ist ein Generalschlüssel. Nur bei Vercel
> eintragen, **niemals** ins GitHub, in den Code oder an jemanden schicken.

---

## Schritt 5 — Bei Vercel eintragen

1. Vercel → Projekt `interior-ai` → **Settings** → **Environment Variables**.
2. Zwei neue Einträge anlegen:
   - Name: `SUPABASE_URL` → Wert: die Project URL
   - Name: `SUPABASE_SERVICE_ROLE_KEY` → Wert: der service_role-Schlüssel
3. Speichern. Vercel baut automatisch neu (oder oben bei **Deployments** →
   neuestes → **Redeploy**).

---

## Schritt 6 — Hat's geklappt?

- Nach dem Redeploy die Seite öffnen → die Produkte kommen jetzt **aus der
  Datenbank** statt aus der Beispieldatei. (Sichtbar wird das richtig, sobald
  echte Produkte drin sind — mit dem Seed sieht es erstmal gleich aus.)
- Sicher weißt du es über den **Table Editor**: liegen in `products` Zeilen,
  ist die DB verbunden.

---

## Wenn etwas klemmt

- Fehlermeldung beim „Run" → kopier sie mir, ich sage dir, was sie bedeutet.
- Nichts kaputt zu machen: Migrationen legen nur Struktur an. Zur Not kann man
  ein Supabase-Projekt auch einfach löschen und neu anlegen.

Wenn alles grün ist, ist der nächste Schritt **RunPod** (erster echter Render).
