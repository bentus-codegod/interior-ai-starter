# Status, Security & Launch-Readiness

Stand: 05.10.2026. Beantwortet: Wie steht es um die Sicherheit (nicht nur
Login)? Was fehlt zum Launch? Was fehlt, um auf Investoren zuzugehen? Plus
%-Anzeige für alle Phasen und Bausteine.

> Die Prozente sind **ehrliche Schätzungen** zur Orientierung, keine exakten
> Messwerte. Sie zeigen die Relation, nicht die Nachkommastelle.

---

## 1. Security — ehrliche Bewertung

Die **App-Sicherheit ist für einen MVP überraschend solide** (vieles hat das
Team schon eingebaut). Die Lücken liegen weniger im Code als im **Betrieb und
Rechtlichen**.

### Vorhanden ✅
- Secrets nur serverseitig (technisch erzwungen — kein Schlüssel im Browser)
- Rate-Limit pro Nutzer + harte Tages-Kostenbremse
- Upload-Validierung (Dateityp/Größe des Raumfotos)
- Stripe-Webhook mit Signaturprüfung (keine gefälschten Bestellungen)
- Keine offene Weiterleitung (`/go` nur auf Katalog-Links)
- Admin-Endpunkt mit zeitkonstanter Token-Prüfung
- Datenbank: RLS auf allen Tabellen, Zugriff nur über den Server
- Preise nur serverseitig, Mengen begrenzt (kein Manipulieren im Browser)
- Sicherheits-Header (Clickjacking, MIME-Sniffing, Referrer, HTTPS-Zwang)

### Fehlt noch ⚠️ / ❌
- **Nutzerkonten/Auth** — für gespeicherte Projekte und Missbrauchsschutz (❌)
- **Content-Security-Policy** — volle CSP; bisher nur Basis-Header (⚠️)
- **Fehler- & Angriffs-Monitoring** (z. B. Sentry) + Alerting (❌)
- **Backup-Strategie** — Supabase Free ist begrenzt (⚠️)
- **DSGVO operativ:** Löschskript auf dem RunPod-Pod aktiv schalten;
  **AV-Verträge (DPA)** mit RunPod/Supabase/Stripe; EU-Datenresidenz
  dokumentieren (⚠️)
- **Abhängigkeits-Scans** — 2 moderate npm-Warnungen offen (⚠️)
- **Rechtstexte** gefüllt und geprüft (Impressum, Datenschutz, **AGB**) (❌)
- **Pen-Test** — extern, vor echtem Live-Betrieb (❌)
- **Secret-Rotation / Zugriffsverwaltung** im Team regeln (⚠️)

**Fazit Security:** Für Freunde-/Uni-Tests schon in Ordnung. Für echten
Publikumsbetrieb fehlen vor allem die **operativen und rechtlichen** Punkte
(Monitoring, Backups, DPAs, Rechtstexte) — nicht primär Code.

---

## 2. Was du zum Launch brauchst (öffentlich gehen)

- [ ] **Render-Qualität bewiesen & getunt** (das Kern-Tor)
- [ ] **Echte Produkte importiert** (Affiliate-Programm freigegeben)
- [ ] **Impressum, Datenschutz, AGB** gefüllt und rechtlich geprüft
- [ ] **Cookie-/Einwilligungshinweis**
- [ ] **DSGVO operativ**: Foto-Löschung live, DPAs, EU-Region dokumentiert
- [ ] **Eigene Domain** verbunden
- [ ] **Fehler-Monitoring + Backups**
- [ ] **Doppelte Vercel-Projekte aufgeräumt** (aktuell 4 auf dasselbe Repo)
- [ ] **Ein kompletter End-to-End-Testlauf** (Foto → Render → Kauf)

---

## 3. Was du für Investoren brauchst

Das stärkste Asset hast du bald selbst in der Hand: **ein funktionierendes
Produkt zum Vorführen.** Dazu gehört:

- [ ] **Funktionierende Live-Demo** (das Produkt) — überzeugt mehr als jede Folie
- [ ] **Erste Validierung/Traktion**: Warteliste, Klickzahlen, erste Käufe —
      auch kleine Zahlen zählen (der Code sammelt Klicks & Swipes schon)
- [ ] **Unit Economics** — hast du bereits (`docs/SKALIERUNG-UND-ROADMAP.md`)
- [ ] **Markt & Wettbewerb** (Marktgröße, Abgrenzung zu ModelsLab & Co.)
- [ ] **Pitch Deck** (Problem, Lösung, Demo, Zahlen, Team, Ask)
- [ ] **Klarer Funding-Ask**: wofür genau? (ML-Person, Marketing, ggf. Inventar
      für Private Label)
- [ ] **Team-Story & Roadmap** (die Phasen unten)

**Reihenfolge:** erst Launch-Paket + ein bisschen Traktion, dann Investoren.
Mit einer laufenden Demo + ersten echten Nutzerzahlen ist ein Pre-Seed-Gespräch
realistisch — ohne beides ist es zu früh.

---

## 4. %-Readiness nach Bausteinen

| Baustein | Stand | Was noch fehlt |
|---|---|---|
| Technik-Gerüst (Frontend, API, Deploy) | **90 %** | Aufräumen (doppelte Projekte), Domain |
| KI-Render (Kernprodukt inkl. Qualität) | **40 %** | echter Render, Qualität tunen |
| Katalog & Produktimport | **50 %** | echte Quelle anschließen |
| Monetarisierung (Checkout/Affiliate) | **55 %** | echte Keys testen, echtes Partnerprogramm |
| App-Sicherheit | **75 %** | CSP, Monitoring, Pen-Test |
| Datenschutz & Recht | **25 %** | Texte füllen/prüfen, DPAs, Löschung live |
| Nutzerkonten / Auth | **5 %** | komplett (Supabase kann es, nicht gebaut) |
| Betrieb & Monitoring | **25 %** | Fehler-Tracking, Alerting, Backups |
| Erweiterte Features (Vermessung, behalten, Video) | **15 %** | 3D & Video-Stills da, Rest Phase 5 |
| Go-to-Market & Investor-Material | **15 %** | Deck, Traktion, Markt |

---

## 5. %-Readiness nach Phasen

| Phase | Stand |
|---|---|
| Phase 0 — Setup (Repo, Hosting, Team) | **100 %** |
| Phase 1 — Sicherheit (App) | **80 %** |
| Phase 2 — Rendering | **45 %** |
| Phase 3 — KI-Feinschliff | **10 %** |
| Phase 4 — Katalog & Monetarisierung | **55 %** |
| Phase 5 — Advanced (Vermessung, behalten, Video, Fine-Tuning, Private Label) | **10 %** |

**Gesamt:**
- **Launch-Readiness (öffentlich gehen): ~45 %**
- **Investor-Readiness: ~35 %**

---

## 6. Einordnung

Das Gerüst ist weit (90 %), aber die drei Dinge, die ein Produkt *echt* machen,
stehen noch aus: **bewiesene Render-Qualität, echte Produkte, Recht/Betrieb.**
Das ist normal für diesen Punkt — die „langweiligen" letzten Meter (Legal,
Monitoring, Traktion) sind oft das, was zwischen „funktioniert technisch" und
„launchbar/investierbar" steht.

Nächste Hebel mit der größten Wirkung, in Reihenfolge:
1. Erster echter Render + Qualität → hebt KI-Render von 40 % spürbar an.
2. Eine echte Produktquelle → hebt Katalog & Monetarisierung.
3. Rechtstexte + DSGVO operativ → macht „launchbar" überhaupt möglich.
4. Soft-Launch → liefert die Traktion, die Investoren sehen wollen.
