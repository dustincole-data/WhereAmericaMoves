// Every layout the mark can be in, computed ONCE at build against the verified package.
//
// Thirty-one views: the resting country, and one per metro. Each is a dot count and a pole
// for all thirty clusters, plus the relaxed positions for the wide layout. The client
// derives radii, dot positions and thread widths from these with the formulas in
// `clusters.ts` — the same file this module relaxes against, so the two cannot drift.
//
// WHAT IS PUBLISHED, WHAT IS DRAWN, AND WHAT IS NEITHER
//
//   at rest       a cluster is the metro's own `total_in` and `total_out`, drawn as two
//                 bands of one body: the green core is everyone who arrived, the red rim is
//                 everyone who left, and the cut between them sits where the two cells put
//                 it. Both are cells of `metro_totals`, read as published.
//
//                 IT IS NOT COLOURED BY THE METRO'S DIRECTION, and that is a correction to
//                 the ruled plate rather than a preference. 13's plate coloured all thirty
//                 clusters by the sign of `net`. `not_claimable`'s D0019 entry forbids
//                 exactly that — "no list of the twelve, NO MAP THAT COLOURS A METRO BY
//                 DIRECTION as a claimed fact, and no sentence naming one of them as a
//                 gainer or a loser" — because three of the thirty change side across the
//                 three defensible sign rules (Sacramento on dropping the withheld residual,
//                 Riverside and Seattle on returns rather than individuals). The page's own
//                 limits block already prints "no map here colors a metro by direction", so
//                 the ruled colour would have put the drawing in contradiction with the
//                 sentence beneath it. Two bands say MORE than one colour did — how much
//                 arrived and how much left, rather than which way the difference fell —
//                 and they assert nothing the package withheld.
//
//   on selection  a cluster is the PAIRWISE NET with the selected metro:
//                 net(D) = flow(D→S) − flow(S→D). Both operands are published cells of
//                 `top_metro_relations`. `contract.aggregation` licenses this as a mark and
//                 not as a sentence — "a mark may aggregate the cells it is made of; a
//                 spoken aggregate needs a claim or a figure" — so NO FIGURE OF IT IS
//                 PRINTED ANYWHERE, and none is even carried to the client. The package
//                 performs the identical operation itself at metro level (`net` is
//                 `total_in − total_out`), so the operation is the package's own.
//
//                 It is NOT the derivation 09 refused. That one computed an undisclosed
//                 remainder to fill a gap. This subtracts two disclosed cells and refuses
//                 to produce anything at all where either is missing.
//
//   never         no share, no rate, no rank, no sort by size, no top-N. Reading order is
//                 longitude, which is apparatus. The scale is derived and never printed.
//
// THE ABSENCE IS A BRANCH THAT MUST BE DRAWN, NOT MERELY CODED. Four undirected pairs have
// one direction undisclosed, so their net does not exist. It draws as an empty dashed ring
// and NEVER as a zero — a zero asserts a balance nobody measured. The plate rendered zero
// of these for a while because undisclosed pairs were assigned quantity 0 and an earlier
// guard skipped everything at zero before reaching the branch, and the green check missed
// it because it was only ever run against New York, which has none. Baltimore has three.

import { RELATIONS, TOTALS_BY_CBSA } from './package';
import { METROS } from './metros';
import {
  WIDE,
  PHONE,
  dotsFor,
  gridLayout,
  nicePer,
  radiusFor,
  usLayout,
  type Mode,
} from './clusters';

/** 1 the selected metro gained from here · −1 it lost people here · 0 the exchange came out
    even · 2 one direction of the pair is undisclosed, so there is no net to draw · 3 the
    cluster is cut into its own arrived and left cells (the resting view). */
export type PoleCode = 1 | -1 | 0 | 2 | 3;

export interface View {
  n: number[];
  pole: PoleCode[];
  /** How many of the cluster's dots belong to its inner band. Only the resting view cuts,
      so this is zero everywhere else. Phyllotaxis index rises with radius, so the first
      `cut` dots ARE the core — no second pass and no sorting. */
  cut: number[];
}

export interface FieldData {
  codes: string[];
  views: Record<string, View>;
  /** flat [x0,y0,x1,y1,…] in the wide box, one entry per view */
  wpos: Record<string, number[]>;
  /** flat, one grid for every view — the phone's cells never move */
  ppos: number[];
}

