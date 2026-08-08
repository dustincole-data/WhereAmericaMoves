// The cluster mark's geometry, and the ONE place its rules live.
//
// 13 ruled the form on 2026-08-07: candidate B, clusters of dots, laid out in the rough
// shape of the country on a wide screen and on a four-column grid on a phone. This module
// is imported by BOTH the page (which computes every layout at build, from the verified
// package) and the client (which draws them). One copy of every formula, so a radius the
// server relaxed against and a radius the browser draws can never disagree — which is the
// defect the plates hit first: relaxing positions against one view's radii and drawing
// another's piles the marks up.
//
// NOTHING HERE IS A MEASUREMENT. Coordinates, the relaxation, the reading order and the
// phyllotaxis are apparatus under `contract.apparatus`, and none of them is ever printed.
// The only quantities that reach this file arrive as a dot COUNT, already divided by a
// scale the page derived from published cells.

/** Spectral WITHIN each pole, deep at the cluster's centre and light at its rim, so a
    cluster reads as a body with depth rather than a flat stipple. Both ramps stay inside
    the two poles of the locked wheel, which cleared `check_r4_cvd.py` as drawn hues. */
export const GAIN_RAMP = ['#00463c', '#00695c', '#0b8476', '#3aa294', '#6dbfb2'];
export const LOSS_RAMP = ['#7a2408', '#a63a12', '#c25324', '#d9743f', '#e89a69'];
export const RAMP_STOPS = GAIN_RAMP.length;

/** An exchange that came out even is neither a gain nor a loss, so it gets neither pole.
    The plate generator sent it down the loss branch — `net > 0 ? gain : loss` — which drew
    a measured balance in the colour of a departure. */
export const EVEN_INK = '#5c6068';

export interface Mode {
  /** logical drawing box; the stage letterboxes this, it is not CSS pixels */
  w: number;
  h: number;
  pad: number;
  top: number;
  bottom: number;
  /** CONSTANT AREA PER DOT. Cluster area is therefore literally proportional to the count,
      and the texture is identical on every cluster of every view — which is what a
      selection-dependent density was silently breaking. */
  dotArea: number;
  dotR: number;
  /** the selected metro is a fixed ring: it is what the others are measured FROM, so its
      area must assert nothing */
  sourceR: number;
  /** two fixed-size glyphs, neither of which is a quantity */
  absentR: number;
  evenR: number;
  labelSize: number;
  gap: number;
}

export const WIDE: Mode = {
  w: 1240,
  h: 800,
  pad: 44,
  top: 16,
  bottom: 24,
  dotArea: 11.5,
  dotR: 1.6,
  sourceR: 30,
  absentR: 13,
  evenR: 3.4,
  labelSize: 12,
  gap: 15,
};

export const PHONE: Mode = {
  w: 390,
  h: 748,
  pad: 12,
  top: 6,
  bottom: 14,
  dotArea: 6,
  dotR: 1.15,
  sourceR: 19,
  absentR: 9,
  evenR: 2.6,
  labelSize: 10,
  gap: 6,
};

// ── the dot scale ──────────────────────────────────────────────────────────────
//
// Derived per view so the largest cluster in the view always has a full body, and NEVER
// printed. A single scale across all thirty selections was measured against the real frame
// and rejected: the largest pairwise net in the package is 34,535 and Cincinnati's largest
// is 292, so one scale draws fifteen of the thirty metros as a field of single dots. The
// cost of a per-view scale is that two selections are not comparable to each other, and the
// keystrip says so rather than leaving a reader to assume otherwise.

// A denser ladder than the plate's, and the reason is that the plate's cost a third of the
// frame. `1,2,5` snapping put the resting view's largest cluster at 337 dots against a
// target of 620, because the value it needed was 1,089 and the next rung was 2,000 — so the
// whole mark drew at three-quarters of the radius it was entitled to and the country sat in
// a moat. The scale is never printed, so the rungs only have to be round enough to keep the
// count honest, not round enough to read aloud.
const NICE = [
  1, 1.5, 2, 2.5, 3, 4, 5, 6, 8,
  10, 15, 20, 25, 30, 40, 50, 60, 80,
  100, 150, 200, 250, 300, 400, 500, 600, 800,
  1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000,
];
const TARGET_DOTS = 620;

