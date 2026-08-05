// The ONLY reader of rigor/. Nothing else in this repo opens that directory.
//
// The package is the site's data layer: there is no fetch, no generation step and no
// src/data/. One copy of every number exists in this repo and it is the hashed one, so
// what the checks below verify is exactly what the pages render.
//
// Checks ⑦⑧⑨ run at MODULE INIT, which puts them on the read path rather than in a
// separate pass: no page can read an unverified byte, and a bad digest throws at build.
// The copy checks (noun, hedge, superlative, scales, apparatus, dist→ledger) are a
// different kind of failure and live in scripts/lint-copy.ts — you iterate through a
// superlative complaint, and there is nothing to iterate through when the bytes are wrong.
//
// All three are BYTE digests, deliberately. `canonical_json` writes 14900349.0 where
// JSON.stringify writes 14900349, so a TypeScript reimplementation of package_hash would
// fail every build — the false-positive regime that gets a check switched off.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { parse as parseCsv } from 'csv-parse/sync';
import { parse as parseYaml } from 'yaml';

const RIGOR = join(process.cwd(), 'rigor');
const PKG = join(RIGOR, 'package');

const sha256 = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');

// ── types ──────────────────────────────────────────────────────────────────────

export type ClaimId = `C${string}`;
export type FrameId = 'top_metro_relations' | 'metro_totals';

export interface Claim {
  id: ClaimId;
  value: number;
  text: string;
  kind: string;
  unit_label: string;
  unit_family: string;
  universe: string | null;
  universe_size: number | null;
  scope: string;
  estimand: string;
  register: { value: string; unlock: string | null };
  limitations: string[];
  uncertainty: { kind: string; basis: string; statement: string };
  disclosure: { statement: string; evidence: unknown[] }[];
  figure: { path: string; sha256: string; rows: number };
  specification: Record<string, unknown>;
}

export interface Frame {
  id: FrameId;
  path: string;
  sha256: string;
  rows: number;
  unit_of_analysis: string;
  universe: string;
  columns: { name: string }[];
  decision: { id: string; decided: string; why: string };
}

export interface Universe {
  name: string;
  size: number;
  directed: boolean;
  prior_absent: number;
  selection: { rule: string; measure: string; source: string; url: string; statement: string };
}

export interface NotClaimable {
  statement: string;
  evidence: { id: string; kind: string; text: string; why?: string; status?: string }[];
}

export interface Manifest {
  package_hash: string;
  engine_version: string;
  config_hash: string;
  project: { slug: string; title: string };
  claims: Claim[];
  frames: Frame[];
  universes: Universe[];
  not_claimable: NotClaimable[];
  contract: Record<string, string>;
  source: {
    publisher: string;
    dataset: string;
    url: string;
    vintage: string;
    retrieved: string;
    universe: string;
    attribution: string;
    licence: string;
    disclosure_floor: { applies: boolean; unit: string; value: number; statement: string };
    files: { name: string; url: string; sha256: string; bytes: number }[];
  };
  funnel: {
    counts: { confirmed: number; rejected: number; frozen: number };
    frozen_total: number;
    confirmed_share: number;
    claims: { id: string; status: string; text: string; reason: string | null }[];
  };
  limiting: { rejected_claims: string[]; vacuous_checks: string[]; accepted_failures: string[] };
  holdout: { axis: string; reason: string };
}

export interface Brief {
  package_hash: string;
  manifest_sha256: string;
  universe_noun: string;
  universe_qualifier: string;
  forbidden_nouns: string[];
  claims: ClaimId[];
  frames: FrameId[];
  promotions: Record<string, 'pending' | 'confirmed' | 'rejected'>;
  declared_parameter_paths: string[];
}

// ── the read, and the three checks that guard it ───────────────────────────────

const manifestBytes = readFileSync(join(PKG, 'manifest.json'));
export const MANIFEST: Manifest = JSON.parse(manifestBytes.toString('utf8'));

const briefRaw = readFileSync(join(RIGOR, 'brief.md'), 'utf8');
const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(briefRaw);
if (!fm) throw new Error('rigor/brief.md has no YAML frontmatter');
export const BRIEF: Brief = parseYaml(fm[1]);

