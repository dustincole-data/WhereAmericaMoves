// build-data.ts — `npm run data`. The whole pipeline: fetch the two IRS SOI
// county-to-county CSVs (download-once), roll county flows up to the 30 curated
// metros via crosswalk.json, bucket the rest, and emit the three JSON files the
// app is coded against. Deterministic, idempotent, zero runtime compute.
//
// Contract + algorithm: .claude/plans/06-data-pipeline-build-architecture.md.
//
// Metro-level correctness notes (confirmed against the real 2022-2023 files):
//  • Outflow is authoritative for OUT totals (anchor = origin y1); inflow for IN
//    (anchor = dest y2). Never summed for the same directional total.
//  • Intra-metro moves (both counties in the same CBSA) are NOT metro migration —
//    excluded from a metro's in/out and from the pairs.
//  • This vintage has no explicit "Other flows" residual rows. The suppressed
//    remainder per anchor county = Total Migration-US (dest/origin 97/000) minus
//    the sum of that county's disclosed specific-county rows → rest_us_suppressed
//    (never re-attributed to a partner).
//  • Reserved aggregate rows (96/97/98) and non-domestic ends (state FIPS > 56)
//    are dropped; only 97/000 is read (as Total-US). Non-migrant rows (dest ==
//    origin) are dropped.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'csv-parse/sync';
import { METROS, METRO_BY_CBSA } from './metros.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

// ── Config (bump these two for a newer vintage; see README) ──
const YEAR_PAIR = '2022-2023';
const IRS_LANDING = 'https://www.irs.gov/statistics/soi-tax-stats-migration-data-2022-2023';
const OUTFLOW_URL = 'https://www.irs.gov/pub/irs-soi/countyoutflow2223.csv';
const INFLOW_URL = 'https://www.irs.gov/pub/irs-soi/countyinflow2223.csv';
const CROSSWALK_SOURCE = 'Census List 1, July 2023 (OMB Bulletin 23-01)';

const RAW_DIR = join(ROOT, 'data', 'raw');
const SRC_DATA = join(ROOT, 'src', 'data');
const PUB_DATA = join(ROOT, 'public', 'data');

const crosswalk: Record<string, string> = JSON.parse(readFileSync(join(HERE, 'crosswalk.json'), 'utf8'));

// ── Types ──
interface Agg {
  n1: number;
  n2: number;
  agi: number;
}
const zero = (): Agg => ({ n1: 0, n2: 0, agi: 0 });
function add(a: Agg, n1: number, n2: number, agi: number) {
  a.n1 += n1;
  a.n2 += n2;
  a.agi += agi;
}

interface MetroAcc {
  totalUS: Agg; // Σ over anchor counties of the 97/000 (Total Migration-US) row
  intra: Agg; // disclosed moves where the other end is in the same metro
  pairs: Map<string, Agg>; // other top-30 CBSA -> flow
  restDirect: Agg; // disclosed specific non-top-30 county
}
const newAcc = (): MetroAcc => ({ totalUS: zero(), intra: zero(), pairs: new Map(), restDirect: zero() });

