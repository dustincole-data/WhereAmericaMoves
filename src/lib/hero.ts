// The hero's interaction, and the one new mark in v2.
//
// WHAT THIS REPLACES. v2 shipped two charts: 09's crowd at the top and a d3 dot map five
// screens below it, in a section of its own. Beauty 06's addendum of 2026-08-06 folds the
// second into the first — the crowd IS the selector — because the reader met them as two
// unrelated pictures and had to scroll past four prose beats to reach the one that moved.
// `map.ts` and its d3-geo / topojson / us-atlas dependencies go with it.
//
// THE NEW MARK, and why it is not the chord that died three times. Beauty 03 killed a ring
// three times for one reason: a chord routes ALL 863 ribbons through one centre, so hues
// interleave at mark scale and the middle goes to mush — a figure/ground failure, not a
// palette failure. The rule that keeps this out of that hole is structural, not a setting:
//
//   NO LINE IS DRAWN AT REST.
//
// The layer is empty until the reader elects a metro, and then it holds one metro's lines —
// at most 29 out and 29 in, radiating to 29 distinct places on a map. There is never a state
// in which 863 ribbons are on screen at once, so the mush the chord could not avoid is
// unreachable here rather than tuned away.
//
// WHAT THE CONTRACT SAYS ABOUT IT. Each line is ONE CELL of `top_metro_relations` — one
// directed pair, drawn at its own disclosed value. Beauty 05 §2: naming is asserting a cell's
// relation to cells NOT SHOWN — a superlative, a rank, a top-N cut. Nothing here is cut,
// sorted, labelled or called out: every one of the metro's directions is drawn, including the
// ones with no flow to draw. A reader whose eye finds the thickest line is 05 §3's scales
// clause working as designed — "a chord where the reader's own eye finds the darkest arc is
// just what a chart is".
//
// AND THE OBLIGATION IS IN THE MARK. D0014 requires the missing-pair count to be published
// with any claim on this relation set, and says an absent pair means withheld-or-absent and
// never zero. So an absent direction is DRAWN — a dashed empty line to an open ring, at the
// smallest size this piece draws — rather than omitted. Select Baltimore and a line goes out
// to Cincinnati carrying nothing. That is beat ④ delivered by the map instead of by a
// paragraph, which is the whole point of the reopen.
//
// This module constructs NO COPY. It draws geometry and toggles the visibility of readouts
// the server already rendered, so every string the reader can reach is in dist for the
// lint's backstop and there is no client template that could put a figure on screen behind
// the ledger's back.

import { drawCompass } from './compass';

interface Hub {
  cbsa: string;
  x: number;
  y: number;
  r: number;
}

