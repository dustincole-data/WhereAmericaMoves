// Every layout the mark can be in, computed ONCE at build against the verified package.
//
// Sixty-one views: the resting country, one per metro in people, and one per metro in the
// per-1,000 rate. Each is a dot count and a pole for all thirty clusters. Positions are NOT
// per view any more — the thirty metros sit at their true projected points and stay there —
// so this module also produces the one position array and the coastline they sit on. The
// client derives radii, dot positions and ribbon widths from these with the formulas in
// `clusters.ts`, so there is no second implementation of a radius to drift.
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
//                 IT ALSO CARRIES ITS OWN ABSENCE, as of 2026-08-10. A dashed outer ring
//                 encloses the metro's `rest_in_suppressed + rest_out_suppressed` at the same
//                 `per` as the body — the mass the publisher counted in this metro's totals
//                 and attached to no county pair. That sum is a SPOKEN aggregate the contract
//                 refuses as a figure and licenses as a mark: `contract.aggregation` —
//                 "a mark may aggregate the cells it is made of" — which is the same licence
//                 `MetroCopy.supExtent` and the per-thousand scale already run on. It replaces
//                 the claim register bar, which said one national proportion once, in a
//                 section of its own, below the mark. This says the metro's own, thirty times,
//                 inside it. The two are DIFFERENT QUANTITIES and the page does not conflate
//                 them: the national figure is printed in type beside the headline and cited
//                 to C0003, and the ring is never printed at all.
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

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { geoAlbers } from 'd3-geo';
import { merge } from 'topojson-client';
import { RELATIONS, TOTALS_BY_CBSA } from './package';
import { METROS, POPULATION } from './metros';
import {
  WIDE,
  PHONE,
  coarser,
  dotsFor,
  gridLayout,
  niceStep,
  nicePer,
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
  /** THE WITHHELD MASS, IN THE SAME UNIT AS THE BODY. Dots the cluster's dashed outer ring
      encloses beyond its own body: the metro's unattributable columns, counted at the resting
      view's own `per`, so the annulus is the same people-per-unit-area as the dots inside it.
      A reader compares the ring to the body without being told a scale, because there is only
      one scale.

      RESTING VIEW ONLY, and that is a contract line rather than a shortcut. A selection view's
      clusters are pairwise nets on a per-view scale that has nothing to do with a metro's own
      residual, so a ring drawn there would put two unrelated quantities in one picture at two
      unrelated scales. Undefined on every other view. */
  ring?: number[];
}

export interface FieldData {
  codes: string[];
  /** counts in people — the Total view */
  views: Record<string, View>;
  /** the same thirty selections drawn on the per-1,000 rate. Absent for `rest`, which has no
      pair and therefore no rate: the resting cluster is two published cells and the toggle
      does not reach it. */
  rates: Record<string, View>;
  /** flat [x0,y0,x1,y1,…] in the wide box. ONE array, not one per view — the clusters sit at
      their true projected points and stay there through every selection. */
  wpos: number[];
  /** flat, one grid for every view — the phone's cells never move */
  ppos: number[];
  /** the lower-48 coastline, projected into the same box: [ring][point][x,y] */
  outline: number[][][];
}

const FLOW = new Map<string, number>();
for (const r of RELATIONS) FLOW.set(`${r.origin}>${r.dest}`, r.people);

/** Reading order is LONGITUDE. Apparatus, and deliberately not size: a set sorted by the
    quantity it draws is a ranking whatever the labels say. */
export const ORDER = [...METROS].sort((a, b) => a.lon - b.lon);
const CODES = ORDER.map((m) => m.cbsa);

// ── the ground ─────────────────────────────────────────────────────────────────
//
// A real Albers of the lower 48, fitted to the wide box, and the thirty metros at their own
// projected points on it. Alaska, Hawaii and the territories are dropped because no metro in
// the set is in one and an inset would be furniture with nothing in it.
//
// PROJECTION IS APPARATUS. Nothing here is measured, nothing is printed, and the coastline
// carries no quantity — it is there so a cluster's position reads as a place instead of as a
// diagram of one. The outline is thinned to half-pixel steps: at this weight the difference
// is invisible and the payload is a third of the size.

/** The coastline is fitted SHORT of the box at the bottom, by a cluster's radius plus a line
    of type: Miami is the southern-most point in the set and its cluster and its name both
    have to land inside the drawing box, or the slot search has nowhere legal to put the
    word and the mark itself clips. */
const LOWER48 = { w: WIDE.w, h: WIDE.h, top: 14, side: 18, bottom: 60 };
const DROP = new Set(['02', '15', '72', '78', '60', '66', '69']); // AK HI PR VI AS GU MP

