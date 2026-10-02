#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Löscht Raumfotos und Render-Ergebnisse von Interior AI auf dem ComfyUI-Pod.
#
# Warum: Der Provider lädt jedes Kundenfoto nach ComfyUI/input hoch. ComfyUI
# hat keine Lösch-Schnittstelle — ohne dieses Skript sammeln sich die Fotos
# auf dem Pod (DSGVO: Speicherbegrenzung, Art. 5 Abs. 1 lit. e).
# Die Ergebnisbilder liegen dank PreviewImage nur in temp/ (beim Start
# geleert); das Skript räumt temp/ zusätzlich auf, falls der Pod lange läuft.
#
# Einrichten auf dem Pod (einmalig), z. B. alle 10 Minuten:
#   chmod +x /workspace/cleanup.sh
#   (crontab -l 2>/dev/null; echo "*/10 * * * * /workspace/cleanup.sh") | crontab -
# Falls kein cron verfügbar ist, als Schleife im Hintergrund:
#   nohup bash -c 'while true; do /workspace/cleanup.sh; sleep 600; done' >/dev/null 2>&1 &
# ---------------------------------------------------------------------------
set -euo pipefail

COMFY_DIR="${COMFY_DIR:-/workspace/ComfyUI}"
MAX_AGE_MIN="${MAX_AGE_MIN:-15}"   # älter als 15 Minuten -> löschen

find "$COMFY_DIR/input" -maxdepth 1 -type f -name 'interior_ai_room_*' -mmin +"$MAX_AGE_MIN" -delete 2>/dev/null || true
find "$COMFY_DIR/temp"  -type f -mmin +"$MAX_AGE_MIN" -delete 2>/dev/null || true
# Altlasten aus der Zeit vor PreviewImage (SaveImage mit Präfix interior_ai)
find "$COMFY_DIR/output" -maxdepth 1 -type f -name 'interior_ai_*' -mmin +"$MAX_AGE_MIN" -delete 2>/dev/null || true
find "$COMFY_DIR/input" -maxdepth 1 -type f -name 'room_*' -mmin +"$MAX_AGE_MIN" -delete 2>/dev/null || true
