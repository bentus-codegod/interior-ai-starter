# Konzept-Abgleich: Gesamtkonzept ↔ Code

Stand: 02.10.2026 · Branch `claude/bent-interior-ai-invite-me2e5w` (PR #1)
Grundlage: „Interior AI — Gesamtkonzept“ (Stand 29.09.2026)

Dieses Dokument ersetzt **Abschnitt 6 („Ist-Zustand des Codes“)** des
Konzepts und gleicht die übrigen technischen Abschnitte mit dem Code ab.
Geschäftliche Fragen (Modellwahl, Rollen, Kosten in Euro) stehen hier nur,
soweit der Code davon abhängt.

Legende: ✅ umgesetzt · ⚠️ teilweise / Vorstufe · ❌ fehlt

---

## 1. Korrigierter Ist-Zustand (ersetzt Konzept §6)

Tech-Stack: Next.js 16 · React 19 · TypeScript · Tailwind · Stripe ·
Supabase (optional) · `model-viewer` · Vitest

| Bereich | Datei(en) | Zustand |
| --- | --- | --- |
| UI-Ablauf (Upload → Raum & Look → Render → Shop the Look) | `app/page.tsx`, `components/*` | ✅ funktionsfähig mit Beispiel-Daten |
| KI-Render-Endpunkt | `app/api/render/route.ts`, `lib/ai/*` | ⚠️ Mock aktiv. **ComfyUI auf RunPod (SDXL + ControlNet Depth, strukturerhaltend) ist fertig angebunden**, aber noch nie mit echter GPU gelaufen. ModelsLab braucht gehostete Bild-URLs (R2/S3 fehlt), Replicate hat noch `REPLACE_WITH_MODEL_VERSION` |
| Katalog | `lib/productRepo.ts`, `data/catalog.json`, `supabase/` | ✅ Supabase-Tabelle `products`, Fallback JSON. **49 Beispielprodukte** (fiktive Händler und Links) in 4 Raumtypen |
| Checkout | `app/api/checkout`, `app/api/stripe/webhook`, `lib/orders.ts` | ✅ Stripe Checkout für ganzen Look oder Einzelstück, mit Stückzahlen und Lieferadresse (DE/AT/CH). Bestellungen in Supabase, Status per signiertem Webhook. Ungetestet mit echtem Stripe-Key |
| Affiliate | `lib/affiliateFeed.ts`, Shop the Look | ⚠️ Händler-Links mit `?aff=` (Platzhalter), Werbehinweis, CSV-Feed-Import. **Kein Klick-Tracking**, keine Netzwerk-API |
| Rate-Limit / Kosten-Cap | `lib/rateLimit.ts`, `lib/renderLog.ts` | ✅ Rate-Limit über Upstash Redis (optional, sonst RAM). Kosten-Cap über Supabase `render_events` (optional, sonst RAM) |
| Kosten-Protokoll | `lib/renderLog.ts`, View `render_costs_daily` | ✅ jeder Render mit Anbieter, Dauer, Erfolg, Kosten — ohne Fotos/IP |
| Secrets | `lib/env.ts` | ✅ `server-only`, Service-Role-Key und Webhook-Secret nur serverseitig |
| Auth | — | ❌ |
| Raumvermessung | `components/RoomMeasurements.tsx`, `lib/fitCheck.ts` | ⚠️ **manuell**: Breite, Länge, Türbreite, Deckenhöhe + Passform-Check. Automatisch aus Foto/Video: ❌ |
| Swipe & Constraint-Logik | `lib/roomEdit.ts`, `components/ShopTheLook.tsx` | ✅ Swipe pro Stück (Geste oder ✕/♥), Sets (2 Nachttische, 4 Stühle), gekoppelte Kategorien ziehen in dieselbe Material-Familie nach |
| 3D-Produktvisualisierung | `components/Product3DViewer.tsx`, `public/models/` | ⚠️ Viewer inkl. AR fertig; nur **1 Beispielmodell** (CC0), keine echten SKU-Modelle |
| Web-Scraping gegen Supplier | — | ❌ (bewusst: Feeds statt Scraping, siehe AFFILIATE.md) |
| Sourcing-/Lieferketten-Logik (Säule 1) | `supabase/migrations` | ⚠️ nur Datenmodell: `suppliers` (affiliate/private_label/manufacturer), Einkaufspreis, Lager, Lieferant am Produkt. Keine Logik |
| DSGVO-Löschkonzept für Uploads | `comfy/cleanup.sh`, `comfy/README.md` | ⚠️ App speichert keine Fotos; auf RunPod: Ergebnisse nur in `temp/`, Uploads per Skript nach 15 Min. gelöscht. Skript muss noch auf dem Pod eingerichtet werden; AVV mit RunPod fehlt |
| Impressum / Datenschutz | `app/impressum`, `app/datenschutz` | ⚠️ Entwürfe mit `[[…]]`-Platzhaltern |
| Tests | `lib/*.test.ts` | ✅ 17 Unit-Tests (`npm test`) für Design-Hirn, Kopplung, Swipe, Budget, Passform |

**Zu Bents Prozent-Einschätzung** (UI ~75 %, KI-Kern ~5 %, Katalog/Monetarisierung ~5 % …):
nach PR #1 ist das überholt — vor allem KI-Kern (fertiger, ungetesteter
ComfyUI-Anschluss) und Katalog/Monetarisierung (Datenbank, Bestellungen,
Webhook, Feed-Import) sind deutlich weiter. Operations/Legal bleibt niedrig.