export function nicePer(qmax: number): number {
  const want = qmax / TARGET_DOTS;
  for (const v of NICE) if (v >= want) return v;
  return NICE[NICE.length - 1];
}

/** A value that rounds below one dot is drawn at ONE dot — the smallest mark this piece
    can make — so the smallest exchanges are not to scale. Disclosed in the keystrip, which
    is the same bargain the ribbon's width floor struck and disclosed before it. */
export function dotsFor(value: number, per: number): number {
  if (value <= 0) return 0;
  return Math.max(Math.round(value / per), 1);
}

export function radiusFor(n: number, m: Mode): number {
  return Math.sqrt(Math.max(n, 1) * (m.dotArea / Math.PI));
}

/** Phyllotaxis. Returns the fraction of the way to the rim alongside the point, so the
    pole's ramp can be spent across the body of the cluster. */
export function dotAt(i: number, n: number, cx: number, cy: number, r: number): [number, number, number] {
  const t = i + 0.5;
  const frac = n > 0 ? Math.sqrt(t / n) : 0;
  const th = t * 2.399963229728653;
  return [cx + r * frac * Math.cos(th), cy + r * frac * Math.sin(th), frac];
}

/** The three ramps, indexed. A dot's whole colour identity is one integer in 0…14 — the
    band it is in times the stops per ramp, plus its stop — which is what lets the renderer
    draw a cluster in fifteen filled paths instead of one path per dot. */
export const BANDS = [GAIN_RAMP, LOSS_RAMP, [EVEN_INK, EVEN_INK, EVEN_INK, EVEN_INK, EVEN_INK]];

/** Which band a dot belongs to. `pole` is field.ts's code: 1 gain · −1 loss · 0 even. */
export function bandOf(pole: number): number {
  return pole === 1 ? 0 : pole === -1 ? 1 : 2;
}

/** The bucket a dot lands in: its band, times the stops, plus where it sits between the
    cluster's centre and its rim. Depth is radial in every view, so a cut cluster still
    reads as one body and the cut is a boundary across it rather than a second texture. */
export function bucketOf(band: number, frac: number): number {
  return band * RAMP_STOPS + Math.min(Math.floor(frac * RAMP_STOPS), RAMP_STOPS - 1);
}

/** THE CUT, and it is a straight edge for a measured reason.
 *
 * At rest a cluster carries two cells that are always close: `total_in` over the metro's
 * whole movement runs 0.371 (New York) to 0.554 (Charlotte) across the thirty. Drawn as a
 * concentric core that share becomes a radius of 0.609R–0.745R against a halfway mark at
 * 0.707R — a spread of about two pixels on the biggest cluster on the page and less than
 * one on the smallest, which is a difference a reader cannot see. Rendered and looked at
 * before it was rejected.
 *
 * A STRAIGHT EDGE AGAINST A STRAIGHT DATUM is what a near-tie needs. The `cut` dots lowest
 * in the cluster are the arrivals, so the boundary between the two colours is a horizontal
 * line, and the halfway mark is the cluster's own centre — a line the reader judges against
 * rather than an area they have to estimate. It travels about 0.29R across the thirty,
 * roughly ten pixels on the largest, and it is the mechanism candidate A carried.
 *
 * The near-tie is the honest finding underneath, and it is why the ruled flat green/red had
 * to go on its own terms as well as the contract's: these are coin-flips, and a solid
 * colour renders a coin-flip as a category.
 */
export function cutBands(ys: ArrayLike<number>, n: number, cut: number): Uint8Array {
  const idx = new Uint16Array(n);
  for (let i = 0; i < n; i++) idx[i] = i;
  const order = Array.from(idx).sort((a, b) => ys[b] - ys[a]);
  const band = new Uint8Array(n).fill(1);
  for (let k = 0; k < Math.min(cut, n); k++) band[order[k]] = 0;
  return band;
}

// ── the two layouts ────────────────────────────────────────────────────────────

/** A rough conic-ish projection of the lower 48. Deliberately approximate: the ruling was
    that the layout only has to READ as the country, gaps included. */
export function project(lon: number, lat: number): [number, number] {
  const lon0 = -98;
  const lat0 = 39;
  const k = Math.cos((lat0 * Math.PI) / 180);
  return [(lon - lon0) * k, -(lat - lat0) * 1.24];
}

export interface Placeable {
  cbsa: string;
  lon: number;
  lat: number;
}

