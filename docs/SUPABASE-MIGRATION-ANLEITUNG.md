# Supabase einrichten — ausführliche Schritt-für-Schritt-Anleitung

Diese Anleitung ist für den Fall geschrieben, dass du sie **allein** und **ohne
technisches Vorwissen** durcharbeitest. Lies sie einmal ganz durch, dann von
oben nach unten mitmachen. Du kannst nichts kaputt machen — zur Not löscht man
das Projekt und fängt neu an.

**Dauer:** ~30 Minuten · **Kosten:** 0 € (kostenloser Tarif reicht lange)

---

## Was machen wir hier eigentlich? (in einfach)

- **Supabase** ist eure Datenbank in der Cloud — der Ort, an dem die Produkte,
  Bestellungen und Statistiken gespeichert werden. Bisher läuft die App mit
  einer kleinen Beispiel-Datei; jetzt bekommt sie eine echte Datenbank.
- Eine **Migration** ist eine Textdatei voller Datenbank-Befehle, die die
  **Tabellen** anlegt (also das leere Regal-System: „hier kommen Produkte rein,
  dort Bestellungen"). Sie legt nur die Struktur an, noch keine Inhalte.
- Am Ende sagst du der App über zwei **Schlüssel**, wo ihre Datenbank steht —
  die trägst du bei **Vercel** ein (dort läuft eure Website).

Du machst also drei Dinge: Datenbank erstellen → Tabellen anlegen → App
verbinden.

---

## Bevor du loslegst

Du brauchst Zugriff auf zwei Konten (hast du/Anton schon):
- **GitHub** — dort liegt der Code (`github.com/bentus-codegod/interior-ai-starter`).
  Von dort kopierst du die Migrations-Dateien.
- **Vercel** — dort läuft die Website, dort trägst du am Ende die Schlüssel ein.

Und du legst dir gleich ein **Supabase**-Konto an.

---

## Schritt 1 — Supabase-Konto und Projekt anlegen (~5 Min)

1. Gehe auf **supabase.com** und klicke oben rechts auf **Start your project**
   (oder **Sign up**).
2. Melde dich an — am einfachsten **mit GitHub** (dann ist alles verknüpft),
   sonst mit E-Mail und Passwort.
3. Du landest im **Dashboard**. Klicke auf **New project**.
4. Jetzt ein kleines Formular:
   - **Organization**: falls gefragt, eine anlegen (z. B. „Interior AI") —
     einfach Namen eintippen, Rest Standard lassen.
   - **Name**: `interior-ai`
   - **Database Password**: Klicke **Generate a password**, dann **Copy** und
     **speichere es** (z. B. im Passwort-Manager). Du brauchst es selten, aber
     verlieren solltest du es nicht.
   - **Region**: **Central EU (Frankfurt)** auswählen. ⚠️ Wichtig für den
     Datenschutz — die Daten sollen in der EU liegen.
   - **Pricing Plan**: **Free** lassen.
5. **Create new project** klicken. Oben erscheint „Setting up project…" —
   das dauert **1–2 Minuten**. Warte, bis das Dashboard vollständig geladen ist.

---

## Schritt 2 — Die drei Migrationen ausführen (~10 Min)

Jetzt legen wir die Tabellen an. Die Befehle dafür liegen fertig im Code, du
kopierst sie nur rüber. Es sind **drei Dateien**, und die Reihenfolge ist
wichtig, weil die späteren auf den früheren aufbauen:

1. `20261001000000_init.sql`
2. `20261002000000_product_family.sql`
3. `20261003000000_sources_sourcing_tracking.sql`

### 2a — Eine Datei im GitHub öffnen und kopieren

1. Gehe zu **github.com/bentus-codegod/interior-ai-starter**.
2. Klicke dich in den Ordner **`supabase`** → dann **`migrations`**.
3. Du siehst die drei Dateien. Klicke auf die **erste** (`20261001000000_init.sql`).
4. Oben rechts über dem Text gibt es einen Knopf **Copy raw file** (ein Symbol
   mit zwei überlappenden Kästchen). Klick drauf — jetzt ist der **gesamte
   Inhalt** der Datei kopiert.

> „Raw" heißt „roh" — also der reine Text ohne GitHub-Drumherum. Wichtig, dass
> du den kompletten Inhalt hast, nicht nur einen Ausschnitt.

### 2b — In Supabase einfügen und ausführen

1. Wechsle zu Supabase. In der linken Leiste gibt es ein Symbol **SQL Editor**
   (sieht aus wie ein Terminal/`>_`). Klick drauf.
2. Klicke **New query** (oder „+").
3. Klicke in das große leere Textfeld und füge ein (Strg+V bzw. Cmd+V).
4. Unten rechts den grünen Knopf **Run** drücken (oder Strg/Cmd + Enter).
5. Unten erscheint das Ergebnis. Richtig ist: **„Success. No rows returned"**.
   Das heißt: Tabellen wurden angelegt. (Dass „keine Zeilen zurückkommen" ist
   normal — wir legen ja Struktur an, fragen keine Daten ab.)

### 2c — Das Gleiche mit Datei 2 und 3

Wiederhole 2a + 2b mit:
- `20261002000000_product_family.sql`
- `20261003000000_sources_sourcing_tracking.sql`

Jeweils: im GitHub öffnen → **Copy raw file** → in Supabase **New query** →
einfügen → **Run** → „Success".

> ⚠️ **Reihenfolge einhalten.** Erst 1, dann 2, dann 3. Datei 2 und 3 brauchen
> die Tabellen aus Datei 1.
>
> Falls doch mal ein Fehler kommt wie **„relation … already exists"**: Das
> heißt nur, dass diese Tabelle schon da ist (z. B. weil du eine Datei zweimal
> ausgeführt hast). Nicht schlimm — mach mit der nächsten Datei weiter.

---

## Schritt 3 — Beispielprodukte laden (optional, empfohlen zum Testen) (~2 Min)

Damit die Seite nicht leer aussieht, kannst du 49 Beispielprodukte laden —
genau wie oben, aber mit der Datei **`supabase/seed.sql`** (liegt im GitHub
direkt im Ordner `supabase`, nicht in `migrations`).

Öffnen → **Copy raw file** → in Supabase **New query** → einfügen → **Run**.

**Prüfen:** Links in der Leiste **Table Editor** anklicken → links die Tabelle
**`products`** auswählen → rechts solltest du jetzt die Produktzeilen sehen.
Wenn da Produkte stehen, haben die Migrationen funktioniert. 🎉

---

## Schritt 4 — Die zwei Schlüssel holen (~3 Min)

Die App muss wissen, **wo** ihre Datenbank steht und mit welchem Schlüssel sie
rein darf. Beides findest du hier:

1. Links unten das **Zahnrad** → **Project Settings**.
2. Im Menü **API** anklicken.
3. Du brauchst genau **zwei** Werte (jeweils **Copy** daneben):
   - **Project URL** — sieht aus wie `https://abcdefgh.supabase.co`
   - **service_role** — unter „Project API keys", ein sehr langer Zeichensalat.
     ⚠️ Nimm **`service_role`**, **nicht** `anon`! Es werden beide angezeigt.

> **Warum service_role und nicht anon?** Der `anon`-Schlüssel ist für den
> Browser gedacht und darf fast nichts. Der `service_role`-Schlüssel ist der
> **Generalschlüssel** mit Vollzugriff — den braucht der Server, um Produkte zu
> schreiben und Bestellungen zu speichern.
>
> 🔒 **Deshalb extrem wichtig:** Der `service_role`-Schlüssel darf **nur** bei
> Vercel landen. **Niemals** ins GitHub, nicht in den Code, nicht in eine
> Chat-Nachricht, nicht an Dritte. Wer ihn hat, hat vollen Zugriff auf eure
> Datenbank.

---

## Schritt 5 — Die Schlüssel bei Vercel eintragen (~5 Min)

1. Gehe zu **vercel.com** → euer Projekt **interior-ai** anklicken.
2. Oben auf **Settings** → links auf **Environment Variables**.
3. Lege **zwei** Einträge an (jeweils Name + Value eingeben, dann **Save**):

   | Name (Key) | Value (Wert) |
   |---|---|
   | `SUPABASE_URL` | die **Project URL** von vorhin |
   | `SUPABASE_SERVICE_ROLE_KEY` | der **service_role**-Schlüssel |

   Achte darauf, dass die Namen **exakt** so geschrieben sind (Großbuchstaben,
   Unterstriche) — die App sucht genau danach.
4. Wenn Vercel fragt, für welche „Environments" (Production/Preview/Development):
   alle angehakt lassen ist in Ordnung.

---

## Schritt 6 — Neu bauen lassen und prüfen (~3 Min)

Damit die neuen Schlüssel aktiv werden, muss die Seite einmal neu gebaut werden.

1. Bei Vercel oben auf **Deployments**.
2. Beim obersten Eintrag rechts auf die **drei Punkte (…)** → **Redeploy** →
   bestätigen. (Oder du machst später einfach den nächsten Git-Push, dann baut
   es ohnehin neu.)
3. Warten, bis der Status **Ready** (grün) ist.

**Hat's geklappt?**
- Der sichere Test ist der **Table Editor** in Supabase: liegen in `products`
  Zeilen, ist die Datenbank da und verbunden.
- Auf der Website selbst sieht es mit dem Seed erstmal ähnlich aus wie vorher —
  der echte Unterschied wird sichtbar, sobald später **echte** Produkte
  importiert werden. Dass die DB jetzt dranhängt, ist der entscheidende Schritt.

---

## Wenn etwas klemmt

- **Fehlermeldung beim „Run":** Kopier den roten Text und schick ihn mir — ich
  sage dir in einem Satz, was er bedeutet und was zu tun ist.
- **„relation already exists":** harmlos, Tabelle war schon da → nächste Datei.
- **Produkte erscheinen nicht im Table Editor:** Hast du `seed.sql` ausgeführt?
  Steht die Tabelle auf `products`? Sonst Seite in Supabase neu laden.
- **Du bist unsicher, ob etwas kaputt ist:** Ist es fast nie. Migrationen legen
  nur Struktur an. Im äußersten Notfall: Supabase-Projekt löschen
  (Settings → General → Delete project) und mit Schritt 1 neu anfangen.

---

## Und danach?

Wenn der Table Editor Produkte zeigt und die zwei Schlüssel bei Vercel stehen,
ist Supabase fertig. **Nächster Schritt: RunPod** — der erste echte Render.
Dabei lotse ich dich dann wieder durch. Sag einfach „Supabase steht".