---

## 2. Abgleich mit dem Zielbild (Konzept §1 und §2)

### Säule 2 — Self-Service-KI-Interior-Designer

| Ziel | Stand | Was fehlt noch |
| --- | --- | --- |
| Upload Foto | ✅ verkleinert auf 1536 px im Browser | — |
| Upload Roomtour-Video | ⚠️ 5 Standbilder, Nutzer wählt das beste | Auswertung aller Bilder (z. B. für Vermessung, mehrere Blickwinkel) |
| Upload Grundriss | ⚠️ Upload + Anzeige | Grundriss wird nicht ausgewertet |
| Automatische Raumvermessung (Maße, Decke, Fenster) | ❌ (manuelle Eingabe inkl. Deckenhöhe) | Forschungsthema: Tiefenschätzung (z. B. Depth Anything, schon im Workflow) liefert grobe Proportionen, keine zentimetergenauen Maße; genau wird es erst mit LiDAR/AR in einer nativen App |
| Stil als Textbeschreibung | ✅ Freitext → Render-Prompt | Übersetzung ins Englische (SDXL versteht Deutsch schlechter); Text beeinflusst noch nicht die Produktauswahl |
| Swipe pro Möbelstück | ✅ | Lernen aus Swipes über Kategorien hinweg (Stilprofil) |
| Constraint-Logik (gekoppelte Stücke) | ✅ Sets + Familien-Kopplung | Weitere Regeln (Größenverhältnisse, Farbe) |
| Strukturerhaltendes Rendering (ControlNet/Depth) | ⚠️ Workflow fertig, ungetestet | RunPod-Konto, Testlauf, Qualität tunen |
| Neues Render nach Swipe | ❌ | Produktliste ändert sich, das Bild nicht. Variante: Inpainting pro Stück (teuer) |
| Matching gegen Supplier-Pool | ⚠️ Regeln nach Stil, Kategorie, Familie, Budget | Echte Produktdaten; Bild-Ähnlichkeit (Embeddings) |
| Jeder Raum, Garten, ganze Wohnung | ⚠️ 4 Raumtypen | Bad, Küche, Kinderzimmer, Büro; „ganze Wohnung“ = mehrere Räume in einem Projekt (braucht Auth + Speicherung) |
| 3D-Showroom echter SKUs | ⚠️ Viewer fertig | 3D-Modelle pro Produkt (Hersteller-Daten oder Scan) |
| Checkout Einzelkauf / Komplettpaket | ✅ | — |
| Mehrsprachig | ❌ | i18n (z. B. `next-intl`), Preise/Währungen je Region |

