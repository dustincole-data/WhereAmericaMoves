// The caption lint. `npm run lint:copy`, and the build integration runs it after the
// ledger is written.
//
// ALWAYS RUNS, ALWAYS PRINTS, throws only under CI / VERCEL. Vercel fails and nothing
// deploys; local builds stay ungated so the craft loop is a review and not a gate. There
// is no bypass and no --reason: the remedy for a failure here is always available and
// always cheap, because it is *changing the words*. The one honest case where the check is
// wrong about an axis label routes through editing this file, which leaves a commit — a
// better trace than a reason string.
//
// The seam this file sits on, and it is one step past where 07 first drew it: a check is
// mechanical iff its verdict is a comparison between a rendered string and a manifest
// field. "Does this sentence's noun match its cited claim's unit" looked like prose
// reading and is a field comparison, because the manifest inlines unit_label, unit_family
// and source.universe. What stays judgment is stated at the bottom.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { MANIFEST, BRIEF, RELATIONS, TOTALS, WITHHELD, TOTAL_MOVERS } from '../src/lib/package';
import type { CopyRecord } from '../src/copy/record';

const LEDGER_PATH = join(process.cwd(), '.scan', 'copy-ledger.json');
const DIST = join(process.cwd(), 'dist');
const SCAN_OG = join(process.cwd(), '.scan', 'og');

type Fail = { check: string; text: string; cite: string; why: string };
const fails: Fail[] = [];
let sink: Fail[] = fails;
const fail = (check: string, r: { text: string; cite: string }, why: string) =>
  sink.push({ check, text: r.text, cite: r.cite, why });

// ── what counts as a figure ────────────────────────────────────────────────────
// A figure is an assertion of quantity: any numeral, PLUS a closed fraction lexicon —
// which is what makes the ratio rule reachable at all, since the sentence that failed has
// no digits in it. Excluded, because they assert no quantity: a 4-digit year, a package or
// claim identifier, and SVG geometry.

const FRACTIONS: Record<string, number> = {
  'a tenth': 0.1, 'one in ten': 0.1, 'a fifth': 0.2, 'one in five': 0.2,
  'a quarter': 0.25, 'one in four': 0.25, 'a third': 1 / 3, 'one in three': 1 / 3,
  'two fifths': 0.4, 'half': 0.5, 'one in two': 0.5, 'three fifths': 0.6,
  'two thirds': 2 / 3, 'three quarters': 0.75, 'four fifths': 0.8, 'nine tenths': 0.9,
  'one in six': 1 / 6, 'one in seven': 1 / 7, 'one in eight': 0.125, 'one in nine': 1 / 9,
  'one in twenty': 0.05, 'one in a hundred': 0.01,
};
/** hedges, and the direction each one points */
const HEDGES: [RegExp, 1 | -1][] = [
  [/\b(more than|over|better than|above|upwards of|north of)\s*$/i, 1],
  [/\b(fewer than|less than|under|below|almost|nearly|just under|not quite)\s*$/i, -1],
  [/\b(about|around|roughly|approximately|some)\s*$/i, 0 as unknown as 1],
];

// Identifiers, not figures. 04 forced the first of these — the footer stamp is a hash, and
// without the refinement the first stamped page fails its own build — and the plate forced
// the second: a hue is #ec766f, and "766" is not a quantity anyone asserted.
const IDENTIFIER = /#[0-9a-f]{3,8}\b|\b(?:sha256:)?[0-9a-f]{8,}\b|\b[CDL]\d{4}\b/gi;
const YEAR = /\b(?:19|20)\d{2}\b/g;