/** ⑦ brief vs manifest — the copy arrived from the package the brief was written against. */
if (BRIEF.package_hash !== MANIFEST.package_hash) {
  throw new Error(
    `⑦ package_hash mismatch\n  brief:    ${BRIEF.package_hash}\n  manifest: ${MANIFEST.package_hash}\n` +
      `  The vendored package and the brief are from different packages. Re-vendor, then re-derive the brief.`
  );
}

/** ⑨ contract integrity — the manifest's own bytes. Strictly subsumes ⑦, and both are kept
    because their failure messages diagnose differently: ⑦ says "you pasted a stale package",
    ⑨ says "someone edited the contract". Without ⑨ the manifest body is unguarded — edit
    source.universe, leave package_hash alone, and ⑦ and ⑧ both pass while the noun check
    goes on validating copy against text that was edited to fit it. */
{
  const got = sha256(manifestBytes);
  if (got !== BRIEF.manifest_sha256) {
    throw new Error(
      `⑨ manifest.json bytes do not match the brief\n  expected: ${BRIEF.manifest_sha256}\n  got:      ${got}\n` +
        `  The vendored package is READ-ONLY. If this fired after a re-vendor, update the brief.`
    );
  }
}

/** ⑧ body integrity — every figure and frame file against the digest the manifest records. */
const fileBytes = new Map<string, Buffer>();
function member(path: string, want: string, what: string): Buffer {
  const bytes = readFileSync(join(PKG, path));
  const got = sha256(bytes);
  if (got !== want) {
    throw new Error(`⑧ ${what} (${path}) digest mismatch\n  manifest: ${want}\n  file:     ${got}`);
  }
  fileBytes.set(path, bytes);
  return bytes;
}
for (const c of MANIFEST.claims) member(c.figure.path, c.figure.sha256, `figure ${c.id}`);
for (const f of MANIFEST.frames) member(f.path, f.sha256, `frame ${f.id}`);

export const PACKAGE_HASH = MANIFEST.package_hash;
/** What the footer prints. 12 hex is enough to resolve in a public repo and short enough
    not to read as machinery on display. */
export const PACKAGE_STAMP = PACKAGE_HASH.replace(/^sha256:/, '').slice(0, 12);

// ── accessors ──────────────────────────────────────────────────────────────────

const CLAIMS = new Map(MANIFEST.claims.map((c) => [c.id, c]));
const FRAMES = new Map(MANIFEST.frames.map((f) => [f.id, f]));

export function claim(id: ClaimId): Claim {
  const c = CLAIMS.get(id);
  if (!c) throw new Error(`no claim ${id} in the package`);
  return c;
}

export function frameMeta(id: FrameId): Frame {
  const f = FRAMES.get(id);
  if (!f) throw new Error(`no frame ${id} in the package`);
  return f;
}

/** Rows of a claim's own figure file. One row for every claim in this package. */
export function figure(id: ClaimId): Record<string, string>[] {
  return rows(claim(id).figure.path);
}

export function frame(id: FrameId): Record<string, string>[] {
  return rows(frameMeta(id).path);
}