/** Each metro at its own projected point, then relaxed until the discs stop colliding.
    Positions drift; the silhouette survives. RELAXED AGAINST THE RADII THE CALLER IS ABOUT
    TO DRAW — passing one view's radii and drawing another's is what piled Florida and the
    north-east on top of each other. */
export function usLayout(
  metros: Placeable[],
  radius: Record<string, number>,
  m: Mode
): Record<string, [number, number]> {
  const pts = new Map<string, [number, number]>();
  for (const p of metros) pts.set(p.cbsa, project(p.lon, p.lat));

  const xs = [...pts.values()].map((p) => p[0]);
  const ys = [...pts.values()].map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);

  // The label rides under its cluster, so the field stops short of the box by a line of type.
  const lane = m.labelSize + 6;
  const fw = m.w - 2 * m.pad;
  const fh = m.h - m.top - m.bottom - lane;
  // 0.94, not 0.84: the slack exists so a relaxed cluster has somewhere to go, and at 0.84
  // it was eating an eighth of the frame in every direction before the marks were even drawn.
  const s = Math.min(fw / (x1 - x0), fh / (y1 - y0)) * 0.94;
  const ox = m.pad + (fw - (x1 - x0) * s) / 2 - x0 * s;
  const oy = m.top + (fh - (y1 - y0) * s) / 2 - y0 * s;

  const codes = metros.map((p) => p.cbsa);
  const pos = new Map<string, [number, number]>();
  for (const c of codes) {
    const p = pts.get(c)!;
    pos.set(c, [p[0] * s + ox, p[1] * s + oy]);
  }

  for (let pass = 0; pass < 260; pass++) {
    for (let i = 0; i < codes.length; i++) {
      for (let j = i + 1; j < codes.length; j++) {
        const a = pos.get(codes[i])!;
        const b = pos.get(codes[j])!;
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const d = Math.hypot(dx, dy) || 0.01;
        const need = radius[codes[i]] + radius[codes[j]] + m.gap;
        if (d >= need) continue;
        const push = ((need - d) / 2) * 0.55;
        a[0] -= (dx / d) * push;
        a[1] -= (dy / d) * push;
        b[0] += (dx / d) * push;
        b[1] += (dy / d) * push;
      }
    }
    for (const c of codes) {
      const p = pos.get(c)!;
      const r = radius[c];
      p[0] = Math.min(Math.max(p[0], m.pad + r), m.w - m.pad - r);
      p[1] = Math.min(Math.max(p[1], m.top + r), m.h - m.bottom - lane - r);
    }
  }

  const out: Record<string, [number, number]> = {};
  for (const c of codes) out[c] = pos.get(c)!;
  return out;
}

/** The phone keeps the grid — it was ruled in as it stands, and it is the only layout in
    this effort that has ever put all thirty on a phone at once without a sideways scroll.
    Cell centres, so the same grid serves every view and nothing moves under a thumb. */
export function gridLayout(order: string[], m: Mode, cols = 4): Record<string, [number, number]> {
  const rows = Math.ceil(order.length / cols);
  const lane = m.labelSize + 4;
  const fw = m.w - 2 * m.pad;
  const fh = m.h - m.top - m.bottom;
  const cw = fw / cols;
  const ch = fh / rows;
  const out: Record<string, [number, number]> = {};
  order.forEach((c, i) => {
    out[c] = [m.pad + (i % cols) * cw + cw / 2, m.top + Math.floor(i / cols) * ch + ch / 2 - lane / 2];
  });
  return out;
}

// ── the thread ─────────────────────────────────────────────────────────────────

/** One quadratic, bowed off its own chord. Same handedness for every thread, so a fan
    converging on one hub separates instead of overlaying itself. */
export function threadControl(
  x0: number,
  y0: number,
  x1: number,
  y1: number
): [number, number] {
  return [(x0 + x1) / 2, (y0 + y1) / 2 - Math.abs(x1 - x0) * 0.16];
}

/** A point on that quadratic. Used to draw the thread partially while it grows in. */
export function quadPoint(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  t: number
): [number, number] {
  const a = (1 - t) * (1 - t);
  const b = 2 * t * (1 - t);
  const c = t * t;
  return [a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1];
}

// ── colour ─────────────────────────────────────────────────────────────────────

export function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