/** every numeral token in a string, once identifiers and years are removed */
function numerals(text: string): string[] {
  const stripped = text.replace(IDENTIFIER, ' ').replace(YEAR, ' ');
  return (stripped.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((s) => s.trim());
}
function fractionPhrases(text: string): string[] {
  const t = text.toLowerCase();
  return Object.keys(FRACTIONS).filter((p) => t.includes(p));
}

// ── the manifest's declared parameters ─────────────────────────────────────────
// The one narrowing this build made, and the reason is that 07's apparatus rule
// over-reached by exactly two fields. The publisher's disclosure floor and the universe's
// selection rule are DECLARED PARAMETERS: they are in the manifest, nobody measured them,
// and `contract.apparatus` puts non-measured attributes outside the contract. So an
// apparatus string may carry a figure iff that figure appears verbatim in one of them.
// It cannot launder a measurement, because a measurement is not in those fields.

/** `a.b[].c` walks into every element of the array at `b`. Written the obvious way first,
    where `universes[]` returned the array and `.selection` then indexed it by a string —
    silently `undefined`, so DECLARED_TEXT held the literal word "undefined" and every
    figure in the selection rule failed. A resolver that can quietly resolve to nothing is
    the wrong shape for a check; this one throws. */
function atPath(path: string): unknown {
  let node: unknown = MANIFEST;
  for (const key of path.split('.')) {
    if (key.endsWith('[]')) {
      const arr = (node as Record<string, unknown>)[key.slice(0, -2)];
      if (!Array.isArray(arr)) throw new Error(`brief: ${path} — ${key} is not an array`);
      node = arr;
    } else if (Array.isArray(node)) {
      node = node.map((e) => (e as Record<string, unknown>)[key]);
    } else {
      node = (node as Record<string, unknown>)[key];
    }
    if (node === undefined) throw new Error(`brief: declared_parameter_paths has no ${path} in the manifest`);
  }
  return node;
}
const DECLARED_TEXT = BRIEF.declared_parameter_paths.map((p) => JSON.stringify(atPath(p))).join(' \n ');

// ── the lexicons ───────────────────────────────────────────────────────────────

// Pruned against its own first run, which is the argument for building the check before
// writing the copy rather than after. A blanket /\w+est/ called "west" a superlative in the
// legend and "West" one in Miami-Fort Lauderdale-West Palm Beach; "leader" is this piece's
// word for the line carrying a mark back to its origin, not a claim about one; and
// "first|second|third" fires on ordinary prose. What is left is the closed set of words that
// assert a cell's relation to cells not shown.
const SUPERLATIVE =
  /\b(biggest|largest|smallest|most|fewest|highest|lowest|best|worst|greatest|fastest|slowest|leading|foremost|top\s+(?:\d+|three|five|ten)|number one|no\.\s*1|ranked|ranking|outranks?|than any other)\b/gi;
const NEGATION = /\b(no|not|never|cannot|can’t|can't|neither|nor|without|none)\b/i;

const PEOPLE_CITES = new Set<string>([
  ...MANIFEST.claims.filter((c) => c.unit_family === 'people').map((c) => c.id),
  ...MANIFEST.frames.map((f) => f.id),
]);
const FORBIDDEN = BRIEF.forbidden_nouns.map((n) => new RegExp(`\\b${n}\\b`, 'i'));

// ── frame extremes, for the scales clause ──────────────────────────────────────

const EXTREMES = new Set<number>();
{
  const cols: number[][] = [
    RELATIONS.map((r) => r.people),
    TOTALS.map((t) => t.total_in),
    TOTALS.map((t) => t.total_out),
    TOTALS.map((t) => t.net),
    TOTALS.map((t) => t.rest_in_direct),
    TOTALS.map((t) => t.rest_out_direct),
    TOTALS.map((t) => t.rest_in_suppressed),
    TOTALS.map((t) => t.rest_out_suppressed),
  ];
  for (const c of cols) {
    EXTREMES.add(Math.min(...c));
    EXTREMES.add(Math.max(...c));
  }
}

// ── the acceptance examples ────────────────────────────────────────────────────
// They come from our own failure. 06 caught two defects in a headline that had already
// shipped into a built asset, and the argument for this file being mechanical rather than
// careful is that a careful reader had already passed both.
//
// The second example is also where the check's own edge shows: "them" defers its noun to
// the standfirst, so ① passes it BY HAVING NOTHING TO TEST. Recorded, not fixed.

const ACCEPTANCE = {
  reject: { text: 'One in four of these moves cannot be put on a map.', cite: 'C0003' as const },
  accept: { text: 'More than one in four of them cannot be put on a map.', cite: 'C0003' as const },
};

function selftest(): boolean {
  let ok = true;
  const run = (r: CopyRecord) => {
    const got: Fail[] = [];
    const prev = sink;
    sink = got;
    checkRecords([r]);
    sink = prev;
    return got;
  };

  const bad = run(ACCEPTANCE.reject);
  const checks = new Set(bad.map((f) => f.check));
  if (checks.has('① noun') && checks.has('② hedge')) {
    console.log(`  acceptance ✓ rejected on two independent counts: ${[...checks].join(' + ')}`);
  } else {
    ok = false;
    console.error(`  acceptance ✗ "${ACCEPTANCE.reject.text}" should fail ① AND ②; it failed [${[...checks].join(', ')}]`);
  }

  const good = run(ACCEPTANCE.accept);
  if (good.length === 0) {
    console.log('  acceptance ✓ accepted the corrected headline');
  } else {
    ok = false;
    console.error(`  acceptance ✗ the corrected headline failed: ${good.map((f) => f.check + ' ' + f.why).join(' | ')}`);
  }
  return ok;
}

console.log('lint:copy — acceptance examples');
const acceptanceOk = selftest();

// ── the ledger ─────────────────────────────────────────────────────────────────

if (!existsSync(LEDGER_PATH)) {
  console.error(`lint:copy — no ledger at ${LEDGER_PATH}. Run \`npm run build\` first.`);
  process.exit(1);
}
const ledger: CopyRecord[] = JSON.parse(readFileSync(LEDGER_PATH, 'utf8'));
console.log(`lint:copy — ${ledger.length} records, package ${MANIFEST.package_hash.slice(7, 19)}`);


/** ①–⑤ over a set of records. Extracted so the acceptance examples can run the real
    checks rather than a copy of them. */
function checkRecords(ledger: readonly CopyRecord[]): void {
// ── ① the noun check ───────────────────────────────────────────────────────────
// The universe noun list cannot be generic — `residents` is forbidden here and correct on
// a Census set with the same unit_family — so `beauty-brief` derives it from
// source.universe ONCE, by judgment, and code enforces it EVERY build. `taxpayers` is
// forbidden deliberately: dependents are not taxpayers.
//
// It is a negative check by design. Requiring the universe noun in every string would fail
// "Moved out · 424,850", which has no noun at all, and the headline, which defers its noun
// to the standfirst. Antecedent resolution is a theory of the sentence, and that belongs
// to the skill, not here.

for (const r of ledger) {
  if (!PEOPLE_CITES.has(r.cite)) continue;
  for (let i = 0; i < FORBIDDEN.length; i++) {
    if (FORBIDDEN[i].test(r.text)) {
      const c = MANIFEST.claims.find((x) => x.id === r.cite);
      fail(
        '① noun',
        r,
        `"${BRIEF.forbidden_nouns[i]}" is not the universe of ${r.cite}. ` +
          `It counts ${c ? c.unit_label : 'people (tax filers and their dependents)'}.`
      );
    }
  }
}

// ── ② the ratio hedge ──────────────────────────────────────────────────────────
// The only figure the piece states as a fraction is the withheld share, and the truth is
// 27.43%. A bare "one in four" understates it, and understating the absence is the one
// direction this piece cannot afford. No editorial stance is encoded here: the check only
// asks whether the hedge points toward the truth.

const TRUE_SHARE = WITHHELD / TOTAL_MOVERS;
for (const r of ledger) {
  for (const phrase of fractionPhrases(r.text)) {
    const stated = FRACTIONS[phrase];
    const idx = r.text.toLowerCase().indexOf(phrase);
    const before = r.text.slice(0, idx);
    let dir: number | null = null;
    for (const [re, d] of HEDGES) if (re.test(before)) dir = d;
    const pct = (x: number) => `${(x * 100).toFixed(2)}%`;
    if (Math.abs(stated - TRUE_SHARE) < 0.0005) continue; // exact enough, no hedge needed
    if (dir === null) {
      fail('② hedge', r, `"${phrase}" is ${pct(stated)} against ${pct(TRUE_SHARE)} — bare, and it needs a hedge.`);
    } else if (stated < TRUE_SHARE && dir !== 1) {
      fail('② hedge', r, `"${phrase}" is ${pct(stated)} and the truth is ${pct(TRUE_SHARE)} — the hedge points the wrong way.`);
    } else if (stated > TRUE_SHARE && dir !== -1) {
      fail('② hedge', r, `"${phrase}" is ${pct(stated)} and the truth is ${pct(TRUE_SHARE)} — the hedge points the wrong way.`);
    }
  }
}

// ── ③ the superlative lexicon ──────────────────────────────────────────────────
// A cited string may not carry one at all: a superlative over a frame's cells is naming,
// and only a claim id licenses naming — and none of this package's three claims is a
// superlative. An apparatus string may, in exactly two shapes: inside a NEGATION (which is
// what a near-miss is — "no county-level superlative is publishable"), or as a word the
// universe's own cited selection rule uses.
//
// This is the check's soft edge and it is recorded rather than hidden: an apparatus string
// that both names a cell and negates would pass. It would still have to carry the value to
// do any damage, and ⑤ blocks that.

const SELECTION_TEXT = JSON.stringify(MANIFEST.universes).toLowerCase();
for (const r of ledger) {
  const hits = r.text.match(SUPERLATIVE) ?? [];
  if (!hits.length) continue;
  if (r.cite !== 'apparatus') {
    fail('③ superlative', r, `"${hits.join('", "')}" — a superlative over cells is naming, and ${r.cite} does not license it.`);
    continue;
  }
  for (const h of hits) {
    if (NEGATION.test(r.text)) continue;
    if (SELECTION_TEXT.includes(h.toLowerCase())) continue;
    fail('③ superlative', r, `"${h}" in an apparatus string, with no negation and not a word the cited selection rule uses.`);
  }
}

// ── ④ the scales clause ────────────────────────────────────────────────────────
// "Apparatus never names, but no printed figure may equal an observed extreme of its own
// frame." This is the NUMERIC form of a superlative — how "the biggest ribbon is 1.6
// million" leaks in without the adjective — and it binds apparatus, which is where axis
// ticks and domain ends live. A cell readout citing its frame is not touched: 05 kept 19
// of those on purpose, and a readout of a cell's own value names nothing.

// A declared parameter is not on a frame's scale, and the two collide by coincidence: the
// selection-set size is 30, and 30 people is also the smallest disclosed pair in the frame.
// So ④ reads the same figures ⑤ does, and earns its place on its MESSAGE — ⑤ says "cite the
// claim this comes from", ④ says "this number IS the extreme", which is the numeric form of
// a superlative and a different mistake to have made.
for (const r of ledger) {
  if (r.cite !== 'apparatus') continue;
  for (const n of numerals(r.text)) {
    if (DECLARED_TEXT.includes(n)) continue;
    const v = Number(n.replace(/,/g, ''));
    if (EXTREMES.has(v)) fail('④ scales', r, `${n} is an observed extreme of a frame column. nice() the domain.`);
  }
}

// ── ⑤ apparatus carrying a figure ──────────────────────────────────────────────

for (const r of ledger) {
  if (r.cite !== 'apparatus') continue;
  for (const n of numerals(r.text)) {
    if (!DECLARED_TEXT.includes(n)) {
      fail(
        '⑤ apparatus',
        r,
        `${n} is a figure in an apparatus string and is in none of ${BRIEF.declared_parameter_paths.join(', ')}. ` +
          `Cite the claim or frame it comes from.`
      );
    }
  }
  for (const p of fractionPhrases(r.text)) {
    fail('⑤ apparatus', r, `"${p}" is a figure in an apparatus string.`);
  }
}

} // end checkRecords

checkRecords(ledger);

// ── ⑥ dist → ledger ────────────────────────────────────────────────────────────
// The backstop, and the direction that catches what the module cannot: a hand-written
// template, a satori card, a stray <meta>. A figure in dist that is in no ledger entry IS
// the leak.
//
// SVG geometry is excluded because coordinates are apparatus — but only inside the
// attributes that hold geometry, so a <text> node full of digits is still read.

const GEOMETRY_ATTRS =
  /\s(?:d|viewBox|points|transform|gradientTransform|x|y|x1|y1|x2|y2|cx|cy|r|rx|ry|width|height|offset|fill|stroke|stop-color|stop-opacity|fill-opacity|stroke-opacity|opacity|stroke-width|stroke-dasharray|font-size|letter-spacing|gradientUnits|id|class|style|href|src|value|content-type)="[^"]*"/g;
/** data-* carries the plate's ids and the package stamp; none of it is a rendered figure. */
const DATA_ATTRS = /\sdata-[a-z-]+="[^"]*"/g;
/** `content` is scanned everywhere else, because description / og:description / twitter:
    description are copy and are exactly what the backstop exists for. The card's own pixel
    dimensions are not. */