const rowCache = new Map<string, Record<string, string>[]>();
function rows(path: string): Record<string, string>[] {
  const hit = rowCache.get(path);
  if (hit) return hit;
  const bytes = fileBytes.get(path);
  if (!bytes) throw new Error(`${path} was not verified by ⑧ — it is not a manifest member`);
  // The header sits under a comment block that carries the frame id, its decision, its
  // specification and the naming and citation clauses. csv-parse drops them; the clauses
  // they restate are read from the manifest, which is the contract.
  const out = parseCsv(bytes, {
    columns: true,
    comment: '#',
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];
  rowCache.set(path, out);
  return out;
}

// ── the two frames, typed ──────────────────────────────────────────────────────

export interface RelationCell {
  unit: string;
  origin: string;
  dest: string;
  people: number;
}

export interface MetroTotals {
  cbsa: string;
  total_in: number;
  total_out: number;
  net: number;
  rest_in_direct: number;
  rest_out_direct: number;
  rest_in_suppressed: number;
  rest_out_suppressed: number;
}

export const RELATIONS: RelationCell[] = frame('top_metro_relations').map((r) => ({
  unit: r.unit,
  origin: r.origin_top_metro,
  dest: r.dest_top_metro,
  people: Number(r.value),
}));

export const TOTALS: MetroTotals[] = frame('metro_totals').map((r) => ({
  cbsa: r.top_metro,
  total_in: Number(r.total_in),
  total_out: Number(r.total_out),
  net: Number(r.net),
  rest_in_direct: Number(r.rest_of_us_in_direct),
  rest_out_direct: Number(r.rest_of_us_out_direct),
  rest_in_suppressed: Number(r.rest_of_us_in_suppressed),
  rest_out_suppressed: Number(r.rest_of_us_out_suppressed),
}));

export const TOTALS_BY_CBSA = new Map(TOTALS.map((t) => [t.cbsa, t]));

/** The claim values the page speaks, read from the package rather than typed in. */
export const C0003 = claim('C0003' as ClaimId); // 14,900,349 people moved between counties
export const C0005 = claim('C0005' as ClaimId); // 1,555,397 exchanged among these 30 metros
export const C0006 = claim('C0006' as ClaimId); // 12 of the 30 are net destinations

/** C0003's own uncertainty field carries the two halves of the claim bar. They are part of
    the claim, which is what licenses printing them beside a C0003 cite — they are not
    derived here, they are extracted from the sentence the package wrote. */
function fromClaimText(c: Claim, re: RegExp, what: string): number {
  const hay = `${c.uncertainty.statement} ${c.limitations.join(' ')} ${c.text}`;
  const m = re.exec(hay);
  if (!m) throw new Error(`${what} is not in ${c.id}'s own text — the package changed shape`);
  return Number(m[1].replace(/,/g, ''));
}
export const WITHHELD = fromClaimText(C0003, /([\d,]{7,}) people of withheld mass/, 'the withheld mass');
export const TOTAL_MOVERS = C0003.value;

// There is deliberately no DISCLOSED here. The disclosed-only sum, 10,813,466, is in the
// package — but in `not_claimable`, under no claim id and no frame id, so the contract's
// citation clause does not reach it and computing it from the two above would be deriving
// a number locally, which this build does not do. The bar DRAWS the split; the piece prints
// the two figures C0003 licenses and no third. See the run log.

/** D0014's obligation, read from C0005's own disclosure block rather than typed in: the
    missing-pair count must be published with any claim on that relation set. */
const D0014 = C0005.disclosure[0].statement;
export const ABSENT_PAIRS = Number(/^(\d+) of the/.exec(D0014)![1]);
export const FRAME_PAIRS = Number(/of the (\d+) directed pairs/.exec(D0014)![1]);

/** Near-miss lookup by the decision or claim id it rests on, so the limits block cites the
    package's own prose instead of paraphrasing it. */
export function notClaimable(evidenceId: string): NotClaimable {
  const n = MANIFEST.not_claimable.find((x) => x.evidence.some((e) => e.id === evidenceId));
  if (!n) throw new Error(`no not_claimable entry resting on ${evidenceId}`);
  return n;
}

export const UNIVERSE = MANIFEST.universes[0];

/** ⑥' — the one drift a hash cannot see: a plate drawn from an older package sitting beside
    a fresh manifest. Every emitted plate carries data-package; the pages assert it here. */
export function assertPlate(svg: string, what: string): string {
  const m = /<svg[^>]*\sdata-package="([^"]+)"/.exec(svg);
  if (!m) throw new Error(`${what} carries no data-package attribute — re-emit it with --geometry`);
  if (m[1] !== PACKAGE_HASH) {
    throw new Error(
      `${what} was drawn from a different package\n  plate:    ${m[1]}\n  vendored: ${PACKAGE_HASH}\n` +
        `  Re-run hero_geo.py --geometry against the vendored package.`
    );
  }
  return svg;
}
