# ComfyUI / RunPod Setup (eigene KI)

Dieser Ordner enthält den Render-Workflow für die eigene KI. Die App ruft
ihn über den Provider `lib/ai/comfyProvider.ts` auf, sobald
`AI_PROVIDER=comfyui` und `COMFYUI_URL` gesetzt sind.

## 1. Pod starten (RunPod)

1. RunPod → **Deploy** → GPU **RTX 4090** (reicht für SDXL).
2. Template: **ComfyUI** (z. B. "runpod/comfyui" oder ein AI-Dojo-ComfyUI-Template).
3. Pod starten → **Connect** → die HTTP-URL zu Port **3000** bzw. **8188** öffnen.
   Diese URL (ohne `/` am Ende) kommt in `.env.local` als `COMFYUI_URL`.

## 2. Über den ComfyUI-Manager installieren

Im ComfyUI-Fenster: **Manager** öffnen.

**Custom Node (für die Tiefenerkennung):**
- `ComfyUI's ControlNet Auxiliary Preprocessors`
  (liefert den Node `DepthAnythingV2Preprocessor`)

**Modelle** (Manager → *Model Manager* → suchen & installieren):
| Datei im Workflow | Was suchen |
|---|---|
| `sd_xl_base_1.0.safetensors` | SDXL Base 1.0 |
| `controlnet-depth-sdxl-1.0.safetensors` | ControlNet Depth SDXL |
| `depth_anything_v2_vits.pth` | Depth Anything V2 (Small/vits) |

> Wichtig: Die **Dateinamen** müssen exakt so heißen wie in
> `interior_workflow.json`. Heißt eine Datei anders, entweder umbenennen
> oder im JSON (`ckpt_name` / `control_net_name` / `ckpt_name`) anpassen.

Nach der Installation ComfyUI einmal **Restart** + Browser neu laden.

## 3. Workflow testen (im Browser, ohne die App)

1. `interior_workflow.json` im ComfyUI-Fenster per **Load** öffnen.
2. Zeigt ein Node rot → fehlt ein Modell/Custom-Node (siehe Schritt 2).
3. Testfoto in den `input/`-Ordner legen und im `LoadImage`-Node wählen.
4. **Queue Prompt** → Ergebnis erscheint rechts (nur als Vorschau in `temp/`, siehe Löschkonzept).

## 4. Mit der App verbinden

In `.env.local`:

```
AI_PROVIDER=comfyui
COMFYUI_URL=https://DEINE-runpod-url-3000.proxy.runpod.net
```

`npm run dev` → Foto hochladen → Look wählen → Render. Ab jetzt rendert
deine eigene KI statt des Platzhalters.

## Parameter zum Tunen (im JSON, Node `"3"` = KSampler)

| Feld | Wirkung | Startwert |
|---|---|---|
| `denoise` | 0.5 = nah am Original · 0.8 = starkes Redesign | 0.65 |
| `cfg` | wie strikt dem Prompt gefolgt wird | 6.0 |
| `steps` | mehr = feiner, aber langsamer | 30 |
| Node `"16"` `strength` | wie stark die Raum-Geometrie gehalten wird | 0.65 |

## 5. Löschkonzept (DSGVO) — Pflicht vor echten Nutzern

ComfyUI hat keine Lösch-Schnittstelle. Jedes hochgeladene Raumfoto bleibt
sonst in `ComfyUI/input/` liegen.

- Ergebnisbilder: Der Workflow nutzt `PreviewImage` statt `SaveImage` —
  sie landen nur in `temp/`, das ComfyUI bei jedem Start leert.
- Uploads heißen `interior_ai_room_…` und werden von `comfy/cleanup.sh`
  nach 15 Minuten gelöscht. Skript auf den Pod kopieren (`/workspace/`)
  und per cron alle 10 Minuten starten — Anleitung steht im Skript.
- Zusätzlich: Pod ohne dauerhaftes Volume betreiben oder das Volume
  regelmäßig leeren; mit RunPod einen AV-Vertrag (DPA) abschließen und die
  Region (EU) in der Datenschutzerklärung nennen.

## Hinweise

- Der Provider lädt das Foto hoch, startet den Workflow, wartet auf das
  Ergebnis und gibt es als Data-URL zurück — dein Frontend bleibt gleich.
- Node-IDs (`10`, `6`, `7`, `3`, `9`) sind die Kopplung zwischen JSON und
  Provider. Wenn du den Graphen umbaust, halte diese IDs stabil oder passe
  die `NODE`-Konstante in `lib/ai/comfyProvider.ts` an.
- FLUX.1 schnell später: eigenen Workflow bauen (kein ControlNet), als
  `comfy/interior_workflow_flux.json`, und im Provider umschalten.
