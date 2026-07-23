// gen-crosswalk.ts — regenerate scripts/crosswalk.json (county FIPS → CBSA),
// restricted to the counties of the curated 31 metros (scripts/metros.ts).
//
// MANUAL, ~every several years — only when OMB re-delineates CBSAs. The output
// (crosswalk.json) is CHECKED IN, so this never runs in CI. It needs one dev
// dependency that the shipped manifest deliberately omits (a known SheetJS
// advisory we don't want in the committed tree):
//
//     npm i -D xlsx@https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz
//     npm run gen:crosswalk
//     npm remove xlsx
//
// Source: Census "List 1" CBSA delineation, July 2023 (OMB Bulletin 23-01).

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
// @ts-ignore — xlsx is an optional, dev-only, manually-installed dependency (see header).
import * as XLSX from 'xlsx';
import { METRO_CBSAS, METROS } from './metros.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIST1_URL =
  'https://www2.census.gov/programs-surveys/metro-micro/geographies/reference-files/2023/delineation-files/list1_2023.xlsx';
const CACHE = join(HERE, '..', 'data', 'raw', 'list1_2023.xlsx');
const OUT = join(HERE, 'crosswalk.json');

async function getWorkbookBuffer(): Promise<Buffer> {
  if (existsSync(CACHE)) {
    console.log(`Using cached ${CACHE}`);
    return readFileSync(CACHE);
  }
  console.log(`Fetching ${LIST1_URL}`);
  const res = await fetch(LIST1_URL);
  if (!res.ok) throw new Error(`list1 download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(CACHE), { recursive: true });
  writeFileSync(CACHE, buf);
  return buf;
}

function norm(s: unknown): string {
  return String(s ?? '').trim();
}

async function main() {
  const buf = await getWorkbookBuffer();
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheet = wb.Sheets['List 1'] ?? wb.Sheets[wb.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

  // Find the header row (the one containing "CBSA Code").
  const headerIdx = rows.findIndex((r) => r.some((c) => norm(c) === 'CBSA Code'));
  if (headerIdx < 0) throw new Error('header row ("CBSA Code") not found');
  const header = rows[headerIdx].map(norm);
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`column not found: ${name}`);
    return i;
  };
  const cCbsa = col('CBSA Code');
  const cType = col('Metropolitan/Micropolitan Statistical Area');
  const cStateFips = col('FIPS State Code');
  const cCountyFips = col('FIPS County Code');

  const crosswalk: Record<string, string> = {};
  const seenCbsas = new Set<string>();
  for (const r of rows.slice(headerIdx + 1)) {
    const cbsa = norm(r[cCbsa]);
    if (!METRO_CBSAS.has(cbsa)) continue;
    if (norm(r[cType]) !== 'Metropolitan Statistical Area') continue;
    const sf = norm(r[cStateFips]).padStart(2, '0');
    const cf = norm(r[cCountyFips]).padStart(3, '0');
    if (sf.length !== 2 || cf.length !== 3) continue;
    crosswalk[sf + cf] = cbsa;
    seenCbsas.add(cbsa);
  }

  // Every curated metro must have resolved to at least one county.
  const missing = METROS.filter((m) => !seenCbsas.has(m.cbsa));
  if (missing.length) {
    throw new Error(`no counties matched for: ${missing.map((m) => `${m.short} (${m.cbsa})`).join(', ')}`);
  }

  const sorted = Object.fromEntries(Object.entries(crosswalk).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(OUT, JSON.stringify(sorted, null, 0) + '\n');
  console.log(
    `Wrote ${OUT}: ${Object.keys(sorted).length} counties across ${seenCbsas.size}/${METROS.length} metros.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
