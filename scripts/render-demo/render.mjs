// Rendert die Vorher/Nachher-Demobilder für den Hero (public/demo/).
//
//   node scripts/render-demo/render.mjs <ordner-mit-khronos-models>
//
// Der Ordner ist der "Models"-Ordner aus github.com/KhronosGroup/glTF-Sample-Assets
// (es reichen die glTF-Binary-Dateien der Modelle in MODELS unten). Die Modelle
// selbst liegen nicht im Repo, nur die fertigen Bilder. Braucht Playwright mit
// Chromium (WebGL); PW kann auf ein anderes playwright-Paket zeigen.
// `three` kommt als Abhängigkeit von @google/model-viewer mit.
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW ?? "playwright");

const here = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(here, "../..");
const modelsDir = resolve(process.argv[2] ?? "");
const outDir = join(root, "public/demo");
const probe = process.argv.includes("--probe");

const MODELS = [
  "GlamVelvetSofa",
  "SheenChair",
  "SpecularSilkPouf",
  "DiffuseTransmissionPlant",
  "GlassVaseFlowers",
  "AnisotropyBarnLamp",
];

const types = { ".html": "text/html", ".js": "text/javascript", ".glb": "model/gltf-binary" };

function safeJoin(base, rel) {
  const p = normalize(join(base, rel));
  if (!p.startsWith(base)) throw new Error("bad path");
  return p;
}

const server = createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file;
    if (url === "/") file = join(here, "scene.html");
    else if (url.startsWith("/three/")) file = safeJoin(join(root, "node_modules/three"), url.slice(7));
    else if (url.startsWith("/models/")) {
      const name = url.slice(8).replace(/\.glb$/, "");
      if (!MODELS.includes(name)) throw new Error("unknown model");
      file = join(modelsDir, name, "glTF-Binary", `${name}.glb`);
    } else throw new Error("404");
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on("console", (m) => console.log("[scene]", m.text()));
page.on("pageerror", (e) => console.error("[scene error]", e.message));
await page.goto(base + (probe ? "?probe" : ""));
await page.waitForFunction(() => window.__done === true, null, { timeout: 600_000 });

if (!probe) {
  await mkdir(outDir, { recursive: true });
  for (const [name, data] of Object.entries(await page.evaluate(() => window.__images))) {
    const buf = Buffer.from(data.split(",")[1], "base64");
    await writeFile(join(outDir, name), buf);
    console.log(`public/demo/${name}`, Math.round(buf.length / 1024), "KB");
  }
}
await browser.close();
server.close();