// ── Fetch (download-once cache; CI starts empty → always fresh) ──
async function fetchCsv(url: string, name: string): Promise<string> {
  const dest = join(RAW_DIR, name);
  if (existsSync(dest)) {
    console.log(`  cache  ${name}`);
    return readFileSync(dest, 'utf8');
  }
  console.log(`  fetch  ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const text = await res.text();
  mkdirSync(RAW_DIR, { recursive: true });
  writeFileSync(dest, text);
  return text;
}

function toInt(v: string): number {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Aggregate one direction into per-metro accumulators.
 * anchor = the metro-of-interest county; other = the far end.
 * Outflow: anchor = origin (y1, cols 0/1), other = dest (y2, cols 2/3).
 * Inflow:  anchor = dest (y2, cols 0/1), other = origin (y1, cols 2/3).
 */
function aggregate(csv: string, anchorS: number, anchorC: number, otherS: number, otherC: number): Map<string, MetroAcc> {
  const rows = parse(csv, { from_line: 2, skip_empty_lines: true, relax_column_count: true }) as string[][];
  const acc = new Map<string, MetroAcc>();
  for (const r of rows) {
    const aFips = String(r[anchorS]).padStart(2, '0') + String(r[anchorC]).padStart(3, '0');
    const A = crosswalk[aFips];
    if (!A) continue; // anchor county not in a top-30 metro → irrelevant
    let m = acc.get(A);
    if (!m) acc.set(A, (m = newAcc()));

    const oS = String(r[otherS]).padStart(2, '0');
    const oC = String(r[otherC]).padStart(3, '0');
    const n1 = toInt(r[6]);
    const n2 = toInt(r[7]);
    const agi = toInt(r[8]);
    if (n2 < 0) continue; // suppressed cell (-1) → no data

    if (oS === '97' && oC === '000') {
      add(m.totalUS, n1, n2, agi); // Total Migration-US for this anchor county
      continue;
    }
    if (oS === '96' || oS === '97' || oS === '98') continue; // other aggregate/foreign rows → drop
    if (toInt(oS) < 1 || toInt(oS) > 56) continue; // territories / foreign markers → drop (domestic 50 states + DC)

    const oFips = oS + oC;
    if (oFips === aFips) continue; // non-migrant (same county both years) → drop

    const B = crosswalk[oFips];
    if (B === A) {
      add(m.intra, n1, n2, agi); // intra-metro move → not metro-level migration
    } else if (B) {
      let p = m.pairs.get(B);
      if (!p) m.pairs.set(B, (p = zero()));
      add(p, n1, n2, agi); // top-30 ↔ top-30 directed flow
    } else {
      add(m.restDirect, n1, n2, agi); // specific non-top-30 county → rest of U.S. (direct)
    }
  }
  return acc;
}

function clamp0(n: number): number {
  return n < 0 ? 0 : n;
}

async function main() {
  console.log(`Where America Moves — data pipeline (${YEAR_PAIR})`);
  const [outCsv, inCsv] = await Promise.all([
    fetchCsv(OUTFLOW_URL, 'countyoutflow2223.csv'),
    fetchCsv(INFLOW_URL, 'countyinflow2223.csv'),
  ]);

  const outAcc = aggregate(outCsv, 0, 1, 2, 3); // OUT: anchor=origin, other=dest
  const inAcc = aggregate(inCsv, 0, 1, 2, 3); // IN:  anchor=dest,   other=origin

  const nameOf = (cbsa: string) => METRO_BY_CBSA.get(cbsa)!;

  // ── metro_pairs.json — directed A→B (outflow-sourced), metro↔metro only ──
  const pairRows: any[] = [];
  let interMetroTotal = 0;
  for (const A of METROS) {
    const m = outAcc.get(A.cbsa);
    if (!m) continue;
    for (const [B, p] of [...m.pairs].sort((a, b) => b[1].n2 - a[1].n2)) {
      if (p.n2 <= 0) continue;
      const bm = nameOf(B);
      interMetroTotal += p.n2;
      pairRows.push({
        origin_cbsa: A.cbsa,
        origin_name: A.full,
        dest_cbsa: B,
        dest_name: bm.full,
        bucket: 'metro',
        people: p.n2,
        returns: p.n1,
        agi_total_thousands: p.agi,
        agi_avg_dollars: Math.round((p.agi * 1000) / p.n2),
        year_pair: YEAR_PAIR,
      });
    }
  }

  // ── metro_summary.json ──
  const summary: any[] = [];
  let inflowOutflowDiscrepancies = 0;
  let maxDiscrepancyPct = 0;

  for (const A of METROS) {
    const mo = outAcc.get(A.cbsa) ?? newAcc();
    const mi = inAcc.get(A.cbsa) ?? newAcc();

    // OUT (outflow-authoritative): total excludes intra-metro; suppressed = residual.
    const outPeople = clamp0(mo.totalUS.n2 - mo.intra.n2);
    const outAgi = clamp0(mo.totalUS.agi - mo.intra.agi);
    let pairOutN2 = 0;
    let pairOutAgi = 0;
    for (const p of mo.pairs.values()) {
      pairOutN2 += p.n2;
      pairOutAgi += p.agi;
    }
    const restOutDirect = mo.restDirect.n2;
    const restOutSuppressed = clamp0(outPeople - pairOutN2 - restOutDirect);

    // IN (inflow-authoritative).
    const inPeople = clamp0(mi.totalUS.n2 - mi.intra.n2);
    const inAgi = clamp0(mi.totalUS.agi - mi.intra.agi);
    let pairInN2 = 0;
    for (const p of mi.pairs.values()) pairInN2 += p.n2;
    const restInDirect = mi.restDirect.n2;
    const restInSuppressed = clamp0(inPeople - pairInN2 - restInDirect);

    const total_in = inPeople;
    const total_out = outPeople;
    const net = total_in - total_out;

    // top partners (per direction) + combined (for the focus chord / share page)
    const partnersOut = [...mo.pairs]
      .filter(([, p]) => p.n2 > 0)
      .sort((a, b) => b[1].n2 - a[1].n2)
      .slice(0, 10)
      .map(([B, p]) => ({ cbsa: B, name: nameOf(B).short, slug: nameOf(B).slug, people: p.n2 }));
    const partnersIn = [...mi.pairs]
      .filter(([, p]) => p.n2 > 0)
      .sort((a, b) => b[1].n2 - a[1].n2)
      .slice(0, 10)
      .map(([B, p]) => ({ cbsa: B, name: nameOf(B).short, slug: nameOf(B).slug, people: p.n2 }));

    const partnerCbsas = new Set<string>([...mo.pairs.keys(), ...mi.pairs.keys()]);
    const combined = [...partnerCbsas]
      .map((B) => {
        const out = mo.pairs.get(B)?.n2 ?? 0;
        const inn = mi.pairs.get(B)?.n2 ?? 0;
        return { cbsa: B, name: nameOf(B).short, slug: nameOf(B).slug, in: inn, out, net: inn - out };
      })
      .filter((p) => p.in + p.out > 0)
      .sort((a, b) => b.in + b.out - (a.in + a.out))
      .slice(0, 12);

    // QA: directed-pair inflow vs outflow disagreement (A→B seen in both files)
    for (const [B, po] of mo.pairs) {
      const pi = inAcc.get(B)?.pairs.get(A.cbsa); // inflow measure of A→B (dest B, origin A)
      if (pi && pi.n2 > 0 && po.n2 > 0) {
        const pct = Math.abs(po.n2 - pi.n2) / Math.max(po.n2, pi.n2);
        if (pct > 0.02) inflowOutflowDiscrepancies++;
        if (pct > maxDiscrepancyPct) maxDiscrepancyPct = pct;
      }
    }

    summary.push({
      cbsa: A.cbsa,
      slug: A.slug,
      name: A.short,
      state_abbr: A.state,
      full_name: A.full,
      population: A.population,
      total_in,
      total_out,
      net,
      rest_of_us_in_direct: restInDirect,
      rest_of_us_in_suppressed: restInSuppressed,
      rest_of_us_out_direct: restOutDirect,
      rest_of_us_out_suppressed: restOutSuppressed,
      top_partners_in: partnersIn,
      top_partners_out: partnersOut,
      top_partners: combined,
      agi_avg_in_dollars: total_in > 0 ? Math.round((inAgi * 1000) / total_in) : null,
      agi_avg_out_dollars: total_out > 0 ? Math.round((outAgi * 1000) / total_out) : null,
    });
  }

  // ── QA: how many directed top-30↔top-30 pairs are absent (suppressed) in outflow ──
  let suppressedTopMetroPairs = 0;
  for (const A of METROS) {
    const m = outAcc.get(A.cbsa);
    for (const B of METROS) {
      if (A.cbsa === B.cbsa) continue;
      if (!m || !(m.pairs.get(B.cbsa)?.n2 ?? 0)) suppressedTopMetroPairs++;
    }
  }

  const build_meta = {
    year_pair: YEAR_PAIR,
    generated_utc: new Date().toISOString(),
    irs_source: IRS_LANDING,
    crosswalk_source: CROSSWALK_SOURCE,
    metro_count: METROS.length,
    pair_rows: pairRows.length,
    inter_metro_total: interMetroTotal,
    suppressed_top_metro_pairs: suppressedTopMetroPairs,
    inflow_outflow_discrepancies: inflowOutflowDiscrepancies,
    max_discrepancy_pct: Math.round(maxDiscrepancyPct * 1000) / 10,
  };

  // ── QA asserts (fail loud) ──
  const problems: string[] = [];
  if (summary.length !== 30) problems.push(`metro_count = ${summary.length}, expected 30`);
  for (const s of summary) {
    if (!(s.total_in > 0) || !(s.total_out > 0)) problems.push(`${s.name}: total_in/out not positive`);
    if (s.agi_avg_in_dollars == null || s.agi_avg_out_dollars == null) problems.push(`${s.name}: null AGI avg`);
  }
  for (const p of pairRows) {
    if (p.agi_total_thousands == null) problems.push(`pair ${p.origin_cbsa}->${p.dest_cbsa}: null AGI`);
  }
  if (problems.length) {
    console.error('QA FAILED:\n  ' + problems.join('\n  '));
    process.exit(1);
  }

  // ── Write (stable sorted for clean diffs) ──
  mkdirSync(SRC_DATA, { recursive: true });
  mkdirSync(PUB_DATA, { recursive: true });
  pairRows.sort((a, b) =>
    a.origin_cbsa === b.origin_cbsa ? b.people - a.people : a.origin_cbsa.localeCompare(b.origin_cbsa)
  );
  writeFileSync(join(PUB_DATA, 'metro_pairs.json'), JSON.stringify(pairRows));
  writeFileSync(join(SRC_DATA, 'metro_summary.json'), JSON.stringify(summary, null, 0));
  writeFileSync(join(SRC_DATA, 'build_meta.json'), JSON.stringify(build_meta, null, 2));

  // ── Report ──
  console.log('\nQA summary:');
  console.table({
    metro_count: build_meta.metro_count,
    pair_rows: build_meta.pair_rows,
    inter_metro_total: build_meta.inter_metro_total,
    suppressed_top_metro_pairs: `${build_meta.suppressed_top_metro_pairs} / ${30 * 29}`,
    inflow_outflow_discrepancies: build_meta.inflow_outflow_discrepancies,
    max_discrepancy_pct: build_meta.max_discrepancy_pct + '%',
  });
  const spot = summary.filter((s) => s.cbsa === '35620' || s.cbsa === '38060');
  for (const s of spot) {
    console.log(
      `\n${s.name} (${s.cbsa}): in ${s.total_in.toLocaleString()} · out ${s.total_out.toLocaleString()} · net ${s.net >= 0 ? '+' : '−'}${Math.abs(s.net).toLocaleString()}` +
        ` · AGI in $${s.agi_avg_in_dollars.toLocaleString()} / out $${s.agi_avg_out_dollars.toLocaleString()}`
    );
    console.log(`   net = in − out check: ${s.total_in - s.total_out === s.net ? 'ok' : 'MISMATCH'}`);
    console.log(`   top out: ${s.top_partners_out.slice(0, 5).map((p: any) => `${p.name} ${p.people.toLocaleString()}`).join(' · ')}`);
    console.log(`   top in:  ${s.top_partners_in.slice(0, 5).map((p: any) => `${p.name} ${p.people.toLocaleString()}`).join(' · ')}`);
    console.log(`   rest-of-US out: ${s.rest_of_us_out_direct.toLocaleString()} direct + ${s.rest_of_us_out_suppressed.toLocaleString()} suppressed`);
  }
  console.log('\nWrote metro_pairs.json · metro_summary.json · build_meta.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