interface Payload {
  viewBox: [number, number, number, number];
  hubs: Hub[];
  hues: Record<string, { hub: string; read: string; wash: string; line: string }>;
  compass: Record<string, import('./compass').CompassMetro>;
  names: Record<string, string>;
  /** The badges are buttons, so they need names. Name-from-content over an SVG <text> child
      is unreliable in Safari/VoiceOver, and the rewrite that made the crowd the selector
      dropped the labels the deleted dot map used to set — so thirty controls shipped nameless.
      These are `metroCopy(...).aria`, which is a real CopyRecord and was dead code. */
  aria: Record<string, string>;
  /** [origin, dest, people] — one row per disclosed pair. */
  pairs: [string, string, number][];
  /** [origin, dest] — the directions with no disclosed flow at all. */
  absent: [string, string][];
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** How far a line bows off its own chord, as a fraction of its length. The crowd's own
    leaders bow at 0.244; a leader is a stub and these run coast to coast, so the same
    fraction would throw a cross-country line halfway to Canada. The HANDEDNESS is what has
    to match — every line bows right of its direction of travel, so a reciprocal pair draws
    two separated arcs rather than one line drawn twice. */
const BOW = 0.135;

/** The taper. 09's D2: a line reads as travelling when it is fat where it starts and thin
    where it arrives, and an even stroke reads identically in both directions — which is
    what "can't see where they are going" was pointing at in round 2b. HEAD_W is a fraction
    of the line's own width rather than a constant: a constant head drew every arrival end
    NARROWER than the smallest width the scale can express, i.e. off the bottom of its own
    axis, so the taper was silently subtracting value instead of showing direction. */
const HEAD_FRAC = 0.3;

/** The width scale, and it is MULTIPLICATIVE. It used to be `MIN_W + sqrt(v/max)*(MAX_W-MIN_W)`
    — an additive floor, which is not a floor at all: it lifts every cell, not the small ones.
    Measured on the real frame, that drew a 30-person cell at the width of 965 people (32.2x)
    and overstated 349 of 863 cells by 2x or more. This is the exact defect 09 round 1 was
    failed for (an undisclosed area floor drawing a 30-person cell at 4.25x its honest area),
    arriving again in a different channel and seven times worse.

    Now: honest sqrt, with a hard floor applied only below it — and the floor is DISCLOSED in
    the legend, which is the other half of 09's E2 that the first draw dropped. */
const MAX_W = 15;
const FLOOR_W = 1;

const el = <T extends Element>(sel: string) => document.querySelector(sel) as T | null;

const field = el<HTMLElement>('#field');
const payloadEl = el<HTMLScriptElement>('#hero-data');
const picker = el<HTMLSelectElement>('#metroPick');
const atRest = el<HTMLElement>('#atrest');
const live = el<HTMLElement>('#live');
const compassHost = el<HTMLElement>('#compass');

if (field && payloadEl) {
  const data: Payload = JSON.parse(payloadEl.textContent || '{}');
  const svg = field.querySelector('svg')!;
  const hub = new Map(data.hubs.map((h) => [h.cbsa, h]));
  const hue = (cbsa: string) => data.hues[cbsa]?.read ?? '#5c6068';

  // Out and in, indexed once. Both directions are kept because a metro's record has two
  // halves and the readout prints both; the drawing tells them apart by weight, not by
  // hiding one.
  const out = new Map<string, [string, number][]>();
  const into = new Map<string, [string, number][]>();
  let maxPeople = 1;
  for (const [o, d, v] of data.pairs) {
    (out.get(o) ?? out.set(o, []).get(o)!).push([d, v]);
    (into.get(d) ?? into.set(d, []).get(d)!).push([o, v]);
    if (v > maxPeople) maxPeople = v;
  }
  const absentOut = new Map<string, string[]>();
  const absentIn = new Map<string, string[]>();
  for (const [o, d] of data.absent) {
    (absentOut.get(o) ?? absentOut.set(o, []).get(o)!).push(d);
    (absentIn.get(d) ?? absentIn.set(d, []).get(d)!).push(o);
  }

  const width = (people: number) => Math.max(FLOOR_W, MAX_W * Math.sqrt(people / maxPeople));

  // ── the layers ───────────────────────────────────────────────────────────────
  // Under the badges, over the crowd: a line must not cover the landmark it points at.
  const defs = document.createElementNS(SVG_NS, 'defs');
  const gLines = document.createElementNS(SVG_NS, 'g');
  gLines.setAttribute('class', 'lines');
  const firstBadge = svg.querySelector('g[data-metro]');
  svg.insertBefore(defs, firstBadge);
  svg.insertBefore(gLines, firstBadge);

  /** A quadratic from p0 to p1, bowed right, offset into a ribbon that tapers from w0 to
      HEAD_W. Sampled rather than offset analytically: 22 samples is under a tenth of a
      pixel of error at this scale and it cannot produce the cusps an analytic offset does
      where the curvature is tight. */
  function ribbon(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    w0: number,
    trim0: number,
    trim1: number
  ): string {
    let dx = x1 - x0;
    let dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    // Start at the badge's edge, stop at the far badge's edge: a line that starts under the
    // ring it starts from reads as coming from nowhere.
    //
    // But the trims are capped, and that cap matters more than it looks. Badge radii run
    // 18–32 units and adjacent metros sit closer than that, so the untrimmed rule deleted
    // the heaviest cells outright: Los Angeles to Riverside, 78,209 people — THE LARGEST CELL
    // IN THE FRAME, the one that defines the top of the width scale — was drawn 1.8 units long
    // and 15 wide, a blob under the badge layer. Nine of the twenty heaviest cells were wider
    // than they were long. A cap that keeps a minimum drawn length is the difference between
    // "these two places trade the most people in the country" being the biggest mark on screen
    // and it being invisible.
    const keep = Math.max(0, len - 6);
    const scale = trim0 + trim1 > keep ? keep / (trim0 + trim1) : 1;
    const ux = dx / len;
    const uy = dy / len;
    x0 += ux * trim0 * scale;
    y0 += uy * trim0 * scale;
    x1 -= ux * trim1 * scale;
    y1 -= uy * trim1 * scale;
    dx = x1 - x0;
    dy = y1 - y0;
    const L = Math.hypot(dx, dy) || 1;
    const cx = (x0 + x1) / 2 + (-dy / L) * BOW * L;
    const cy = (y0 + y1) / 2 + (dx / L) * BOW * L;

    const N = 22;
    const top: string[] = [];
    const bot: string[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const a = (1 - t) * (1 - t);
      const b = 2 * t * (1 - t);
      const c = t * t;
      const px = a * x0 + b * cx + c * x1;
      const py = a * y0 + b * cy + c * y1;
      const tx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx);
      const ty = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
      const tl = Math.hypot(tx, ty) || 1;
      const nx = -ty / tl;
      const ny = tx / tl;
      const h = (w0 * (1 - (1 - HEAD_FRAC) * t)) / 2;
      top.push(`${(px + nx * h).toFixed(1)},${(py + ny * h).toFixed(1)}`);
      bot.push(`${(px - nx * h).toFixed(1)},${(py - ny * h).toFixed(1)}`);
    }
    return `M${top.join('L')}L${bot.reverse().join('L')}Z`;
  }