function ground(): { pos: Record<string, [number, number]>; outline: number[][][] } {
  // Read from the repo root, not from this module's own URL: the SSR bundle relocates the
  // module and `import.meta.url` follows it into `dist/.prerender/chunks`. `package.ts`
  // resolves the verified package the same way and for the same reason.
  const topo = JSON.parse(readFileSync(join(process.cwd(), 'public', 'vendor', 'us-states-10m.json'), 'utf8'));
  const states = topo.objects[Object.keys(topo.objects)[0]];
  const keep = states.geometries.filter((g: { id: string | number }) => !DROP.has(String(g.id).padStart(2, '0')));
  const land = merge(topo, keep) as { coordinates: number[][][][] };

  const projection = geoAlbers().rotate([96, 0]).center([-0.6, 38.7]).parallels([29.5, 45.5]);
  projection.fitExtent(
    [
      [LOWER48.side, LOWER48.top],
      [LOWER48.w - LOWER48.side, LOWER48.h - LOWER48.bottom],
    ],
    land as never
  );

  const half = (v: number) => Math.round(v * 2) / 2;
  const outline = land.coordinates
    .map((poly) => poly[0]) // outer ring only — the inner holes are lakes
    .map((ring) => {
      const out: number[][] = [];
      let last: number[] | null = null;
      for (const c of ring) {
        const p = projection(c as [number, number]);
        if (!p) continue;
        const q = [half(p[0]), half(p[1])];
        if (last && Math.abs(q[0] - last[0]) < 0.75 && Math.abs(q[1] - last[1]) < 0.75) continue;
        out.push(q);
        last = q;
      }
      return out;
    })
    .filter((r) => r.length > 40);

  const pos: Record<string, [number, number]> = {};
  for (const m of ORDER) {
    const p = projection([m.lon, m.lat])!;
    pos[m.cbsa] = [Number(p[0].toFixed(1)), Number(p[1].toFixed(1))];
  }
  return { pos, outline };
}

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

/** A whole selection's dots have to fit the stream's own budget, and the way to make them
    fit is to COARSEN THE SCALE, never to clip at draw time. A cap applied while drawing
    starves whichever routes ask last, which bends the encoding without saying so; a coarser
    rung costs every cluster the same proportion and leaves the comparison intact. The rate
    view needs the coarser rung far more often than counts do, because small metros post
    large rates and the values spread much flatter. */
const DOT_BUDGET = 4600;

function scaledCounts(
  qty: Map<string, number>,
  pole: Map<string, PoleCode>,
  sel: string,
  rate: boolean
): number[] {
  const scalable = CODES.filter((c) => c !== sel && pole.get(c) !== 2).map((c) => qty.get(c)!);
  const qmax = Math.max(...scalable, rate ? 0.01 : 1);
  let per = rate ? niceStep(qmax / 620) : nicePer(qmax);
  const build = (p: number) =>
    CODES.map((c) => (c === sel || pole.get(c) === 2 ? 0 : dotsFor(qty.get(c)!, p)));
  let n = build(per);
  for (let i = 0; i < 10 && n.reduce((a, v) => a + v, 0) > DOT_BUDGET; i++) {
    per = coarser(per, rate);
    n = build(per);
  }
  return n;
}

function restView(): View {
  // Two cells per cluster, both at ONE scale, so the cut sits exactly where they put it.
  // Counted separately rather than cut out of a rounded total: rounding the gross first
  // and then apportioning it would move the cut by up to a dot for arithmetic reasons.
  const per = nicePer(
    Math.max(
      ...CODES.map((c) => {
        const t = TOTALS_BY_CBSA.get(c)!;
        return t.total_in + t.total_out;
      })
    )
  );
  const cut = CODES.map((c) => dotsFor(TOTALS_BY_CBSA.get(c)!.total_in, per));
  const n = CODES.map((c, i) => cut[i] + dotsFor(TOTALS_BY_CBSA.get(c)!.total_out, per));
  // The ring, at the same `per` as the body. `dotsFor` floors a nonzero value at one dot, so
  // a metro whose residual rounds under a dot still gets a ring — which is the point: the
  // residual is never zero anywhere, and a metro drawn with no ring at all would say it was.
  const ring = CODES.map((c) => {
    const t = TOTALS_BY_CBSA.get(c)!;
    return dotsFor(t.rest_in_suppressed + t.rest_out_suppressed, per);
  });
  return { n, pole: CODES.map(() => 3 as PoleCode), cut, ring };
}

function selectionView(sel: string, rate: boolean): View {
  const { qty, pole } = selectionQuantities(sel);
  // PER 1,000 DIVIDES BY THE PARTNER'S RESIDENTS, and that choice is the whole toggle.
  // Dividing by the SELECTED metro would put one denominator under all twenty-nine, which
  // rescales the Total view and draws exactly the same picture at a different size.
  const scaled = new Map<string, number>();
  for (const c of CODES) scaled.set(c, rate ? (qty.get(c)! / POPULATION[c]) * 1000 : qty.get(c)!);
  return {
    n: scaledCounts(scaled, pole, sel, rate),
    pole: CODES.map((c) => pole.get(c)!),
    cut: CODES.map(() => 0),
  };
}

export function buildField(): FieldData {
  const { pos, outline } = ground();

  const views: Record<string, View> = { rest: restView() };
  const rates: Record<string, View> = {};
  for (const c of CODES) {
    views[c] = selectionView(c, false);
    rates[c] = selectionView(c, true);
  }

  const wpos: number[] = [];
  for (const c of CODES) wpos.push(pos[c][0], pos[c][1]);

  const grid = gridLayout(CODES, PHONE);
  const ppos: number[] = [];
  for (const c of CODES) ppos.push(Number(grid[c][0].toFixed(1)), Number(grid[c][1].toFixed(1)));

  return { codes: CODES, views, rates, wpos, ppos, outline };
}
