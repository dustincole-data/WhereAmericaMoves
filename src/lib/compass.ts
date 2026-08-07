// The phone's mark, and the reason it is a different one.
//
// THE COUNTRY DOES NOT FIT ON A PHONE, and shrinking it is not a route. The field's plate is
// 1240 units wide; at a 390px viewport that is a scale of 0.315, which renders a 15px metro
// name at 4.7px and Cincinnati's mark at 5.2px across. v2's answer was a 300%-wide horizontal
// scroller, which keeps the type readable and puts A THIRD OF THE COUNTRY on screen — so the
// west-to-east walk the whole mark is built on is never visible at all. Both routes fail, in
// opposite directions.
//
// A bar chart was tried and rejected on the right grounds: it does not show where anybody
// goes, which is the only question the reader is actually asking.
//
// So the phone gets the same subject on the axis a phone has. THE COMPASS is round, and a
// circle fills a narrow column at any width where a country 2.4 times wider than it is tall
// never will:
//
//   * every destination sits at its TRUE COMPASS BEARING from the selected metro, at a radius
//     that is its real great-circle distance on a log scale. The shape of the star is that
//     metro's actual migration geography, not an arrangement of it.
//   * area is people — one published cell of `top_metro_relations` each, the same encoding the
//     desktop mark uses, so the two cannot disagree about what a size means.
//   * hue is the destination's own position hue, read from the same emitted table the field
//     uses. A mark here and the same metro on the plate are the same colour by construction.
//   * THE WITHHELD IS THE FIELD THE STAR SITS INSIDE — a disc whose area is that metro's own
//     `rest_of_us_out_suppressed` cell, dashed, no ink. It is larger than any single
//     destination because it is. C's "absence as extent without ink", on a phone.
//
// WHAT THIS MODULE MAY NOT DO. It constructs no copy and prints no figure: it draws geometry
// and nothing else, so there is no client-side template that could put a number on screen
// behind the ledger's back. Names come from the DOM the server already rendered. Bearings and
// distances are apparatus under `contract.apparatus` — computed from typed-in coordinates,
// never derived from the migration data, and never printed.
//
// The geometry arrives PRE-COMPUTED from `hero_r4.py --geometry`, as unit bearings and
// log-distance fractions, so the phone multiplies by whatever radius the viewport gives it
// and re-derives nothing. Thirty compasses as data is 30kb; thirty compasses as markup is not.

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface CompassLeg {
  bearing: number;
  t: number;
  value: number | null;
}
export interface CompassMetro {
  suppressed: number;
  total_out: number;
  to: Record<string, CompassLeg>;
}
export interface CompassData {
  metros: Record<string, CompassMetro>;
  hues: Record<string, { read: string; line: string }>;
  names: Record<string, string>;
}

/** Where a leg lands, in the unit circle the caller scales. */
function place(leg: CompassLeg, r0: number, r1: number): [number, number] {
  const rr = r0 + (r1 - r0) * leg.t;
  const a = ((leg.bearing - 90) * Math.PI) / 180;
  return [Math.cos(a) * rr, Math.sin(a) * rr];
}

/** A ribbon that tapers from tail to head and bows the same way every other line in the piece
    does. An even stroke reads identically in both directions, which is the defect round 2b
    recorded against the first fan. */
function ribbon(
  x0: number, y0: number, x1: number, y1: number, w0: number, w1: number, n = 22,
): string {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const bow = len * 0.16;
  const cx = (x0 + x1) / 2 - (dy / len) * bow;
  const cy = (y0 + y1) / 2 + (dx / len) * bow;
  const q = (t: number): [number, number] => {
    const a = (1 - t) ** 2;
    const b = 2 * (1 - t) * t;
    const c = t ** 2;
    return [a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1];
  };
  const L: string[] = [];
  const R: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [px, py] = q(t);
    const [ax, ay] = q(Math.min(1, t + 0.01));
    const [bx, by] = q(Math.max(0, t - 0.01));
    const d = Math.hypot(ax - bx, ay - by) || 1e-6;
    const nx = -(ay - by) / d;
    const ny = (ax - bx) / d;
    const hw = (w0 + (w1 - w0) * t) / 2;
    L.push(`${(px + nx * hw).toFixed(1)} ${(py + ny * hw).toFixed(1)}`);
    R.unshift(`${(px - nx * hw).toFixed(1)} ${(py - ny * hw).toFixed(1)}`);
  }
  return `M ${L.concat(R).join(' L ')} Z`;
}