  function curve(x0: number, y0: number, x1: number, y1: number, trim0: number, trim1: number): string {
    const dx0 = x1 - x0;
    const dy0 = y1 - y0;
    const len = Math.hypot(dx0, dy0) || 1;
    const sx = x0 + (dx0 / len) * trim0;
    const sy = y0 + (dy0 / len) * trim0;
    const ex = x1 - (dx0 / len) * trim1;
    const ey = y1 - (dy0 / len) * trim1;
    const dx = ex - sx;
    const dy = ey - sy;
    const L = Math.hypot(dx, dy) || 1;
    const cx = (sx + ex) / 2 + (-dy / L) * BOW * L;
    const cy = (sy + ey) / 2 + (dx / L) * BOW * L;
    return `M${sx.toFixed(1)},${sy.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
  }

  let gradSeq = 0;
  function gradient(x0: number, y0: number, x1: number, y1: number, from: string, to: string): string {
    const id = `hl${gradSeq++}`;
    const g = document.createElementNS(SVG_NS, 'linearGradient');
    g.setAttribute('id', id);
    g.setAttribute('gradientUnits', 'userSpaceOnUse');
    g.setAttribute('x1', String(x0));
    g.setAttribute('y1', String(y0));
    g.setAttribute('x2', String(x1));
    g.setAttribute('y2', String(y1));
    // The fade used to start at 0.1 alpha and not reach full until 32% along — which put the
    // faintest ink on the WIDEST end and made the legend's own sentence false: "heavy where it
    // leaves, fine where it arrives" described a mark whose visual weight peaked a third of the
    // way across. Worse on hover, where the same end landed at 3.8% alpha. Now it is inked
    // where it leaves; the softening is a lead-in, not an erasure.
    for (const [off, col, op] of [
      [0, from, 0.62],
      [0.12, from, 1],
      [1, to, 1],
    ] as [number, string, number][]) {
      const s = document.createElementNS(SVG_NS, 'stop');
      s.setAttribute('offset', String(off));
      s.setAttribute('stop-color', col);
      if (op !== 1) s.setAttribute('stop-opacity', String(op));
      g.appendChild(s);
    }
    defs.appendChild(g);
    return id;
  }

  function clearLines() {
    gLines.replaceChildren();
    defs.replaceChildren();
    gradSeq = 0;
  }

  /** Draw one metro's whole record: everything leaving it, everything arriving, and every
      direction the publisher disclosed nothing for. `weight` scales the whole layer so the
      same drawing serves a hover preview and a selection. */
  function drawLines(cbsa: string, weight: number) {
    clearLines();
    const h0 = hub.get(cbsa);
    if (!h0) return;

    // The washed connective pass first — 09's two-area treatment, inverted onto direction:
    // arrivals are the wash, departures are the read. "Where these people are moving to" is
    // the question, so departures get the chroma.
    // Arrivals were drawn in the `wash` hue at half alpha, which measured 1.55:1 against the
    // ground for all thirty — under the 3:1 floor for a graphical object the legend names as
    // content. They are half of what a metro's record IS. The `read` hue at 0.62 clears the
    // floor and the weight difference still carries the distinction, which is what the
    // two-area treatment actually asks for.
    for (const [o, v] of into.get(cbsa) ?? []) {
      const h = hub.get(o);
      if (!h) continue;
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', curve(h.x, h.y, h0.x, h0.y, h.r + 1, h0.r + 1));
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', data.hues[o]?.read ?? '#9aa0aa');
      p.setAttribute('stroke-width', Math.max(0.6, 3.0 * Math.sqrt(v / maxPeople)).toFixed(2));
      p.setAttribute('stroke-opacity', String(0.62 * weight));
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('class', 'ln-in');
      gLines.appendChild(p);
    }

    for (const [d, v] of out.get(cbsa) ?? []) {
      const h = hub.get(d);
      if (!h) continue;
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', ribbon(h0.x, h0.y, h.x, h.y, width(v), h0.r + 1, h.r + 2));
      p.setAttribute('fill', `url(#${gradient(h0.x, h0.y, h.x, h.y, hue(cbsa), hue(d))})`);
      p.setAttribute('fill-opacity', String(0.9 * weight));
      p.setAttribute('class', 'ln-out');
      gLines.appendChild(p);
    }

    // The absences, drawn in both directions and never omitted.
    //
    // THE GLYPH IS THE SMALLEST MARK THIS PIECE DRAWS, and that is not a style choice — it is
    // 09's E1, which round 1 was failed on. The first draw put a dashed ring at the far
    // BADGE's radius + 4.5; badge radii are typography and encode nothing, so the ring came
    // out at r 22.5–36.9, which on the crowd's own area scale (107.25 people per r²) decodes
    // to 54,295–146,031 people. The largest disclosed cell in the entire frame is 78,209. The
    // glyph for "no flow was disclosed at all" was drawn bigger than the biggest flow in the
    // country — the same inversion that was FATAL in round 1, an order of magnitude worse.
    // It also drew the ring around the SELECTED metro for every inbound absence, so choosing
    // Cincinnati stamped three dashed halos on Cincinnati's own badge.
    //
    // Now: the disc equals the plate's own floored mark radius, it sits at the far end of its
    // own line, and findability is carried by the dashed stroke — which is exactly what round 2
    // ruled, restated for a line instead of a leader.
    const ABSENT_R = 1.05;
    for (const [list, outward] of [
      [absentOut.get(cbsa) ?? [], true],
      [absentIn.get(cbsa) ?? [], false],
    ] as [string[], boolean][]) {
      for (const other of list) {
        const h = hub.get(other);
        if (!h) continue;
        const [a, b] = outward ? [h0, h] : [h, h0];
        const trimB = b.r + 7;
        const p = document.createElementNS(SVG_NS, 'path');
        p.setAttribute('d', curve(a.x, a.y, b.x, b.y, a.r + 1, trimB));
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', 'var(--ink-2)');
        p.setAttribute('stroke-width', '1.6');
        p.setAttribute('stroke-dasharray', '4 5');
        p.setAttribute('stroke-opacity', String(0.9 * weight));
        p.setAttribute('class', 'ln-absent');
        gLines.appendChild(p);

        const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const ex = b.x - ((b.x - a.x) / L) * trimB;
        const ey = b.y - ((b.y - a.y) / L) * trimB;
        const dot = document.createElementNS(SVG_NS, 'circle');
        dot.setAttribute('cx', ex.toFixed(1));
        dot.setAttribute('cy', ey.toFixed(1));
        dot.setAttribute('r', String(ABSENT_R));
        dot.setAttribute('fill', 'none');
        dot.setAttribute('stroke', 'var(--ink-2)');
        dot.setAttribute('stroke-width', '1.4');
        dot.setAttribute('stroke-opacity', String(0.9 * weight));
        dot.setAttribute('class', 'ln-absent');
        gLines.appendChild(dot);
      }
    }
  }

