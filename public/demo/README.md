# Demo-Bilder für den Hero

`vorher.webp` und `nachher.webp` sind Testbilder, gerendert mit
`scripts/render-demo/render.mjs` (three.js im Headless-Chromium). Raum,
Couchtisch, Teppich und Bild sind selbst gebaut; die übrigen Möbel stammen
aus den Khronos glTF Sample Assets (github.com/KhronosGroup/glTF-Sample-Assets),
die Stoffe wurden umgefärbt.

| Modell | Urheber | Lizenz |
| --- | --- | --- |
| GlamVelvetSofa | Eric Chadwick | CC BY 4.0 |
| SheenChair | Eric Chadwick | CC0 1.0 |
| SpecularSilkPouf | Eric Chadwick | CC BY 4.0 |
| DiffuseTransmissionPlant | Eric Chadwick (Materialien), Rico Cilliers (Original) | CC BY 4.0 / CC0 1.0 |
| GlassVaseFlowers | Eric Chadwick, Rico Cilliers | CC0 1.0 |
| AnisotropyBarnLamp | Eric Chadwick | CC BY 4.0 |

CC BY 4.0: https://creativecommons.org/licenses/by/4.0/ · Änderungen:
Farben der Stoffe, Platzierung im Raum, Rendering. Die Quellenzeile steht
auf der Startseite unter dem Bild.

Neu rendern:

```bash
node scripts/render-demo/render.mjs <pfad-zu>/glTF-Sample-Assets/Models
```
