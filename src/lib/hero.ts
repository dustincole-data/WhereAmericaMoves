// The mark, drawn — and the one place motion lives.
//
// WHAT THIS REPLACES. Rounds 1–4 were one crowd of 863 marks with lines drawn on selection.
// That route was rejected four times on one axis, and 13 ruled the replacement on
// 2026-08-07: thirty clusters of dots, laid out in the rough shape of the country on a wide
// screen and on a four-column grid on a phone, every one of them re-forming to its own
// exchange with whichever metro the reader chooses. `compass.ts`, `plate.ts` and the baked
// field plate go with the mark they served.
//
// WHY A CANVAS AND NOT SVG. A selection re-forms up to ~4,000 dots at once, and each one
// moves, resizes and changes hue on the way. Thirty animated `<g>` transforms would have
// been cheap, but scaling a group scales its dots with it — and the dot is the unit, so a
// transition that changes the dot's size is a transition that changes what a dot means,
// even if only for 700ms. On a canvas every dot keeps exactly its own radius the whole way
// across, and the frame costs ~600 fills instead of 4,000 element mutations.
//
// THE COST IS STATED RATHER THAN HIDDEN: with JavaScript off, the mark does not draw. What
// still renders is the whole record — headline, standfirst, the claim register, all thirty
// readouts, the beats, the limits and the footer — and the thirty landmarks remain real
// focusable buttons in the overlay, so a keyboard and a screen reader reach every metro
// whether or not a pixel of the picture arrived.
//
// EVERY STRING IS SERVER-RENDERED. This module constructs no copy at all: it moves text
// nodes the page already wrote and toggles the visibility of readouts that are already in
// dist, so the caption lint's dist→ledger backstop reads the real text and there is no
// client template that could put a figure on screen behind the ledger's back. The canvas
// draws no text of any kind.

import {
  BANDS,
  PHONE,
  RAMP_STOPS,
  WIDE,
  bandOf,
  bucketOf,
  cutBands,
  dotAt,
  hexToRgb,
  quadPoint,
  radiusFor,
  threadControl,
  type Mode,
} from './clusters';

interface ViewData {
  n: number[];
  pole: number[];
  cut: number[];
}

interface Payload {
  codes: string[];
  views: Record<string, ViewData>;
  wpos: Record<string, number[]>;
  ppos: number[];
  hues: Record<string, string>;
  /** the thirty share pages open pre-selected and without controls */
  focus: string | null;
}

const el = <T extends Element>(sel: string) => document.querySelector(sel) as T | null;

const stage = el<HTMLElement>('#stage');
const canvas = el<HTMLCanvasElement>('#dots');
const over = el<SVGSVGElement>('#over');
const payloadEl = el<HTMLScriptElement>('#hero-data');