  // ── the two views, and why per capita is not one of them ─────────────────────
  //
  // WHAT WAS ASKED FOR was a per-capita toggle. It cannot be built, and the reason is in the
  // package rather than in taste: `not_claimable[6]` says no migration RATE is claimable here,
  // because dividing these counts by resident population mixes universes -- filers and their
  // dependents over residents -- which biases every rate low by each place's own non-filing
  // share, and that share correlates with the demographics a migration story is usually about.
  // Resident population is not in the package at all, and `contract.default` is that an absent
  // quantity may not be drawn. The page already carries a section explaining why v1's toggle was
  // deleted, so shipping one would put the piece in contradiction with its own printed text.
  //
  // WHAT THE TOGGLE IS INSTEAD, and the first design for it was wrong. The obvious move --
  // rescale each destination against the selected metro's own outflow -- changes nothing a
  // reader can see: dividing all twenty-nine marks by one constant is a uniform zoom, and the
  // compass already self-normalises, so switching metros is already comparable.
  //
  // The size channel only hides something ON THE RESTING MAP, where a disc is that metro's
  // absolute outflow and New York therefore dwarfs Cincinnati. So the second view REMOVES THE
  // SIZE CHANNEL: every metro is drawn at one radius and the only thing left varying is the
  // hole. Thirty rings the same size, thirty different holes, directly comparable -- which is
  // the job per capita was wanted for, done without a denominator this package does not have.
  //
  // A constant radius encodes nothing, and the hole is the same ratio of the same two published
  // cells it always was. Nothing new is drawn and nothing at all is printed.
  const EQUAL_R = 30.0;
  let equalised = false;
  const restGeom = new Map<string, { r: number; hole: number }>();
  svg.querySelectorAll<SVGGElement>('g[data-metro]').forEach((g) => {
    const outer = g.querySelector('circle');
    const hole = g.querySelector('[data-hole]');
    if (!outer || !hole) return;
    restGeom.set(g.dataset.metro!, {
      r: Number(outer.getAttribute('r')),
      hole: Number(hole.getAttribute('r')),
    });
  });

