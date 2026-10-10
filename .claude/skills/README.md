# Design-Skills in diesem Repo

Claude Code lädt die Skills in diesem Ordner automatisch, wenn im Projekt
gearbeitet wird. Alle wurden vor der Aufnahme mit NVIDIAs Scanner
**SkillSpector** geprüft. Bericht: `docs/DESIGN-SKILLS-PRUEFUNG.md`.

| Ordner | Quelle (Stand) | Lizenz | Prüfergebnis |
| --- | --- | --- | --- |
| `emil-design-eng/` | github.com/emilkowalski/skill, Commit `e8a175d` | MIT | Risiko 0, keine Befunde |
| `design-taste-frontend/` | github.com/Leonxlnx/taste-skill (`skills/taste-skill`), Commit `717446e` | MIT | Risiko 46 (MITTEL), alle Befunde von Hand geprüft: Fehlalarme |
| `threejs-fundamentals/`, `threejs-lighting/`, `threejs-materials/`, `threejs-loaders/`, `threejs-textures/` | github.com/CloudAI-X/threejs-skills (`skills/`), Commit `b1c6230` | MIT (laut README) | je Risiko 0, keine Befunde |

**Nicht installiert:** Impeccable (github.com/pbakaus/impeccable, Commit
`d631a88`). SkillSpector: Risiko 100, Empfehlung „nicht installieren“. Der
Skill bringt ausführbaren Code mit, lädt bei Bedarf eine Programmdatei nach
und weist den Agenten an, Hooks in `.claude/settings.local.json` einzutragen
und `npx impeccable` ohne feste Version auszuführen. Seine Design-Grundsätze
wurden für das Frontend nur gelesen (siehe Prüfbericht).

Nur reine Textdateien, keine Skripte. Vor einem Update: neue Version erneut
scannen, dann den Ordner ersetzen und den Commit hier eintragen.