### Monetarisierung

| Ziel | Stand | Was fehlt noch |
| --- | --- | --- |
| Einzelstück-Marge | ✅ Checkout pro Stück; Einkaufspreis-Feld in der DB | Margen-Auswertung (Verkauf − Einkauf) |
| Budget-Komplettausstattung | ✅ Budget bis 30.000 €, `LOGISTICS_SHARE` reserviert Logistik (Beispiel: 20.000 € × 0,4 → 8.000 € Logistik, 12.000 € Einrichtung) | Logistik wird nur reserviert, nicht berechnet/abgerechnet — hängt vom Geschäftsmodell ab |

### Säule 1 — Globale Sourcing-Plattform

| Ziel | Stand |
| --- | --- |
| Supplier-Aggregation weltweit | ⚠️ nur Tabelle `suppliers` |
| Großhändler → Direkt-Sourcing (Phasen) | ⚠️ Feld `kind` (affiliate / private_label / manufacturer) |
| Container-Bündelung | ❌ |
| Lager | ⚠️ Feld `stock` |

Säule 1 ist im Code praktisch noch nicht begonnen. Sie hängt an der
Modell-Entscheidung (Konzept §3) und an echten Lieferanten.

---

## 3. Betrieb & Sicherheit (Konzept §4)

| Punkt | Stand |
| --- | --- |
| Secrets nur serverseitig | ✅ |
| Preise nur vom Server | ✅ (auch Stückzahlen begrenzt, unbekannte SKUs verworfen) |
| Webhook-Signaturprüfung | ✅ |
| Datenbank-Zugriff nur serverseitig (RLS ohne Policies) | ✅ |
| Datensparsamkeit (keine Fotos, keine IPs gespeichert) | ✅ in der App; RunPod siehe Löschkonzept |
| Auth / Nutzerkonten | ❌ |
| Content-Security-Policy | ❌ (Basis-Header vorhanden) |
| Pen-Test | ❌ (extern, vor Live-Betrieb) |

---

## 4. Tool-Kandidaten (Konzept §7) — was eingesetzt ist

| Bereich | Eingesetzt | Noch offen |
| --- | --- | --- |
| KI-Rendering | ComfyUI/RunPod (SDXL + ControlNet Depth), ModelsLab, Replicate (Gerüst) | fal.ai, Vertex AI; Flux Kontext |
| Rate-Limit / Cache | Upstash Redis (REST, optional) | — |
| Auth | — | Clerk oder Auth.js (Entscheidung offen) |
| Katalog / Produktdaten | Supabase | Sanity (nicht nötig, solange Supabase reicht) |
| 3D | `model-viewer` | Polycam/RealityScan für Modelle |
| Security | Löschskript für RunPod | Pen-Test |
| Zahlung / Affiliate | Stripe + Webhook, CSV-Feeds | Awin/CJ-API, Klick-Tracking |

---

## 5. Was als Nächstes Code-Arbeit wäre

Ohne fremde Zugänge machbar:
1. Klick-Tracking für Affiliate-Links (Weiterleitung über `/go/[sku]`, Zählung in Supabase)
2. Auswertung der Swipes als Stilprofil (welche Familien/Stile gemocht werden)
3. Weitere Raumtypen (Bad, Küche, Büro) — braucht passende Beispielprodukte
4. i18n-Grundgerüst (Deutsch/Englisch)
5. Content-Security-Policy

Braucht Zugang oder Entscheidung:
- RunPod-Konto → erster echter Render und echte Kosten pro Render (blockiert die Margenrechnung)
- Stripe-Test-Key + Webhook → echter Checkout-Test
- Supabase-Projekt → Migrationen ausführen
- Auth-Anbieter wählen → Nutzerkonten, „ganze Wohnung“ als Projekt speichern
- Geschäftsmodell (Affiliate / Private Label / Eigenentwicklung) → bestimmt, ob Logistik abgerechnet wird und wie Säule 1 aussieht