  function applyView() {
    svg.querySelectorAll<SVGGElement>('g[data-metro]').forEach((g) => {
      const base = restGeom.get(g.dataset.metro!);
      const outer = g.querySelector('circle');
      const hole = g.querySelector('[data-hole]');
      if (!base || !outer || !hole) return;
      // The hole keeps its own share of whatever radius the ring is drawn at: the same ratio in
      // both views, and only the ring it sits in changes.
      const share = base.r ? base.hole / base.r : 0;
      const r = equalised ? EQUAL_R : base.r;
      outer.setAttribute('r', r.toFixed(2));
      hole.setAttribute('r', (r * share).toFixed(2));
    });
  }

  const viewToggle = el<HTMLInputElement>('#equalise');
  if (viewToggle) {
    viewToggle.addEventListener('change', () => {
      equalised = viewToggle.checked;
      field.classList.toggle('equalised', equalised);
      applyView();
    });
  }

  // ── selection ────────────────────────────────────────────────────────────────

  const panels = new Map<string, HTMLElement>();
  document.querySelectorAll<HTMLElement>('[data-metro-panel]').forEach((p) => {
    panels.set(p.dataset.metroPanel!, p);
    p.hidden = true;
  });

  const resetOpt = picker?.querySelector('option[value=""]') as HTMLOptionElement | null;
  const RESET_TEXT = resetOpt?.textContent || '';
  const CHOOSE_TEXT = document.querySelector('label[for="metroPick"]')?.textContent || RESET_TEXT;

  let selected: string | null = null;
  let lit: Element[] = [];

  function lightCrowd(cbsa: string | null) {
    lit.forEach((n) => n.classList.remove('lit'));
    lit = [];
    if (!cbsa) {
      field.classList.remove('focused');
      return;
    }
    field.classList.add('focused');
    lit = [...field.querySelectorAll(`[data-dest="${cbsa}"], [data-origin="${cbsa}"], [data-metro="${cbsa}"]`)];
    lit.forEach((n) => n.classList.add('lit'));
  }

