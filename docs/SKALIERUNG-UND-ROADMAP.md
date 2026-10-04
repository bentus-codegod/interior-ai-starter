# Skalierung, Roadmap & Erweiterungen

Stand: 04.10.2026. Beantwortet fünf Fragen: (1) Was macht die Datenbank-
Migration und was kommt danach, (2) der Video-Plan, (3) Kataloge selbst per
API statt über Affiliate-Netzwerke, (4) Umsätze/Kosten bei Skalierung, (5)
Erweiterung auf Farben und Handwerker.

---

## 1. Die Migration — was sie ist und was danach kommt

Eine „Migration" ist eine SQL-Datei, die die **Tabellenstruktur** in der
Datenbank anlegt (keine Daten, sondern das Gerüst: welche Tabellen, welche
Spalten). Ihr habt drei, die in Reihenfolge laufen:

1. `20261001000000_init.sql` — Grundgerüst: `suppliers` (Lieferanten),
   `products` (Katalog), `orders` + `order_items` (Bestellungen),
   `render_events` + View `render_costs_daily` (Kostenprotokoll pro Render).
2. `20261002000000_product_family.sql` — Feld `family` an Produkten
   (Material/Serie, für die Kopplung Bett→Nachttisch).
3. `20261003000000_sources_sourcing_tracking.sql` — `product_sources`
   (Importquellen), `import_runs` (Import-Protokoll), `affiliate_clicks`
   (Klick-Tracking), `swipe_events` + View `product_feedback`.

**Was du tust:** In Supabase den SQL-Editor öffnen, die drei Dateien **in
dieser Reihenfolge** einfügen und „Run" drücken. Optional `seed.sql` für die
49 Beispielprodukte. Das war's — die Datenbank steht.

**Was danach kommt (die Reihenfolge aus dem Fahrplan):**
1. Supabase-Schlüssel bei Vercel → Katalog/Bestellungen laufen echt.
2. RunPod → erster echter Render.
3. Stripe → Test-Bestellung.
4. Erste echte Produktquelle importieren.
5. Impressum/Datenschutz ausfüllen → Soft-Launch.

---

## 2. Der Video-Plan — wie du das machst

**Der ursprüngliche Gedanke:** Nutzer filmt den Raum (Roomtour), die KI macht
daraus das Redesign.

**Was heute schon im Code ist:** Beim Video-Upload zieht die App **5 Standbilder**
über die Videolänge und der Nutzer wählt das beste als Rendergrundlage. Das ist
der pragmatische MVP — funktioniert sofort, kein Spezialaufwand.

**Die realistischen Ausbaustufen:**
- **Stufe 1 (jetzt):** ein Standbild wählen → rendern. ✅ im Code.
- **Stufe 2:** mehrere Blickwinkel aus dem Video rendern (der Nutzer sieht den
  Raum aus 2–3 Perspektiven neu gestaltet). Mittlerer Aufwand.
- **Stufe 3:** das Video selbst zur **Raumanalyse** nutzen — mehrere Frames
  geben der KI ein vollständigeres Bild des Raums (für Vermessung, verdeckte
  Wände). Forschungsnah, Phase 5.
- **Stufe 4:** echtes Video-zu-Video-Rendering (jeder Frame neu, konsistent).
  Sehr rechenintensiv und technisch schwierig (Konsistenz zwischen Frames).
  Später, mit ML-Person.

**Praktisch für dich:** Bleib bei Stufe 1 für den Prototyp. Video rein →
bestes Standbild → Render. Alles darüber ist eine spätere Produktstufe, kein
Startblocker.

---

## 3. Kataloge selbst per API integrieren (statt Netzwerke)

Kurz: **Technisch ist das schon gebaut — die Frage ist, wie du bezahlt wirst.**

Euer Importer (`lib/sources/`) kann **jede** Quelle einlesen: CSV/gzip-Feeds,
JSON-APIs mit Seitenweise-Abruf, lokale Dateien. Wenn ein Händler dir einen
**direkten Produktfeed oder eine API** gibt, trägst du nur eine Zeile in
`product_sources` ein und es läuft — ganz ohne Awin/Belboon. Das ist die
„selbst per API"-Lösung, und der Code ist dafür fertig.

Der Haken ist **nicht** die Technik, sondern das Geschäftliche:

| Weg | Daten | Provision/Geld | Realistisch für Startup? |
|---|---|---|---|
| **Direkter Händler-Feed/API** | ✅ euer Importer nimmt ihn | nur mit **direktem Provisionsvertrag** je Händler | Händler-für-Händler anfragen; machbar, aber Kleinarbeit |
| **Affiliate-Netzwerk** | ✅ (Feed über Netzwerk) | ✅ Tracking + Auszahlung über **einen** Vertrag | einfachster Einstieg |
| **Eigene Produkte (Private Label)** | ✅ Lieferanten-Feed | du bist Verkäufer, **volle Marge** | Kapital + Logistik nötig (Säule 1) |
| **Scraping** | ⚠️ grau | ❌ kein Tracking = **0 €** | rechtlich heikel, ausgeschlossen |

**Fazit:** „Kataloge selbst per API ziehen" geht für die **Daten** jederzeit —
euer Importer ist genau dafür da. Was das Netzwerk zusätzlich liefert, ist die
**Vergütung** (Tracking + Auszahlung quer über viele Händler in einem Vertrag).
Ohne Netzwerk brauchst du pro Händler einen Direktdeal **oder** du wirst selbst
zum Verkäufer. Nenne mir einen Händler, der einen direkten Feed anbietet, und
ich schreibe dir die `product_sources`-Zeile dafür.

---

## 4. Umsätze & Kosten bei Skalierung