if (stage && canvas && over && payloadEl) {
  const D: Payload = JSON.parse(payloadEl.textContent || '{}');
  const ctx = canvas.getContext('2d')!;
  const picker = el<HTMLSelectElement>('#metroPick');
  const atRest = el<HTMLElement>('#atrest');
  const onSel = el<HTMLElement>('#onsel');
  const live = el<HTMLElement>('#live');
  const sourceTag = el<SVGTextElement>('#sourcetag');

  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
  const NARROW = matchMedia('(max-width: 720px)');

  const RGB = BANDS.map((ramp) => ramp.map(hexToRgb));
  const INK = hexToRgb('#15181d');

  // ── one view, resolved into geometry ─────────────────────────────────────────

  interface Cluster {
    x: number;
    y: number;
    r: number;
    n: number;
    pole: number;
    xs: Float32Array;
    ys: Float32Array;
    /** band × stops + stop, per dot */
    bucket: Uint8Array;
  }

  const cache = new Map<string, Cluster[]>();

  function frame(key: string, m: Mode): Cluster[] {
    const ck = `${key}|${m.w}`;
    const hit = cache.get(ck);
    if (hit) return hit;

    const v = D.views[key];
    const pos = m === PHONE ? D.ppos : D.wpos[key];
    const out: Cluster[] = D.codes.map((code, i) => {
      const x = pos[i * 2];
      const y = pos[i * 2 + 1];
      const n = v.n[i];
      const pole = v.pole[i];
      const r = n > 0 ? radiusFor(n, m) : 0;
      const xs = new Float32Array(n);
      const ys = new Float32Array(n);
      const fr = new Float32Array(n);
      for (let k = 0; k < n; k++) {
        const [px, py, frac] = dotAt(k, n, x, y, r);
        xs[k] = px;
        ys[k] = py;
        fr[k] = frac;
      }
      // The resting view cuts each cluster into its own arrived and left cells, and the
      // boundary is decided by POSITION so it comes out a straight edge. See clusters.ts.
      const bands = pole === 3 ? cutBands(ys, n, v.cut[i]) : null;
      const bucket = new Uint8Array(n);
      for (let k = 0; k < n; k++) bucket[k] = bucketOf(bands ? bands[k] : bandOf(pole), fr[k]);
      return { x, y, r, n, pole, xs, ys, bucket };
    });
    cache.set(ck, out);
    return out;
  }

  // ── the morph ────────────────────────────────────────────────────────────────
  //
  // A dot that exists in both views travels between its two places. One that only exists in
  // the view being left shrinks into its own cluster's centre; one that only exists in the
  // view being entered grows out of it. NOTHING FADES: alpha would have put a half-strength
  // dot on screen, and a dot at half strength is not half a dot of anybody. The radius does
  // the appearing, so every dot drawn at full strength is a whole one.

  interface Group {
    ci: number;
    from: [number, number, number];
    to: [number, number, number];
    /** x0,y0,r0,x1,y1,r1 per dot */
    d: Float32Array;
  }

  const DUR = 780;
  const WAVE = 300;

  let cur = D.focus ?? 'rest';
  let from: Cluster[] = frame(cur, mode());
  let to: Cluster[] = from;
  let groups: Group[] = [];
  let delay: number[] = D.codes.map(() => 0);
  let t0 = 0;
  let running = false;

  function mode(): Mode {
    return NARROW.matches ? PHONE : WIDE;
  }

  function colourOf(bucket: number): [number, number, number] {
    return RGB[Math.floor(bucket / RAMP_STOPS)][bucket % RAMP_STOPS];
  }

  function buildGroups(a: Cluster[], b: Cluster[], m: Mode): Group[] {
    const dr = m.dotR;
    const out: Group[] = [];
    for (let ci = 0; ci < a.length; ci++) {
      const A = a[ci];
      const B = b[ci];
      const N = Math.max(A.n, B.n);
      if (N === 0) continue;
      // Bucketed by the PAIR of colours a dot travels between, so one fill serves every dot
      // that shares a journey. A cluster crossing from a cut to a single pole has at most
      // two source bands and one destination band, which is ten paths rather than N.
      const bins = new Map<number, number[]>();
      for (let k = 0; k < N; k++) {
        const bf = k < A.n ? A.bucket[k] : B.bucket[k];
        const bt = k < B.n ? B.bucket[k] : A.bucket[k];
        const key = bf * 32 + bt;
        const list = bins.get(key);
        if (list) list.push(k);
        else bins.set(key, [k]);
      }
      for (const [key, ks] of bins) {
        const d = new Float32Array(ks.length * 6);
        ks.forEach((k, j) => {
          const o = j * 6;
          if (k < A.n) {
            d[o] = A.xs[k];
            d[o + 1] = A.ys[k];
            d[o + 2] = dr;
          } else {
            d[o] = A.x;
            d[o + 1] = A.y;
            d[o + 2] = 0;
          }
          if (k < B.n) {
            d[o + 3] = B.xs[k];
            d[o + 4] = B.ys[k];
            d[o + 5] = dr;
          } else {
            d[o + 3] = B.x;
            d[o + 4] = B.y;
            d[o + 5] = 0;
          }
        });
        out.push({ ci, from: colourOf(Math.floor(key / 32)), to: colourOf(key % 32), d });
      }
    }
    return out;
  }

  /** The wave. Clusters do not all re-form at once: the ones nearest whatever the reader
      just touched go first and the far coast follows, which is the difference between a
      picture updating and a picture answering. */
  function buildDelay(anchor: number, pts: Cluster[]): number[] {
    const ax = pts[anchor]?.x ?? 0;
    const ay = pts[anchor]?.y ?? 0;
    const ds = pts.map((c) => Math.hypot(c.x - ax, c.y - ay));
    const mx = Math.max(...ds, 1);
    return ds.map((d) => (d / mx) * WAVE);
  }

  const ease = (t: number) => 1 - Math.pow(1 - t, 3);

  // ── the frame the canvas actually paints ─────────────────────────────────────

  let scale = 1;
  let ox = 0;
  let oy = 0;
  /** the label's size in USER UNITS, derived so it renders at a fixed number of real pixels */
  let labelUnits = WIDE.labelSize;

  /** A NAME IS TYPE, NOT GEOMETRY, so it does not scale with the mark. Setting the label in
      user units is what put the phone's names at 4px: the drawing box is three times the
      screen there, so every unit of type shrinks to a third of itself. These are the sizes
      the reader actually gets, and the slot search is run in units converted back from them. */
  const LABEL_PX = 13;
  const LABEL_PX_NARROW = 11;

  function fit() {
    const m = mode();
    const box = stage!.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas!.width = Math.round(box.width * dpr);
    canvas!.height = Math.round(box.height * dpr);
    canvas!.style.width = `${box.width}px`;
    canvas!.style.height = `${box.height}px`;
    // THE OVERLAY'S BOX IS THE CANVAS'S BOX. It has to be set here rather than in the
    // stylesheet, because the two modes draw into different boxes and a viewBox is not a
    // CSS property — leaving it at the wide box on a phone renders the whole overlay at a
    // third scale over a canvas drawn at full size, which is every label in the wrong place
    // and at 4px.
    over!.setAttribute('viewBox', `0 0 ${m.w} ${m.h}`);
    // Exactly what `preserveAspectRatio="xMidYMid meet"` does to the overlay above it, so a
    // label and the cluster it names cannot disagree by a pixel.
    scale = Math.min(box.width / m.w, box.height / m.h);
    ox = (box.width - m.w * scale) / 2;
    oy = (box.height - m.h * scale) / 2;
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);

    labelUnits = (NARROW.matches ? LABEL_PX_NARROW : LABEL_PX) / (scale || 1);
    over!.style.fontSize = `${labelUnits.toFixed(2)}px`;
    over!.style.strokeWidth = `${(labelUnits * 0.24).toFixed(2)}px`;
  }

  function glyphs(f: Cluster[], key: string, m: Mode, alpha: number, t: number) {
    if (alpha <= 0.01) return;
    const v = D.views[key];
    const sel = key === 'rest' ? null : key;
    const si = sel ? D.codes.indexOf(sel) : -1;

    // The threads, under everything, growing out of the source as the clusters land.
    if (si >= 0) {
      const s = f[si];
      const nmax = Math.max(...v.n, 1);
      const p = Math.max(0, Math.min(1, (t - 0.2) / 0.8));
      if (p > 0) {
        ctx.lineCap = 'round';
        for (let i = 0; i < f.length; i++) {
          if (i === si || v.pole[i] === 2 || v.n[i] <= 0) continue;
          const c = f[i];
          const [qx, qy] = threadControl(s.x, s.y, c.x, c.y);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          const STEP = 16;
          for (let k = 1; k <= STEP; k++) {
            const [px, py] = quadPoint(s.x, s.y, qx, qy, c.x, c.y, (k / STEP) * p);
            ctx.lineTo(px, py);
          }
          const rgb = RGB[v.pole[i] === 1 ? 0 : 1][1];
          ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(0.36 * alpha).toFixed(3)})`;
          ctx.lineWidth = 0.5 + (m === PHONE ? 5 : 8) * (v.n[i] / nmax);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < f.length; i++) {
      const c = f[i];
      const pole = v.pole[i];

      if (i === si) {
        // THE SOURCE IS A FIXED RING. It is the thing every other cluster is measured from,
        // so its area must assert nothing — drawing it at its own gross movement put two
        // different meanings on one plate.
        const hue = D.hues[D.codes[i]] || '#15181d';
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = hue;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(c.x, c.y, m.sourceR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.12;
        ctx.fillStyle = hue;
        ctx.fill();
        ctx.globalAlpha = 1;
        continue;
      }

      if (pole === 2) {
        // AN ABSENCE, DRAWN AND NEVER DELETED. One direction of this pair is undisclosed, so
        // the net does not exist — an empty dashed ring, never a zero, because a zero would
        // assert a balance nobody measured. Baltimore draws three of these; New York draws
        // none, which is why a check run only on New York proved nothing about this branch.
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#5c6068';
        ctx.lineWidth = 1.1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(c.x, c.y, m.absentR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        continue;
      }

      if (pole === 0 && c.n <= 0) {
        // A MEASURED ZERO IS NOT AN ABSENCE. As many people came as went, both directions
        // disclosed. It gets a fixed neutral dot — a glyph, not a quantity — because zero
        // dots would read as nothing measured and one dot would claim a difference.
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#5c6068';
        ctx.beginPath();
        ctx.arc(c.x, c.y, m.evenR, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        continue;
      }

      // The halfway datum. The cut travels only about 0.29 of the cluster's radius across
      // the thirty, so it is judged against a line rather than estimated as an area.
      if (pole === 3 && c.r > 6) {
        ctx.globalAlpha = alpha * 0.5;
        ctx.strokeStyle = `rgb(${INK[0]},${INK[1]},${INK[2]})`;
        ctx.lineWidth = 0.7;
        ctx.setLineDash([2.5, 2.5]);
        ctx.beginPath();
        ctx.moveTo(c.x - c.r - 2, c.y);
        ctx.lineTo(c.x + c.r + 2, c.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
    }
  }

  function paint(now: number) {
    const m = mode();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas!.width, canvas!.height);
    ctx.restore();

    let global = 1;
    if (running) {
      const raw = (now - t0) / (DUR + WAVE);
      global = Math.max(0, Math.min(1, raw));
      if (raw >= 1) running = false;
    }

    glyphs(from, prevKey, m, 1 - global, 1 - global);
    glyphs(to, cur, m, global, global);

    for (const g of groups) {
      const t = ease(Math.max(0, Math.min(1, (now - t0 - delay[g.ci]) / DUR)));
      const r = Math.round(g.from[0] + (g.to[0] - g.from[0]) * t);
      const gg = Math.round(g.from[1] + (g.to[1] - g.from[1]) * t);
      const b = Math.round(g.from[2] + (g.to[2] - g.from[2]) * t);
      ctx.fillStyle = `rgb(${r},${gg},${b})`;
      ctx.beginPath();
      const d = g.d;
      for (let o = 0; o < d.length; o += 6) {
        const x = d[o] + (d[o + 3] - d[o]) * t;
        const y = d[o + 1] + (d[o + 4] - d[o + 1]) * t;
        const rr = d[o + 2] + (d[o + 5] - d[o + 2]) * t;
        if (rr <= 0.02) continue;
        ctx.moveTo(x + rr, y);
        ctx.arc(x, y, rr, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    if (running) requestAnimationFrame(paint);
  }

  let prevKey = cur;

  function render(animate: boolean) {
    const m = mode();
    fit();
    to = frame(cur, m);
    from = animate ? from : to;
    groups = buildGroups(from, to, m);
    const anchor = D.codes.indexOf(cur === 'rest' ? prevKey : cur);
    delay = buildDelay(anchor >= 0 ? anchor : 0, to);
    if (!animate || REDUCED.matches) {
      from = to;
      groups = buildGroups(to, to, m);
      delay = delay.map(() => 0);
      running = false;
      t0 = performance.now() - (DUR + WAVE);
      paint(performance.now());
    } else {
      t0 = performance.now();
      running = true;
      requestAnimationFrame(paint);
    }
    placeLabels(m);
  }

  // ── the names ────────────────────────────────────────────────────────────────
  //
  // Placed in the browser against measured text, not against an approximation. 09 round 3
  // recorded why: a plate that sizes a container from a per-character font metric cannot
  // certify the page's fit, and only the browser can close it. Four slots are tried; a name
  // that clears none of them still ships — it takes a ground-coloured halo and sits over the
  // mark, because "you can't even read the metros" is the objection this whole form exists
  // to answer and dropping three names is not an answer to it.

  const labels = [...over!.querySelectorAll<SVGTextElement>('text[data-label]')];
  const hits = [...over!.querySelectorAll<SVGGElement>('g[data-metro]')];
  const keys = [...over!.querySelectorAll<SVGGElement>('g[data-metro-key]')];
  const meas = document.createElement('canvas').getContext('2d')!;

  function placeLabels(m: Mode) {
    const cs = getComputedStyle(over!);
    const fs = labelUnits;
    meas.font = `500 ${fs}px ${cs.fontFamily}`;
    /** a control has to clear 24×24 of REAL pixels, so the floor is converted back to units */
    const hitFloor = 13 / (scale || 1);
    const boxes: [number, number, number, number][] = [];
    const discs = to.map((c, i) => {
      const v = D.views[cur];
      const r =
        D.codes[i] === cur
          ? m.sourceR
          : v.pole[i] === 2
            ? m.absentR
            : v.n[i] <= 0
              ? m.evenR
              : Math.max(c.r, 3);
      return { x: c.x, y: c.y, r };
    });

    labels.forEach((node, i) => {
      const d = discs[i];
      const w = meas.measureText(node.textContent || '').width;
      const h = fs;
      const slots: [number, number, string][] = [
        [d.x, d.y + d.r + h + 2, 'middle'],
        [d.x, d.y - d.r - 5, 'middle'],
        [d.x + d.r + 6, d.y + h * 0.34, 'start'],
        [d.x - d.r - 6, d.y + h * 0.34, 'end'],
        [d.x, d.y + d.r + h * 2.2, 'middle'],
      ];
      let best: [number, number, string, [number, number, number, number]] | null = null;
      for (const [tx, ty, anchor] of slots) {
        const x0 = anchor === 'start' ? tx : anchor === 'end' ? tx - w : tx - w / 2;
        const box: [number, number, number, number] = [x0 - 2, ty - h, x0 + w + 2, ty + 3];
        if (box[0] < 2 || box[2] > m.w - 2 || box[3] > m.h - 2 || box[1] < 2) continue;
        let clash = false;
        for (const c of discs) {
          const nx = Math.min(Math.max(c.x, box[0]), box[2]);
          const ny = Math.min(Math.max(c.y, box[1]), box[3]);
          if (Math.hypot(c.x - nx, c.y - ny) < c.r - 1) {
            clash = true;
            break;
          }
        }
        if (!clash) {
          for (const p of boxes) {
            if (!(box[2] < p[0] || box[0] > p[2] || box[3] < p[1] || box[1] > p[3])) {
              clash = true;
              break;
            }
          }
        }
        if (!clash) {
          best = [tx, ty, anchor, box];
          break;
        }
      }
      const [tx, ty, anchor, box] = best ?? [
        d.x,
        d.y + d.r + h + 2,
        'middle',
        [d.x - w / 2 - 2, d.y + d.r + 2, d.x + w / 2 + 2, d.y + d.r + h + 5] as [number, number, number, number],
      ];
      boxes.push(box);
      node.setAttribute('text-anchor', anchor);
      node.setAttribute('transform', `translate(${tx.toFixed(1)},${ty.toFixed(1)})`);
      node.classList.toggle('strong', D.codes[i] === cur);
      node.classList.toggle('quiet', cur !== 'rest' && D.codes[i] !== cur);
    });

    hits.forEach((g, i) => {
      const d = discs[i];
      const c = g.querySelector('circle')!;
      c.setAttribute('r', Math.max(d.r, hitFloor).toFixed(1));
      g.setAttribute('transform', `translate(${d.x.toFixed(1)},${d.y.toFixed(1)})`);
    });

    if (sourceTag) {
      const si = D.codes.indexOf(cur);
      sourceTag.style.display = si >= 0 ? '' : 'none';
      if (si >= 0) sourceTag.setAttribute('transform', `translate(${to[si].x.toFixed(1)},${(to[si].y + 4).toFixed(1)})`);
    }

    // The key sits in the box's own corner, in the same user units as the names, so
    // it renders at the same real pixel size at every viewport — same trick as
    // `labelUnits` itself. The corner is inside a relaxed layout, so whichever
    // cluster the relaxation lands there varies by selection — the background is
    // sized to the visible key's own measured box, not guessed, so it stays legible
    // over whatever ends up underneath it.
    const kx = m.pad;
    const ky = m.top + fs * 1.1;
    const keyPad = fs * 0.35;
    keys.forEach((g) => {
      g.setAttribute('transform', `translate(${kx.toFixed(1)},${ky.toFixed(1)})`);
      if (g.hasAttribute('hidden')) return;
      const text = g.querySelector('text')!;
      const rect = g.querySelector('rect')!;
      const b = text.getBBox();
      rect.setAttribute('x', (b.x - keyPad).toFixed(1));
      rect.setAttribute('y', (b.y - keyPad).toFixed(1));
      rect.setAttribute('width', (b.width + keyPad * 2).toFixed(1));
      rect.setAttribute('height', (b.height + keyPad * 2).toFixed(1));
      rect.setAttribute('rx', (keyPad * 0.6).toFixed(1));
    });
  }

  // ── selection ────────────────────────────────────────────────────────────────

  const panels = new Map<string, HTMLElement>();
  document.querySelectorAll<HTMLElement>('[data-metro-panel]').forEach((p) => {
    panels.set(p.dataset.metroPanel!, p);
    p.hidden = p.dataset.metroPanel !== D.focus;
  });
  keys.forEach((t) => {
    t.toggleAttribute('hidden', t.dataset.metroKey !== D.focus);
  });

  function select(cbsa: string | null) {
    const key = cbsa ?? 'rest';
    if (key === cur) return;
    prevKey = cur;
    cur = key;
    from = frame(prevKey, mode());
    panels.forEach((p, k) => {
      p.hidden = k !== cbsa;
    });
    keys.forEach((t) => {
      t.toggleAttribute('hidden', t.dataset.metroKey !== cbsa);
    });
    if (atRest) atRest.hidden = cbsa !== null;
    if (onSel) onSel.hidden = cbsa === null;
    hits.forEach((g) => {
      const on = g.dataset.metro === cbsa;
      g.classList.toggle('sel', on);
      g.setAttribute('aria-pressed', String(on));
    });
    if (picker && picker.value !== (cbsa ?? '')) picker.value = cbsa ?? '';
    over!.classList.toggle('focused', cbsa !== null);
    render(true);
    if (live) {
      const p = cbsa ? panels.get(cbsa) : null;
      live.textContent = '';
      live.textContent = p ? p.dataset.announce || '' : atRest?.textContent || '';
    }
  }

  if (D.focus === null) {
    let downX = 0;
    let downY = 0;
    let tapping = false;
    hits.forEach((g) => {
      const cbsa = g.dataset.metro!;
      // WebKit swallows the first tap's click on a mark whose pointer handling mutates the
      // DOM, so a coarse pointer selects on pointerup behind a movement guard; the mouse
      // keeps click. pointercancel is what replaces pointerleave on touch.
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
    });

    over!.addEventListener('pointerup', (e) => {
      if (!(e.target as Element).closest?.('g[data-metro]')) select(null);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && cur !== 'rest') select(null);
    });
    picker?.addEventListener('change', () => select(picker.value || null));
  }

  // ── the box the mark lives in ────────────────────────────────────────────────
  // A canvas fixed to its container must refresh from the container's own box, not from a
  // window resize: a phone collapsing its URL bar changes the box without firing one.
  //
  // AND IT MUST NOT CANCEL A TRANSITION IT DID NOT CAUSE. The observer fires on every
  // layout pass, and the naive handler re-rendered without animation each time — so the
  // band growing by seven pixels when a readout appeared silently killed the re-form that
  // the same click had just started. The mark looked like it was snapping instead of
  // moving, and nothing in the code said so. Geometry is in viewBox units, so a box change
  // mid-flight only needs a new transform, not a new frame.
  let lastW = -1;
  let lastH = -1;
  new ResizeObserver(() => {
    const box = stage!.getBoundingClientRect();
    if (Math.abs(box.width - lastW) < 0.5 && Math.abs(box.height - lastH) < 0.5) return;
    lastW = box.width;
    lastH = box.height;
    if (running) {
      fit();
      placeLabels(mode());
    } else {
      render(false);
    }
  }).observe(stage);
  NARROW.addEventListener('change', () => {
    cache.clear();
    render(false);
  });

  const initial = decodeURIComponent(location.hash.replace('#', ''));
  if (D.focus === null && initial && panels.has(initial)) {
    cur = initial;
    prevKey = 'rest';
    from = frame('rest', mode());
    panels.forEach((p, k) => {
      p.hidden = k !== initial;
    });
    keys.forEach((t) => {
      t.toggleAttribute('hidden', t.dataset.metroKey !== initial);
    });
    if (atRest) atRest.hidden = true;
    if (onSel) onSel.hidden = false;
    if (picker) picker.value = initial;
    over.classList.add('focused');
    hits.forEach((g) => {
      const on = g.dataset.metro === initial;
      g.classList.toggle('sel', on);
      g.setAttribute('aria-pressed', String(on));
    });
  }

  // Fonts land after the first frame and every label was measured against a fallback until
  // they do, so the placement is run again once the real Archivo is in.
  render(false);
  if ('fonts' in document) document.fonts.ready.then(() => placeLabels(mode()));
}