  function select(cbsa: string | null) {
    selected = cbsa;
    // The preview class outlived its own hover. Both hover guards bail once something is
    // selected, and this function never cleared the class — so the ordinary mouse path
    // (hover a badge, click it, move away) left `previewing` set forever, and because
    // `.field.previewing [data-origin]` follows `.field.focused [data-origin]` at equal
    // specificity it WON: the isolation the whole interaction depends on silently did not
    // happen, and after a reset the resting crowd stayed at half opacity for the rest of the
    // session. Every gate screenshot missed it because they were synthetic clicks with no
    // hover in front of them.
    field.classList.remove('previewing');
    panels.forEach((p, key) => {
      p.hidden = key !== cbsa;
    });
    if (atRest) atRest.hidden = cbsa !== null;
    lightCrowd(cbsa);
    if (cbsa) drawLines(cbsa, 1);
    else clearLines();
    // The phone's stage. Drawn for every selection regardless of viewport -- CSS decides which
    // stage is visible, so a rotation from portrait to landscape never finds an empty one.
    if (compassHost) {
      drawCompass(compassHost, { metros: data.compass, hues: data.hues, names: data.names }, cbsa);
      compassHost.setAttribute('aria-hidden', String(cbsa === null));
    }
    svg.querySelectorAll('g[data-metro]').forEach((g) => {
      const on = (g as SVGGElement).dataset.metro === cbsa;
      g.classList.toggle('sel', on);
      g.setAttribute('aria-pressed', String(on));
    });
    if (picker && picker.value !== (cbsa ?? '')) picker.value = cbsa ?? '';
    // The reset option is the only visible text on the control at rest, and "Show every metro"
    // read as a filter that was already off — an instruction arguing against being touched.
    // It is only true once something is chosen.
    if (resetOpt) resetOpt.textContent = cbsa ? RESET_TEXT : CHOOSE_TEXT;
    if (live) {
      const p = cbsa ? panels.get(cbsa) : null;
      // Cleared first, so re-selecting the same metro still announces.
      live.textContent = '';
      live.textContent = p ? p.dataset.announce || '' : atRest?.textContent || '';
    }
  }

  // ── the badges become the control ────────────────────────────────────────────
  // The crowd's own landmarks are the selector. A transparent disc goes over each badge so
  // the target is finger-sized on a phone without changing what is drawn.
  let downX = 0;
  let downY = 0;
  let tapping = false;

  svg.querySelectorAll<SVGGElement>('g[data-metro]').forEach((g) => {
    const cbsa = g.dataset.metro!;
    const h = hub.get(cbsa);
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', data.aria[cbsa] ?? '');
    g.setAttribute('aria-pressed', 'false');
    g.setAttribute('class', 'badge');
    if (h) {
      const hit = document.createElementNS(SVG_NS, 'circle');
      hit.setAttribute('cx', String(h.x));
      hit.setAttribute('cy', String(h.y));
      hit.setAttribute('r', String(Math.max(h.r, 21)));
      hit.setAttribute('fill', 'transparent');
      hit.setAttribute('class', 'hit');
      g.appendChild(hit);
    }

    // WebKit swallows the first tap's click on any mark whose mouseenter mutates the DOM,
    // so a coarse pointer selects on pointerup with a movement guard; the mouse keeps click.
    g.addEventListener('click', () => select(cbsa));
    g.addEventListener('pointerdown', (e) => {
      downX = e.clientX;
      downY = e.clientY;
      tapping = e.pointerType !== 'mouse';
    });
    g.addEventListener('pointercancel', () => {
      tapping = false;
    });
    g.addEventListener('pointerup', (e) => {
      if (!tapping) return;
      tapping = false;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 10) return;
      select(cbsa);
    });
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        select(cbsa);
      }
    });
    // The preview is what tells a reader the picture answers to them before they commit to
    // a click. Hover only: a coarse pointer has no hover, and a tap goes straight through.
    // 0.7, not 0.42. The preview is the moment a reader learns the picture answers to them,
    // and at 0.42 — compounding with the old gradient's 0.1 lead-in — the value-carrying end
    // of every ribbon landed at 3.8% alpha, so the discovery frame was the faintest image on
    // the page.
    g.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || selected) return;
      field.classList.add('previewing');
      drawLines(cbsa, 0.7);
    });
    g.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      field.classList.remove('previewing');
      if (!selected) clearLines();
    });
    g.addEventListener('focus', () => {
      if (selected) return;
      field.classList.add('previewing');
      drawLines(cbsa, 0.7);
    });
    g.addEventListener('blur', () => {
      field.classList.remove('previewing');
      if (!selected) clearLines();
    });
  });

  // Anywhere on the plate that is not a metro is the way back to the whole crowd.
  svg.addEventListener('pointerup', (e) => {
    if (!(e.target as Element).closest?.('g[data-metro]')) select(null);
  });
  // …and so is Escape, which was the only way out a keyboard had none of.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && selected) select(null);
  });

  picker?.addEventListener('change', () => select(picker.value || null));

  const initial = decodeURIComponent(location.hash.replace('#', ''));
  if (initial && panels.has(initial)) select(initial);
  else select(null);
}