const FLOW = new Map<string, number>();
for (const r of RELATIONS) FLOW.set(`${r.origin}>${r.dest}`, r.people);

/** Reading order is LONGITUDE. Apparatus, and deliberately not size: a set sorted by the
    quantity it draws is a ranking whatever the labels say. */
export const ORDER = [...METROS].sort((a, b) => a.lon - b.lon);
const CODES = ORDER.map((m) => m.cbsa);

function sign(v: number): PoleCode {
  return v > 0 ? 1 : v < 0 ? -1 : 0;
}

/** One metro's view: what every other cluster becomes when this one is chosen. */
function selectionQuantities(sel: string): { qty: Map<string, number>; pole: Map<string, PoleCode> } {
  const qty = new Map<string, number>();
  const pole = new Map<string, PoleCode>();
  for (const c of CODES) {
    if (c === sel) {
      qty.set(c, 0);
      pole.set(c, 0);
      continue;
    }
    const out = FLOW.get(`${sel}>${c}`);
    const back = FLOW.get(`${c}>${sel}`);
    if (out === undefined || back === undefined) {
      qty.set(c, 0);
      pole.set(c, 2);
      continue;
    }
    const net = back - out;
    qty.set(c, Math.abs(net));
    pole.set(c, sign(net));
  }
  return { qty, pole };
}

/** The radius the relaxation must respect: what will actually be drawn, floored at the
    fixed glyphs so an absence and a one-dot cluster reserve the same room for their name. */
function reserveRadius(cbsa: string, sel: string | null, n: number, pole: PoleCode, m: Mode): number {
  if (sel === cbsa) return m.sourceR + 8;
  if (pole === 2) return m.absentR + 2;
  if (n <= 0) return m.evenR + 8;
  return Math.max(radiusFor(n, m), m.absentR);
}

function buildView(sel: string | null): { view: View; wide: number[] } {
  let n: number[];
  let poles: PoleCode[];
  let cut: number[];

  if (sel === null) {
    // Two cells per cluster, both at ONE scale, so the cut sits exactly where they put it.
    // Counted separately rather than cut out of a rounded total: rounding the gross first
    // and then apportioning it would move the cut by up to a dot for arithmetic reasons.
    const per = nicePer(Math.max(...CODES.map((c) => {
      const t = TOTALS_BY_CBSA.get(c)!;
      return t.total_in + t.total_out;
    })));
    cut = CODES.map((c) => dotsFor(TOTALS_BY_CBSA.get(c)!.total_in, per));
    n = CODES.map((c, i) => cut[i] + dotsFor(TOTALS_BY_CBSA.get(c)!.total_out, per));
    poles = CODES.map(() => 3 as PoleCode);
  } else {
    const { qty, pole } = selectionQuantities(sel);
    // The scale is the view's own largest quantity, and the source is not on it.
    const scalable = CODES.filter((c) => c !== sel && pole.get(c) !== 2).map((c) => qty.get(c)!);
    const per = nicePer(Math.max(...scalable, 1));
    n = CODES.map((c) => (c === sel || pole.get(c) === 2 ? 0 : dotsFor(qty.get(c)!, per)));
    poles = CODES.map((c) => pole.get(c)!);
    cut = CODES.map(() => 0);
  }

  const radius: Record<string, number> = {};
  CODES.forEach((c, i) => {
    radius[c] = reserveRadius(c, sel, n[i], poles[i], WIDE);
  });
  const pos = usLayout(ORDER, radius, WIDE);

  const wide: number[] = [];
  for (const c of CODES) {
    wide.push(Number(pos[c][0].toFixed(1)), Number(pos[c][1].toFixed(1)));
  }
  return { view: { n, pole: poles, cut }, wide };
}

export function buildField(): FieldData {
  const views: Record<string, View> = {};
  const wpos: Record<string, number[]> = {};

  const rest = buildView(null);
  views.rest = rest.view;
  wpos.rest = rest.wide;

  for (const c of CODES) {
    const v = buildView(c);
    views[c] = v.view;
    wpos[c] = v.wide;
  }

  const grid = gridLayout(CODES, PHONE);
  const ppos: number[] = [];
  for (const c of CODES) ppos.push(Number(grid[c][0].toFixed(1)), Number(grid[c][1].toFixed(1)));

  return { codes: CODES, views, wpos, ppos };
}
