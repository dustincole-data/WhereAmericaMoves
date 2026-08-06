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

interface Hub {
  cbsa: string;
  x: number;
  y: number;
  r: number;
}

interface Payload {
  viewBox: [number, number, number, number];
  hubs: Hub[];
  hues: Record<string, { hub: string; read: string; wash: string }>;
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
    what "can't see where they are going" was pointing at in round 2b. */
const HEAD_W = 0.9;
const MAX_W = 15;
const MIN_W = 1.4;

const el = <T extends Element>(sel: string) => document.querySelector(sel) as T | null;

const field = el<HTMLElement>('#field');
const payloadEl = el<HTMLScriptElement>('#hero-data');
const picker = el<HTMLSelectElement>('#metroPick');
const atRest = el<HTMLElement>('#atrest');
const live = el<HTMLElement>('#live');

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

  const width = (people: number) => MIN_W + Math.sqrt(people / maxPeople) * (MAX_W - MIN_W);

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
    const ux = dx / len;
    const uy = dy / len;
    x0 += ux * trim0;
    y0 += uy * trim0;
    x1 -= ux * trim1;
    y1 -= uy * trim1;
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
      const h = (w0 + (HEAD_W - w0) * t) / 2;
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
    // Transparent at the fat end, so a heavy line does not read as a wedge of ink parked on
    // its own hub, and the two hues meet where the eye is already travelling.
    for (const [off, col, op] of [
      [0, from, 0.1],
      [0.32, from, 1],
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
    for (const [o, v] of into.get(cbsa) ?? []) {
      const h = hub.get(o);
      if (!h) continue;
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', curve(h.x, h.y, h0.x, h0.y, h.r + 1, h0.r + 1));
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', data.hues[o]?.wash ?? '#9aa0aa');
      p.setAttribute('stroke-width', (0.5 + Math.sqrt(v / maxPeople) * 2.6).toFixed(2));
      p.setAttribute('stroke-opacity', String(0.5 * weight));
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
    for (const [list, outward] of [
      [absentOut.get(cbsa) ?? [], true],
      [absentIn.get(cbsa) ?? [], false],
    ] as [string[], boolean][]) {
      for (const other of list) {
        const h = hub.get(other);
        if (!h) continue;
        const [a, b] = outward ? [h0, h] : [h, h0];
        const p = document.createElementNS(SVG_NS, 'path');
        p.setAttribute('d', curve(a.x, a.y, b.x, b.y, a.r + 1, b.r + 5));
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', 'var(--ink-2)');
        p.setAttribute('stroke-width', '1');
        p.setAttribute('stroke-dasharray', '3 4');
        p.setAttribute('stroke-opacity', String(0.85 * weight));
        p.setAttribute('class', 'ln-absent');
        gLines.appendChild(p);
        const ring = document.createElementNS(SVG_NS, 'circle');
        ring.setAttribute('cx', String(b.x));
        ring.setAttribute('cy', String(b.y));
        ring.setAttribute('r', String(b.r + 4.5));
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', 'var(--ink-2)');
        ring.setAttribute('stroke-width', '1');
        ring.setAttribute('stroke-dasharray', '3 4');
        ring.setAttribute('stroke-opacity', String(0.85 * weight));
        ring.setAttribute('class', 'ln-absent');
        gLines.appendChild(ring);
      }
    }
  }

  // ── selection ────────────────────────────────────────────────────────────────

  const panels = new Map<string, HTMLElement>();
  document.querySelectorAll<HTMLElement>('[data-metro-panel]').forEach((p) => {
    panels.set(p.dataset.metroPanel!, p);
    p.hidden = true;
  });

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
    panels.forEach((p, key) => {
      p.hidden = key !== cbsa;
    });
    if (atRest) atRest.hidden = cbsa !== null;
    lightCrowd(cbsa);
    if (cbsa) drawLines(cbsa, 1);
    else clearLines();
    svg.querySelectorAll('g[data-metro]').forEach((g) => {
      g.classList.toggle('sel', (g as SVGGElement).dataset.metro === cbsa);
    });
    if (picker && picker.value !== (cbsa ?? '')) picker.value = cbsa ?? '';
    if (live) {
      const p = cbsa ? panels.get(cbsa) : null;
      live.textContent = p ? p.querySelector('h2')?.textContent || '' : atRest?.textContent || '';
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
    g.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || selected) return;
      field.classList.add('previewing');
      drawLines(cbsa, 0.42);
    });
    g.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse' || selected) return;
      field.classList.remove('previewing');
      clearLines();
    });
    g.addEventListener('focus', () => {
      if (selected) return;
      field.classList.add('previewing');
      drawLines(cbsa, 0.42);
    });
    g.addEventListener('blur', () => {
      if (selected) return;
      field.classList.remove('previewing');
      clearLines();
    });
  });

  // Anywhere on the plate that is not a metro is the way back to the whole crowd.
  svg.addEventListener('pointerup', (e) => {
    if (!(e.target as Element).closest?.('g[data-metro]')) select(null);
  });

  picker?.addEventListener('change', () => select(picker.value || null));

  const initial = decodeURIComponent(location.hash.replace('#', ''));
  if (initial && panels.has(initial)) select(initial);
  else select(null);
}
