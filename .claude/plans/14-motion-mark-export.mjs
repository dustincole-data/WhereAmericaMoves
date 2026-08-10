// Throwaway: export real WAM data + a projected lower-48 outline for the motion prototypes.
// Run with cwd = the WAM repo so bare specifiers resolve. Writes to the scratchpad.
import { readFileSync, writeFileSync } from 'node:fs';
import { geoAlbers, geoPath } from 'd3-geo';
import { feature, merge } from 'topojson-client';
import { parse } from 'csv-parse/sync';

const REPO = 'C:/Users/dusti/Projects/WhereAmericaMoves';
const OUT = 'C:/Users/dusti/AppData/Local/Temp/claude/c--Users-dusti-brain/8c7c8451-ed73-4b62-9dc8-f38a82c8a542/scratchpad/wam-data.json';

const W = 1240, H = 760;

// ── metros (copied from src/lib/metros.ts — apparatus, not measured) ──
const src = readFileSync(`${REPO}/src/lib/metros.ts`, 'utf8');
const METROS = [...src.matchAll(
  /cbsa: '(\d+)'.*?short: '([^']+)'.*?slug: '([^']+)', lat: ([-\d.]+), lon: ([-\d.]+)/g
)].map((m) => ({ cbsa: m[1], short: m[2], slug: m[3], lat: +m[4], lon: +m[5] }));
if (METROS.length !== 30) throw new Error(`expected 30 metros, parsed ${METROS.length}`);

// ── lower-48 land outline ──
const topo = JSON.parse(readFileSync(`${REPO}/public/vendor/us-states-10m.json`, 'utf8'));
const objName = Object.keys(topo.objects)[0];
const states = topo.objects[objName];
const DROP = new Set(['02', '15', '72', '78', '60', '66', '69']); // AK HI PR VI AS GU MP
const keep = states.geometries.filter((g) => !DROP.has(String(g.id).padStart(2, '0')));
const land = merge(topo, keep);

const projection = geoAlbers().rotate([96, 0]).center([-0.6, 38.7]).parallels([29.5, 45.5]);
projection.fitExtent([[18, 14], [W - 18, H - 14]], land);

const round = (v) => Math.round(v * 2) / 2;
const outline = land.coordinates
  .map((poly) => poly[0]) // outer ring only — inner holes are lakes, not needed at this weight
  .map((ring) => {
    const out = [];
    let last = null;
    for (const c of ring) {
      const p = projection(c);
      if (!p) continue;
      const q = [round(p[0]), round(p[1])];
      if (last && Math.abs(q[0] - last[0]) < 0.75 && Math.abs(q[1] - last[1]) < 0.75) continue;
      out.push(q);
      last = q;
    }
    return out;
  })
  .filter((r) => r.length > 40)
  .sort((a, b) => b.length - a.length);

// ── frames ──
const rows = (f) => parse(readFileSync(`${REPO}/rigor/package/frames/${f}`, 'utf8'), {
  columns: true, skip_empty_lines: true, comment: '#',
});

const totalsRaw = rows('metro_totals.csv');
const relRaw = rows('top_metro_relations.csv');

const numOf = (r, ...names) => {
  for (const n of names) if (r[n] !== undefined && r[n] !== '') return Number(r[n]);
  return null;
};
const unitOf = (r, ...names) => {
  for (const n of names) if (r[n] !== undefined && r[n] !== '') return String(r[n]);
  return null;
};

const totals = {};
for (const r of totalsRaw) {
  const u = unitOf(r, 'top_metro', 'unit', 'cbsa', 'metro');
  if (!u) continue;
  totals[u] = {
    in: numOf(r, 'total_in', 'in'),
    out: numOf(r, 'total_out', 'out'),
    net: numOf(r, 'net'),
  };
}

// gross + directional, both ways per pair: origin -> dest -> value
const rel = {};
for (const r of relRaw) {
  const u = unitOf(r, 'unit');
  let o, d;
  if (u && u.includes('|')) [o, d] = u.split('|');
  else { o = unitOf(r, 'origin_top_metro', 'origin'); d = unitOf(r, 'dest_top_metro', 'dest'); }
  const v = numOf(r, 'value', 'people', 'n', 'individuals');
  if (!o || !d || v === null) continue;
  rel[`${o}>${d}`] = v;
}

const metros = METROS.map((m) => {
  const p = projection([m.lon, m.lat]);
  return { ...m, x: Math.round(p[0] * 10) / 10, y: Math.round(p[1] * 10) / 10 };
});

writeFileSync(OUT, JSON.stringify({
  w: W, h: H, metros, totals, rel,
  meta: {
    relCount: Object.keys(rel).length,
    totalsCount: Object.keys(totals).length,
    outlineRings: outline.length,
    outlinePoints: outline.reduce((a, r) => a + r.length, 0),
  },
  outline,
}));

console.log(JSON.stringify({
  metros: metros.length,
  relations: Object.keys(rel).length,
  totals: Object.keys(totals).length,
  outlineRings: outline.length,
  outlinePoints: outline.reduce((a, r) => a + r.length, 0),
  sampleRel: Object.entries(rel).slice(0, 3),
  sampleTotal: Object.entries(totals)[0],
  bbox: [Math.min(...metros.map(m=>m.x)), Math.min(...metros.map(m=>m.y)), Math.max(...metros.map(m=>m.x)), Math.max(...metros.map(m=>m.y))],
}, null, 1));
