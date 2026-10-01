// CSV-Parser nach RFC 4180: Anführungszeichen, Trennzeichen und
// Zeilenumbrüche innerhalb von Feldern, "" als escaptes Anführungszeichen.
// Händler-Feeds enthalten fast immer Beschreibungen mit ; , und Umbrüchen —
// ein simples split() zerlegt die dann falsch.

export function detectDelimiter(headerLine: string): string {
  const candidates = [";", ",", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const d of candidates) {
    const count = headerLine.split(d).length - 1;
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

export function parseCsv(text: string, delimiter?: string): Record<string, string>[] {
  const src = text.replace(/^﻿/, ""); // BOM entfernen
  const nl = src.search(/\r?\n/);
  const firstLine = nl === -1 ? src : src.slice(0, nl);
  const d = delimiter || detectDelimiter(firstLine);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"' && field === "") {
      inQuotes = true;
    } else if (c === d) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  if (nonEmpty.length < 2) return [];
  const header = nonEmpty[0].map((h) => h.trim());
  return nonEmpty.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => (obj[h] = (cells[i] ?? "").trim()));
    return obj;
  });
}
