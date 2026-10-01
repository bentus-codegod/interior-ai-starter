import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { parseCsv } from "@/lib/sources/csv";
import type { SourceDefinition } from "@/lib/sources/types";

// Holt die Rohzeilen einer Quelle. Gibt Objekte mit den ORIGINAL-Spalten
// der Quelle zurück; das Mapping passiert danach (lib/sources/mapping.ts).

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB pro Feed
const TIMEOUT_MS = 50_000;

function authHeaders(source: SourceDefinition): Record<string, string> {
  const { authEnv, authHeader = "Authorization", authScheme = "Bearer" } = source.config;
  if (!authEnv) return {};
  const token = process.env[authEnv];
  if (!token) throw new Error(`Umgebungsvariable ${authEnv} fehlt (Token für ${source.id}).`);
  return { [authHeader]: authScheme ? `${authScheme} ${token}` : token };
}

async function download(url: string, headers: Record<string, string>): Promise<Buffer> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Abruf fehlgeschlagen: HTTP ${res.status}`);
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) throw new Error("Feed ist zu groß (> 100 MB).");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error("Feed ist zu groß (> 100 MB).");
  return buf;
}

function decode(buf: Buffer, gzip?: boolean): string {
  // gzip am Magic-Byte erkennen (Feeds kommen oft als .csv.gz)
  const isGzip = buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b;
  return (gzip || isGzip ? gunzipSync(buf) : buf).toString("utf8");
}

function readPath(obj: unknown, p?: string): unknown {
  if (!p) return obj;
  return p.split(".").reduce<unknown>(
    (cur, key) => (cur && typeof cur === "object" ? (cur as Record<string, unknown>)[key] : undefined),
    obj
  );
}

function sourceUrl(source: SourceDefinition): string {
  const { url, urlEnv } = source.config;
  if (urlEnv) {
    const fromEnv = process.env[urlEnv];
    if (!fromEnv) throw new Error(`Umgebungsvariable ${urlEnv} fehlt (URL für ${source.id}).`);
    return fromEnv;
  }
  if (!url) throw new Error("Quelle ohne url.");
  return url;
}

export async function fetchRows(source: SourceDefinition): Promise<Record<string, unknown>[]> {
  const cfg = source.config;
  switch (source.kind) {
    case "csv_file": {
      // Nur Dateien unter data/ — z. B. der Beispiel-Feed.
      const dataDir = path.join(process.cwd(), "data");
      const file = path.resolve(dataDir, path.basename(cfg.path ?? ""));
      return parseCsv(await readFile(file, "utf8"), cfg.delimiter);
    }
    case "csv_url": {
      const buf = await download(sourceUrl(source), authHeaders(source));
      return parseCsv(decode(buf, cfg.gzip), cfg.delimiter);
    }
    case "json_api": {
      const baseUrl = sourceUrl(source);
      const headers = { Accept: "application/json", ...authHeaders(source) };
      const pages = cfg.pagination;
      const out: Record<string, unknown>[] = [];
      const maxPages = pages ? Math.min(pages.maxPages ?? 20, 200) : 1;
      for (let i = 0; i < maxPages; i++) {
        const url = new URL(baseUrl);
        if (pages) url.searchParams.set(pages.param, String((pages.start ?? 1) + i));
        const json = JSON.parse(decode(await download(url.toString(), headers)));
        const items = readPath(json, cfg.itemsPath);
        if (!Array.isArray(items) || items.length === 0) break;
        out.push(...(items as Record<string, unknown>[]));
      }
      return out;
    }
    case "manual":
      // Produkte werden direkt in der Datenbank gepflegt — nichts abzurufen.
      return [];
  }
}
