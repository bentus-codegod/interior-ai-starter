# Overnight-Protokoll

Laufendes Protokoll der Overnight-Sessions: was geplant war, was gemacht
wurde, was offen bleibt. Neueste Session oben.

---

## Session 2 — 01./02.10.2026 · Abgleich mit dem Gesamtkonzept

**Auftrag (Anton):** Code gegen das Gesamtkonzept (Stand 29.09.) prüfen,
den Ist-Zustand korrigieren (→ `docs/KONZEPT-ABGLEICH.md`) und alle Punkte,
die reine Code-Arbeit sind, umsetzen.

### Plan

| # | Punkt | Konzept-Bezug | Status |
| --- | --- | --- | --- |
| 1 | Mehr Raumtypen (Schlafzimmer, Esszimmer, Balkon/Garten) mit eigenen Looks und Produkten | §1 „jeder Raum, Garten, ganze Wohnung“ | ✅ erledigt |
| 2 | Sets & Kopplung: Stückzahlen (2 Nachttische, 4 Stühle) und gekoppelte Kategorien, die sich gemeinsam ändern | §1 Constraint-Logik | ✅ erledigt |
| 3 | Swipe pro Möbelstück (gefällt mir / nicht), inkl. Kopplung | §1 Swipe-Mechanik | ✅ erledigt |
| 4 | Freitext-Stilbeschreibung → Render-Prompt | §2.3 Textbeschreibung | ✅ erledigt |
| 5 | Budget bis 30.000 € + Logistik-Anteil im Budget | §1 Budget-Komplettausstattung | ✅ erledigt |
| 6 | Mehrere Standbilder aus dem Video zur Auswahl + Deckenhöhe im Passform-Check | §2.1/2.2 Video, Raumanalyse (Vorstufe) | ✅ erledigt |
| 7 | Einzelkauf pro Stück | §2.7 Checkout | ✅ erledigt |
| 8 | Löschkonzept für Fotos auf RunPod/ComfyUI | §4 DSGVO | ✅ erledigt |
| 9 | Rate-Limit optional über Upstash Redis | §7 Tools | ✅ erledigt |
| 10 | Tests für die Kernlogik (Design-Hirn, Kopplung, Passform) | Qualität | ✅ erledigt |
| 11 | Konzept-Abgleich + korrigierter Ist-Zustand (§6) | §6 | ✅ erledigt |

**Bewusst nicht in dieser Session** (braucht Entscheidung, Konto oder Forschung):
Auth (Clerk vs. Auth.js), automatische Raumvermessung aus Foto/Video,
Mehrsprachigkeit, Säule 1 (Sourcing-Plattform, Container-Bündelung),
Web-Scraping, echte Render-Tests auf RunPod.

### Verlauf

1. **Bestandsaufnahme:** PR #1 offen und konfliktfrei → Session baut auf
   demselben Branch auf. Code gegen Konzept §1–§9 geprüft; Ergebnis in
   `docs/KONZEPT-ABGLEICH.md`.
2. **Datenmodell:** Looks bekommen `roomType`, `quantities` (Sets) und
   `couplings`; Produkte bekommen `family` (Material/Serie). 4 Raumtypen,
   8 Looks, 27 neue Beispielprodukte (49 gesamt). Neue Migration
   `20261002000000_product_family.sql`, Seed neu erzeugt.
3. **Design-Hirn:** rechnet mit Stückzahlen gegen das Budget und wählt
   gekoppelte Stücke aus derselben Familie (Bett → Nachttische → Kommode).
4. **Swipe & Kopplung** (`lib/roomEdit.ts`): ✕ = nächster Vorschlag (gleicher
   Stil zuerst, dann ähnlicher Preis; abgelehnte kommen nicht wieder),
   ♥ = Stück behalten (Kopplung ändert es nicht mehr). Wischgeste per
   Touch/Maus und Knöpfe. Hinweis „Passend dazu angepasst: …“.
5. **Checkout:** ganzer Look oder „Einzeln kaufen“, mit Stückzahl; Server
   prüft SKU und begrenzt Stückzahl (max. 20). Bestellungen speichern die
   Menge, Erfolgsseite zählt Stücke.
6. **Freitext-Stil:** Textfeld (max. 300 Zeichen), serverseitig gesäubert,
   hinten an den Look-Prompt gehängt.
7. **Budget:** Regler bis 30.000 €; `LOGISTICS_SHARE` (0–0,6) reserviert
   einen Logistik-Anteil, Anzeige im Shop. Standard 0 (Affiliate).
8. **Video & Maße:** 5 Standbilder über die Videolänge zur Auswahl;
   Deckenhöhe als Feld und im Passform-Check.
9. **RunPod-Löschkonzept:** Workflow nutzt `PreviewImage` (nur `temp/`),
   Uploads heißen `interior_ai_room_*`, `comfy/cleanup.sh` löscht nach
   15 Minuten. Muss auf dem Pod eingerichtet werden.
10. **Upstash:** Rate-Limit über Redis-REST, wenn konfiguriert (IP nur als
    Hash); sonst wie bisher im Arbeitsspeicher.
11. **Tests:** Vitest eingerichtet (`npm test`), 17 Tests grün.

### Geprüft

- `tsc --noEmit`, `npm test` (17/17), `next build` — alles grün
- Browser-Durchlauf (Playwright, Desktop + Handy-Breite):
  Video hochladen → 5 Standbilder → Schlafzimmer → Freitext → Budget
  20.000 € (40 % Logistik → 12.000 € / 8.000 € angezeigt) → Deckenhöhe →
  Render → 2 × Nachttisch → ✕ auf Bett → Nachttische und Kommode ziehen mit →
  Wischgeste ♥ auf Kommode → „Einzeln kaufen“ schickt `{sku, quantity: 2}`
- Migrationen + Seed in Postgres (PGlite): 49 Produkte, Bestellposition mit
  Menge 4

### Nicht geprüft / offen

- Echter Render auf RunPod (inkl. `PreviewImage` und Cleanup-Skript auf dem Pod)
- Echter Stripe-Checkout, Upstash, Supabase — jeweils ohne Zugang
- Bewusst ausgelassen: Auth, automatische Vermessung, Mehrsprachigkeit,
  Säule 1, Scraping (siehe `docs/KONZEPT-ABGLEICH.md` §5)

---

## Session 1 — 01.10.2026 · Code-Teil aus „Marge vs. Arbeitsaufwand“

| # | Punkt | Status |
| --- | --- | --- |
| 1 | Fotos im Browser verkleinern (Vercel-Limit) | ✅ |
| 2 | Produktbilder (`imageUrl`, Kachel als Fallback) | ✅ |
| 3 | Deko & Accessoires | ✅ |
| 4 | 3D-Ansicht mit `model-viewer` (CC0-Beispielmodell) | ✅ |
| 5 | Supabase-Schema, Katalog aus DB mit JSON-Fallback | ✅ |
| 6 | Bestellsystem: Lieferadresse, Webhook, Erfolgsseite | ✅ |
| 7 | Kosten-Protokoll pro Render, Kostenbremse über DB | ✅ |
| 8 | Aufräumen, Doku | ✅ |

Ergebnis: PR #1. Nicht getestet: echter Stripe-Checkout, Supabase-Projekt.