export function drawCompass(host: HTMLElement, data: CompassData, cbsa: string | null): void {
  host.replaceChildren();
  if (!cbsa) return;
  const m = data.metros[cbsa];
  if (!m) return;

  const W = 400;
  const CX = W / 2;
  const CY = W / 2;
  const R0 = W * 0.15;
  const R1 = W * 0.4;
  const MK = W * 0.115;

  const legs = Object.entries(m.to);
  const denom = Math.max(
    m.suppressed,
    ...legs.map(([, l]) => l.value ?? 0),
  );
  const mr = (v: number) => Math.max(1.6, MK * Math.sqrt(v / denom));
  let CX2 = CX;
  let CY2 = CY;
  let SC = 1;
  const R = (v: number) => mr(v) * SC;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${W}`);
  svg.setAttribute('role', 'img');
  const own = data.names[cbsa] ?? '';
  svg.setAttribute('aria-label', `Where ${own}'s people went, drawn at each destination's real bearing and distance. The dashed field is the ones attached to no pair of counties.`);

  const defs = document.createElementNS(SVG_NS, 'defs');
  svg.appendChild(defs);

  const pos = new Map<string, [number, number]>();
  for (const [d, leg] of legs) {
    const [x, y] = place(leg, R0, R1);
    pos.set(d, [CX + x, CY + y]);
  }

  // FIT THE STAR, NOT THE ORIGIN. Centring the selected metro wastes whatever half of the
  // country it is not in — Houston is southern, so an origin-centred compass leaves the bottom
  // third of a phone empty, and New York wastes the top. The box includes each mark's own
  // RADIUS, because the biggest discs are exactly the ones at the edges and fitting centres
  // clips them against the frame the fit just chose.
  const field0 = mr(m.suppressed);
  let x0 = CX - field0;
  let x1 = CX + field0;
  let y0 = CY - field0;
  let y1 = CY + field0;
  for (const [d, leg] of legs) {
    const [px, py] = pos.get(d)!;
    const rr = leg.value == null ? 4.6 : mr(leg.value) + 3.4;
    x0 = Math.min(x0, px - rr); x1 = Math.max(x1, px + rr);
    y0 = Math.min(y0, py - rr); y1 = Math.max(y1, py + rr);
  }
  const PAD = W * 0.075;
  const fit = Math.min((W - 2 * PAD) / (x1 - x0 || 1), (W - 2 * PAD) / (y1 - y0 || 1));
  const ox = PAD + (W - 2 * PAD - (x1 - x0) * fit) / 2 - x0 * fit;
  const oy = PAD + (W - 2 * PAD - (y1 - y0) * fit) / 2 - y0 * fit;
  const T = (x: number, y: number): [number, number] => [x * fit + ox, y * fit + oy];
  for (const [d] of legs) {
    const [px, py] = pos.get(d)!;
    pos.set(d, T(px, py));
  }
  [CX2, CY2] = T(CX, CY);
  SC = fit;

  const add = (tag: string, attrs: Record<string, string | number>, parent: Element = svg) => {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    parent.appendChild(el);
    return el;
  };

  // the withheld, as the field the star sits inside
  const field = mr(m.suppressed) * SC;
  const ownHue = data.hues[cbsa]?.read ?? '#5c6068';
  add('circle', { cx: CX2.toFixed(1), cy: CY2.toFixed(1), r: field.toFixed(1), fill: ownHue, opacity: 0.055 });
  add('circle', {
    cx: CX2.toFixed(1), cy: CY2.toFixed(1), r: field.toFixed(1), fill: 'none', stroke: ownHue,
    'stroke-width': 1.5, 'stroke-dasharray': '4 3', opacity: 0.8,
  });

  // the connective pass: washed twin hues, under the marks, never over them
  legs.forEach(([d, leg], i) => {
    if (leg.value == null) return;
    const [x, y] = pos.get(d)!;
    const r = R(leg.value);
    const id = `cg${i.toString(36)}`;
    const g = add('linearGradient', {
      id, gradientUnits: 'userSpaceOnUse', x1: CX2.toFixed(1), y1: CY2.toFixed(1), x2: x.toFixed(1), y2: y.toFixed(1),
    }, defs);
    add('stop', { offset: 0, 'stop-color': data.hues[cbsa]?.line ?? '#c9ced6' }, g);
    add('stop', { offset: 1, 'stop-color': data.hues[d]?.line ?? '#c9ced6' }, g);
    add('path', {
      d: ribbon(CX2, CY2, x, y, Math.max(1.2, r * 1.25), Math.max(0.6, r * 0.34)),
      fill: `url(#${id})`, opacity: 0.62,
    });
  });

  // the marks: a ground moat lifts each clear of what runs beneath, then the hue twice —
  // washed halo, saturated core. The halo is one width on all twenty-nine, so only the
  // radius carries a quantity.
  legs.forEach(([d, leg]) => {
    const [x, y] = pos.get(d)!;
    const read = data.hues[d]?.read ?? '#5c6068';
    const line = data.hues[d]?.line ?? '#c9ced6';
    if (leg.value == null) {
      add('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 4.6, fill: 'var(--ground)', opacity: 0.9 });
      add('circle', {
        cx: x.toFixed(1), cy: y.toFixed(1), r: 3.4, fill: 'none', stroke: read,
        'stroke-width': 1.2, 'stroke-dasharray': '2 1.8',
      });
      return;
    }
    const r = R(leg.value);
    add('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (r + 3.4).toFixed(1), fill: 'var(--ground)', opacity: 0.92 });
    add('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (r + 2.2).toFixed(1), fill: line, opacity: 0.85 });
    add('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(1), fill: read });
  });

  // the origin
  add('circle', { cx: CX2.toFixed(1), cy: CY2.toFixed(1), r: (MK * 0.32 * SC).toFixed(1), fill: 'var(--ground)' });
  add('circle', { cx: CX2.toFixed(1), cy: CY2.toFixed(1), r: (MK * 0.27 * SC).toFixed(1), fill: ownHue });

  // NAMES. Four candidate positions per mark, first one that hits nothing wins; anything that
  // cannot be placed is left unnamed rather than stacked on top of something. A compass at
  // 390px cannot hold twenty-nine names and pretending otherwise is how 9.2px type happened.
  // The unplaced ones are a tap away -- this mark is interactive, unlike the plate.
  const taken: [number, number, number, number][] = [];
  const hits = (b: [number, number, number, number]) =>
    taken.some((t) => !(b[2] < t[0] || b[0] > t[2] || b[3] < t[1] || b[1] > t[3])) ||
    b[0] < 2 || b[2] > W - 2 || b[1] < 2 || b[3] > W - 2 ||
    legs.some(([d2, l2]) => {
      const [qx, qy] = pos.get(d2)!;
      const rr = (l2.value == null ? 4.6 : R(l2.value) + 3.4) + 1.5;
      const nx = Math.max(b[0], Math.min(qx, b[2]));
      const ny = Math.max(b[1], Math.min(qy, b[3]));
      return Math.hypot(qx - nx, qy - ny) < rr;
    });
  const ordered = [...legs].sort((a, b) => (b[1].value ?? 0) - (a[1].value ?? 0));
  for (const [d, leg] of ordered) {
    const name = data.names[d];
    if (!name) continue;
    const [px, py] = pos.get(d)!;
    const rr = leg.value == null ? 4.6 : R(leg.value) + 3.4;
    const w = name.length * 5.4;
    const h = 11;
    const cands: [number, number][] = [
      [0, rr + h * 0.92], [0, -(rr + 5)], [rr + 5 + w / 2, 3.6], [-(rr + 5 + w / 2), 3.6],
    ];
    for (const [dx, dy] of cands) {
      const lx = px + dx;
      const ly = py + dy;
      const box: [number, number, number, number] = [lx - w / 2, ly - h * 0.8, lx + w / 2, ly + h * 0.26];
      if (hits(box)) continue;
      taken.push(box);
      const t = add('text', {
        x: lx.toFixed(1), y: ly.toFixed(1), 'font-size': 11, 'font-weight': 500,
        'text-anchor': 'middle', fill: 'var(--ink)',
      });
      t.textContent = name;
      break;
    }
  }

  host.appendChild(svg);
}