> Alle Zahlen sind **Annahmen zum Rechnen**, keine Messwerte. Die zwei echten
> Hebel sind **Conversion** (wie viele kaufen) und **AOV** (Warenkorbwert).
> Die KI-Render-Kosten sind — das ist die wichtigste Erkenntnis — **winzig**.

### Kosten pro Design-Sitzung (ein Nutzer gestaltet einen Raum)

| Posten | Annahme | Kosten |
|---|---|---|
| Render (≈2 Bilder × 0,03 €) | Replicate/RunPod-Serverless | 0,06 € |
| Hosting, Datenbank, Bandbreite | anteilig | 0,02 € |
| **Summe variabel / Sitzung** | | **≈ 0,08 €** |

### Umsatz pro Sitzung — Affiliate-Modell

Erwarteter Umsatz = Conversion × AOV × Provision
= 2 % × 450 € × 7 % = **0,63 € pro Sitzung**

→ **Deckungsbeitrag ≈ 0,63 − 0,08 = 0,55 € pro Sitzung.**

### Hochgerechnet (Affiliate)

| Design-Sitzungen/Monat | Umsatz | Variable Kosten | Deckungsbeitrag | − Fixkosten* | ≈ Gewinn/Monat |
|---|---|---|---|---|---|
| 1.000 | 630 € | 80 € | 550 € | 50 € | **≈ 500 €** |
| 10.000 | 6.300 € | 800 € | 5.500 € | 200 € | **≈ 5.300 €** |
| 100.000 | 63.000 € | 8.000 € | 55.000 € | 10.000 € | **≈ 45.000 €** |

\* Fixkosten = Tools/Basis-Hosting am Anfang; bei 100k realistisch schon
Gehälter/Server. Marketing (Nutzer gewinnen) ist hier **nicht** enthalten —
das ist meist der größte echte Kostenblock.

### Die wichtigste Zahl: Break-even-Conversion

Damit eine Sitzung die variablen Kosten deckt, brauchst du nur:
0,08 € ÷ (450 € × 7 %) = **0,25 %** Conversion — also **1 Kauf pro 400
Sitzungen**. Alles darüber ist Deckungsbeitrag.

**Das heißt:** Das Modell ist extrem robust, weil die Render-Kosten so niedrig
sind (6 Cent gegen ~31 € Provision pro Kauf). Deine ganze „ist der Render zu
teuer?"-Sorge löst sich hier auf — Compute ist nie das Problem. Entscheidend
sind Conversion und Warenkorbwert.

### Zum Vergleich: Private-Label-Modell (später, Säule 1)

| | Affiliate | Private Label |
|---|---|---|
| Ertrag pro Kauf | ~31 € (7 % von 450 €) | ~250 € (40 % Marge − Logistik/Retouren von ~1.000 € AOV) |
| Risiko | keins (kein Lager) | Kapital, Lager, Logistik, Retouren |
| Start | sofort | braucht Finanzierung |

Private Label bringt pro Verkauf ~8× mehr, kostet aber Kapital und Betrieb.
Logischer Weg: **Affiliate zum Starten und Beweisen, Private Label, wenn
Volumen und Finanzierung da sind.**

---

## 5. Erweiterung auf Farben & Handwerker

Beides passt strategisch gut — es fängt mehr von der „ich will mein Zimmer
wirklich umsetzen"-Reise ein.

**Farben (einfach, naheliegend):**
- Die KI färbt Wände im Render ohnehin schon um. Zusätzlich: die gezeigte
  Wandfarbe auf eine **kaufbare Farbe** matchen (nächster Ton bei einem
  Farbenhändler) und als Produkt in „Shop the Look" aufnehmen.
- Monetarisierung: wie Möbel — Affiliate mit Farben-/Baumarkt-Händlern, oder
  später eigene Farbe. Technisch eine neue Produktkategorie im bestehenden
  Katalog — **kleiner Aufwand**.

**Handwerker (größer, eigenes Modell):**
- Anderer Umsatztyp: **Lead-Vermittlung**. Du verbindest den Nutzer, der sein
  Design umsetzen will, mit lokalen Handwerkern (Maler, Möbelaufbau).
- Einnahme = Vermittlungsgebühr oder Provision pro Auftrag.
- Aufwand: eigenes operatives Geschäft (Handwerker finden, prüfen, regionale
  Abdeckung) — eher über eine Partnerschaft mit einer bestehenden
  Handwerker-Plattform als selbst gebaut.
- Strategisch stark (höherer Auftragswert, mehr Bindung), aber **spätere
  Stufe** — nicht für den ersten Launch.

**Reihenfolge-Empfehlung:** Farben als nächste Kategorie nach dem Launch
(klein, passt ins Modell). Handwerker als eigenes Kapitel, wenn das Kernprodukt
läuft und du weißt, dass Nutzer „umsetzen" wollen.

---

## Einordnung

- **Jetzt:** Migration + RunPod + Stripe (Steckplätze anschließen), erster
  echter Render, Soft-Launch mit Affiliate-Katalog.
- **Danach:** Farben als Kategorie, Video-Stufe 2, erste echte Direktquellen.
- **Phase 5 (Finanzierung + ML-Person):** Video-zu-Video, Auto-Vermessung,
  Objekte-behalten (Inpainting), Private Label, Handwerker-Vermittlung.

Die Zahlen in Teil 4 sind Annahmen — sobald der erste echte Render läuft
(echte Render-Kosten) und die ersten Klicks/Käufe da sind (echte Conversion),
ersetzen wir sie durch Messwerte. Genau dafür protokolliert der Code schon
Render-Kosten (`render_events`) und Klicks (`affiliate_clicks`).