const OG_DIMENSIONS = /<meta[^>]+og:image:(?:width|height)[^>]*>/g;

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (['.html', '.svg'].includes(extname(p))) out.push(p);
  }
  return out;
}

const ledgerNumerals = new Set<string>();
for (const r of ledger) for (const n of numerals(r.text)) ledgerNumerals.add(n);

const scanned = [...walk(DIST), ...walk(SCAN_OG)];
let leaks = 0;
for (const f of scanned) {
  const raw = readFileSync(f, 'utf8');
  const body = raw
    .replace(GEOMETRY_ATTRS, ' ')
    .replace(DATA_ATTRS, ' ')
    .replace(OG_DIMENSIONS, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/&#\d+;/g, ' ');
  for (const n of numerals(body)) {
    if (n.length < 2 && !/,/.test(n)) continue; // a lone digit inside markup is not a claim
    if (ledgerNumerals.has(n)) continue;
    leaks++;
    fails.push({
      check: '⑥ dist→ledger',
      text: n,
      cite: f.replace(process.cwd(), '.'),
      why: 'a figure in the built output that traces to no ledger entry',
    });
    if (leaks > 40) break;
  }
  if (leaks > 40) break;
}
console.log(`lint:copy — scanned ${scanned.length} built files`);

// ── report ─────────────────────────────────────────────────────────────────────

if (fails.length === 0) {
  console.log('lint:copy — clean.');
} else {
  console.error(`\nlint:copy — ${fails.length} failure${fails.length === 1 ? '' : 's'}\n`);
  for (const f of fails) {
    console.error(`  ${f.check}  [${f.cite}]`);
    console.error(`    ${f.text.length > 140 ? f.text.slice(0, 140) + '…' : f.text}`);
    console.error(`    → ${f.why}\n`);
  }
}

// ── what is still judgment, and is not attempted here ──────────────────────────
// A top-N cut is `.sort().slice()` where every label is individually legal and the
// illegality lives in the SET, not in any string. The four rank operations the inventory
// found stay `beauty-copy`'s. A declared per-component selection rule was rejected: new
// authoring burden on every chart, and a declaration can lie.

const enforcing = !!(process.env.CI || process.env.VERCEL);
if (!acceptanceOk) {
  console.error('lint:copy — THE CHECK ITSELF FAILED its acceptance examples. Fix this file first.');
  process.exit(1);
}
if (fails.length && enforcing) {
  console.error('lint:copy — enforcing (CI/VERCEL). Nothing deploys.');
  process.exit(1);
}
if (fails.length) console.error('lint:copy — not enforcing locally. This would fail the deploy.');
