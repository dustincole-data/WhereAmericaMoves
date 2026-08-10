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
  cubicAt,
  cutBands,
  dotAt,
  hexToRgb,
  quadPoint,
  radiusFor,
  routeOf,
  threadControl,
  type Mode,
  type Route,
} from './clusters';

interface ViewData {
  n: number[];
  pole: number[];
  cut: number[];
  /** dots enclosed by the dashed outer ring, beyond the body. Resting view only — see
      `field.ts`, which is the one place that decides what the ring is. */
  ring?: number[];
}

interface Payload {
  codes: string[];
  views: Record<string, ViewData>;
  /** one per metro, the same selections drawn on the per-1,000 rate; absent on the share
      pages, which carry no toggle */
  rates?: Record<string, ViewData>;
  /** ONE array — the clusters never move */
  wpos: number[];
  ppos: number[];
  outline: number[][][];
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

  /** THE OUTER RADIUS OF A CLUSTER, ring included. One function, because two things need the
      same answer and they are 300 lines apart: `glyphs` draws the ring, and `placeLabels`
      has to treat it as occupied or every name lands on top of one. Returns 0 when the view
      has no ring, which is every view but the resting one.

      `radiusFor(n)` gives a disc of area `n × dotArea`, so `radiusFor(n + ring)` gives a disc
      whose ANNULUS beyond the body is exactly `ring × dotArea`. The ring's ink is therefore
      the same people-per-unit-area as the dots it encloses, with no second scale to state. */
  function ringR(v: ViewData, i: number, m: Mode): number {
    const k = v.ring?.[i] ?? 0;
    if (k <= 0 || v.n[i] <= 0) return 0;
    return radiusFor(v.n[i] + k, m);
  }

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

  /** The metric is a choice between two pre-built sets of counts, not a computation: the
      rate view is derived at build from the same package cells and arrives as dots, so the
      client never divides anything by a population and no rate is ever a number here. */
  let metric: 'people' | 'rate' = 'people';
  const viewOf = (key: string): ViewData =>
    (metric === 'rate' && key !== 'rest' ? D.rates?.[key] : undefined) ?? D.views[key];

  function frame(key: string, m: Mode): Cluster[] {
    const ck = `${key}|${m.w}|${key === 'rest' ? 'p' : metric}`;
    const hit = cache.get(ck);
    if (hit) return hit;

    const v = viewOf(key);
    const pos = m === PHONE ? D.ppos : D.wpos;
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
    trail.width = canvas!.width;
    trail.height = canvas!.height;
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
    const v = viewOf(key);
    const sel = key === 'rest' ? null : key;
    const si = sel ? D.codes.indexOf(sel) : -1;

    // The threads, under everything, growing out of the source as the clusters land. THE
    // PHONE'S ONLY, now: on a wide screen the thread was replaced by the stream, which says
    // the same thing and carries the quantity in its width as well as its direction. The
    // phone draws thirty cells on a grid, where a stream would be a route between two
    // squares of a table and mean nothing, so the grid keeps the thread it was ruled with.
    if (si >= 0 && m === PHONE) {
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

      // THE WITHHELD MASS, ON THE CLUSTER THAT OWNS IT. What the claim register bar used to
      // say once, below the mark, about the country: this metro's own unattributable columns,
      // as an annulus at the body's own scale. Dashed, because dashed already means "the
      // record discloses nothing here" everywhere else on this page — the empty partner ring
      // uses the same 3/3 — so the absence reads without being keyed.
      //
      // Drawn BEFORE the datum below it and stroked from the ring's own radius, so it never
      // reads as a halo on the dots: the gap between the outermost dot and the dash is the
      // quantity.
      if (pole === 3) {
        const rr = ringR(v, i, m);
        if (rr > c.r + 1.2) {
          ctx.globalAlpha = alpha * 0.55;
          ctx.strokeStyle = '#5c6068';
          ctx.lineWidth = 0.9;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(c.x, c.y, rr, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
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

  // ── the coastline ────────────────────────────────────────────────────────────
  // Apparatus, one hairline, quieter than the lightest dot in either ramp. It exists so a
  // cluster's position reads as a place rather than as a diagram of one — the clusters now
  // sit at their true projected points, and without a coast a true point looks arbitrary.

  function coast(m: Mode) {
    if (m === PHONE || !D.outline?.length) return;
    ctx.strokeStyle = '#ded9d0';
    ctx.lineWidth = 1;
    for (const ring of D.outline) {
      ctx.beginPath();
      ctx.moveTo(ring[0][0], ring[0][1]);
      for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i][0], ring[i][1]);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // ── the streams ──────────────────────────────────────────────────────────────
  //
  // One per partner, and ITS DIRECTION IS THE SIGN OF THE NET: green and inbound where the
  // chosen metro gained from that partner, orange and outbound where it lost, and nothing at
  // all for a measured tie. The ribbon's width is that same net off the cluster's own scale,
  // so two streams are compared by looking at them — which is the long-unmet requirement
  // that the volume live in the mark rather than in a table beside it.
  //
  // The dots in flight are the cluster's own dots: one cycle sends exactly as many as the
  // cluster is made of, so the moving stream and the still body are one quantity twice.
  //
  // Trails live on their OWN layer, faded with `destination-out` each frame. Washing the
  // ground colour over everything instead ghosts the coastline and every static glyph, which
  // is the defect that made the first pass look like it was drawn on greaseproof paper.

  interface Stream {
    ci: number;
    n: number;
    band: 0 | 1;
    acc: number;
    rt: Route;
  }

  const CYCLE = 8;
  const CAP = 2200;
  const MAX_RIBBON = 26;

  const trail = document.createElement('canvas');
  const tctx = trail.getContext('2d')!;
  let streams: Stream[] = [];
  let travelers: { rt: Route; band: 0 | 1; t: number; sp: number }[] = [];
  let widthK = 0.05;
  let lastFrame = 0;
  let hover: string | null = null;

  function buildStreams(f: Cluster[], m: Mode) {
    streams = [];
    travelers = [];
    if (m !== WIDE || cur === 'rest') return;
    const v = viewOf(cur);
    const si = D.codes.indexOf(cur);
    if (si < 0) return;
    for (let i = 0; i < f.length; i++) {
      if (i === si || v.pole[i] === 2 || v.n[i] <= 0) continue;
      const gain = v.pole[i] === 1;
      const a = gain ? f[i] : f[si];
      const b = gain ? f[si] : f[i];
      streams.push({ ci: i, n: v.n[i], band: gain ? 0 : 1, acc: 0, rt: routeOf(a.x, a.y, b.x, b.y) });
    }
    widthK = MAX_RIBBON / Math.max(1, ...streams.map((s) => s.n));
  }

  /** Deliberately separate from drawing. rAF is throttled whenever the tab is not in front,
      so anything that samples this on a wall clock measures the throttle instead of the
      mark; `__sim` below drives the same function with a fixed step. */
  function advance(dt: number) {
    for (const s of streams) {
      s.acc += (s.n / CYCLE) * dt;
      while (s.acc >= 1 && travelers.length < CAP) {
        s.acc -= 1;
        travelers.push({ rt: s.rt, band: s.band, t: 0, sp: 1 / (CYCLE * (0.34 + Math.random() * 0.1)) });
      }
      if (s.acc > 3) s.acc = 3;
    }
    for (let i = travelers.length - 1; i >= 0; i--) {
      const tr = travelers[i];
      tr.t += tr.sp * dt;
      if (tr.t >= 1) travelers.splice(i, 1);
    }
  }

  function ribbons() {
    ctx.lineCap = 'round';
    for (const s of streams) {
      const hot = hover === D.codes[s.ci];
      ctx.globalAlpha = hot ? 0.58 : 0.3;
      ctx.strokeStyle = s.band === 0 ? '#0b8476' : '#c25324';
      // The 1px floor is the same bargain the dot already discloses for a value too small to
      // fill one of itself. It is a floor and never an addition, so it lifts only the pairs
      // that would otherwise vanish and leaves every comparison above it untouched.
      ctx.lineWidth = Math.max(1, s.n * widthK);
      ctx.beginPath();
      ctx.moveTo(s.rt.ax, s.rt.ay);
      ctx.bezierCurveTo(s.rt.c1x, s.rt.c1y, s.rt.c2x, s.rt.c2y, s.rt.bx, s.rt.by);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function flight(dt: number, dpr: number) {
    // The fade is applied in DEVICE pixels over the whole layer, then the transform goes
    // back on to draw: fading inside the user-space transform leaves the letterboxed
    // margins untouched, and a trail that strays into them never clears.
    tctx.setTransform(1, 0, 0, 1, 0, 0);
    tctx.globalCompositeOperation = 'destination-out';
    tctx.fillStyle = 'rgba(0,0,0,.13)';
    tctx.fillRect(0, 0, trail.width, trail.height);
    tctx.globalCompositeOperation = 'source-over';
    tctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);

    advance(dt);
    const dr = WIDE.dotR;
    for (const tr of travelers) {
      const [x, y] = cubicAt(tr.rt, tr.t);
      const fade = Math.sin(Math.PI * Math.min(1, tr.t * 3)) * 0.35 + 0.65;
      tctx.fillStyle = tr.band === 0 ? '#00695c' : '#c25324';
      tctx.globalAlpha = Math.min(1, fade);
      tctx.beginPath();
      tctx.arc(x, y, dr + 0.35, 0, Math.PI * 2);
      tctx.fill();
      tctx.globalAlpha = 0.16;
      tctx.beginPath();
      tctx.arc(x, y, dr + 2.6, 0, Math.PI * 2);
      tctx.fill();
    }
    tctx.globalAlpha = 1;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(trail, 0, 0);
    ctx.restore();
  }

  const flying = () => streams.length > 0 && !REDUCED.matches;
  let raf = 0;
  function kick() {
    if (!raf) raf = requestAnimationFrame(paint);
  }

  function paint(now: number) {
    raf = 0;
    const m = mode();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const dt = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas!.width, canvas!.height);
    ctx.restore();
    coast(m);

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

    // The streams ride over the still bodies, at a third strength: the cluster is the
    // quantity at rest and the ribbon is the same quantity moving, so the ribbon must not
    // out-shout the thing it repeats.
    if (streams.length) {
      ribbons();
      if (REDUCED.matches) {
        // A reader who asked for no motion still gets the encoding: the ribbon carries the
        // width and the direction, and only the dots in flight are withheld.
        tctx.clearRect(0, 0, trail.width, trail.height);
      } else {
        flight(dt, dpr);
      }
    }

    if (running || flying()) kick();
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
    buildStreams(to, m);
    if (!animate || REDUCED.matches) {
      from = to;
      groups = buildGroups(to, to, m);
      delay = delay.map(() => 0);
      running = false;
      t0 = performance.now() - (DUR + WAVE);
      lastFrame = performance.now();
    } else {
      t0 = performance.now();
      lastFrame = performance.now();
      running = true;
    }
    kick();
    placeLabels(m);
  }

  // ── the names ────────────────────────────────────────────────────────────────
  //
  // Placed in the browser against measured text, not against an approximation. 09 round 3
  // recorded why: a plate that sizes a container from a per-character font metric cannot
  // certify the page's fit, and only the browser can close it.
  //
  // WHAT 14 CHANGED, AND WHY IT HAD TO. The clusters used to be relaxed apart until no two
  // discs touched, so five slots and a halo were enough. They now sit at TRUE projected
  // points, where Riverside's disc is inside Los Angeles's and Baltimore's inside
  // Washington's, and a name pinned under its own cluster lands on somebody else's — the
  // exact pile-up this pass exists to clear. So the search widened to sixteen headings at
  // eight distances, out past ninety units, which is what it takes for Riverside's name to
  // escape a body it is not even attached to.
  //
  // AND CLEARING THE COLLISION IS ONLY HALF OF IT. Where two discs overlap, a name touching
  // the rim of the mass names the mass, not the metro — so those get a LEADER to the metro's
  // own projected point, ending in a pip on it. That says which centre without moving a
  // cluster, and the clusters were ruled to stay exactly where the projection puts them.
  //
  // The order is largest disc first, not reading order: a big cluster's own body blocks the
  // near rings for everybody, so it claims the canonical slot under itself and the small
  // crowded ones spend the rings it left free.

  const labels = [...over!.querySelectorAll<SVGTextElement>('text[data-label]')];
  const hits = [...over!.querySelectorAll<SVGGElement>('g[data-metro]')];
  const keys = [...over!.querySelectorAll<SVGGElement>('g[data-metro-key]')];
  const leads = [...over!.querySelectorAll<SVGGElement>('g[data-leader]')];
  const meas = document.createElement('canvas').getContext('2d')!;

  const RINGS = [5, 13, 22, 33, 46, 62, 80, 100];
  const HEADINGS = [90, 270, 0, 180, 45, 135, 315, 225, 22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(
    (deg) => {
      const a = (deg * Math.PI) / 180;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      return { dx, dy, anchor: dx > 0.25 ? 'start' : dx < -0.25 ? 'end' : 'middle' };
    }
  );

  type Box = [number, number, number, number];
  const overlaps = (a: Box, b: Box) => !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);

  function placeLabels(m: Mode) {
    const cs = getComputedStyle(over!);
    const fs = labelUnits;
    meas.font = `500 ${fs}px ${cs.fontFamily}`;
    /** a control has to clear 24×24 of REAL pixels, so the floor is converted back to units */
    const hitFloor = 13 / (scale || 1);
    const v = viewOf(cur);
    const discs = to.map((c, i) => {
      const r =
        D.codes[i] === cur
          ? m.sourceR
          : v.pole[i] === 2
            ? m.absentR
            : v.n[i] <= 0
              ? m.evenR
              // The dashed ring is ink at rest, so the name has to clear the RING and not the
              // body. Placing against `c.r` put a word inside the annulus on every cluster
              // whose residual is a large share of it — St. Louis's ring is over half its
              // body — which is the one place on this mark a label cannot go, because the gap
              // it would sit in is the quantity.
              : Math.max(ringR(v, i, m) || c.r, 3);
      return { x: c.x, y: c.y, r, i };
    });
    /** `radiusFor` is where the outermost dot's CENTRE lands, so the ink reaches `r + dotR`.
        Clearing the layout radius by a pixel still touches the mark; the clearance is the
        real ink plus two. */
    const clear = m.dotR + 2;
    const hitsDisc = (box: Box, skip: number) => {
      for (const c of discs) {
        if (c.i === skip || c.r <= 0) continue;
        const nx = Math.min(Math.max(c.x, box[0]), box[2]);
        const ny = Math.min(Math.max(c.y, box[1]), box[3]);
        if (Math.hypot(c.x - nx, c.y - ny) < c.r + clear) return true;
      }
      return false;
    };

    const taken: Box[] = [];
    const placedAt = new Array<{ tx: number; ty: number; anchor: string; box: Box; lead: boolean }>(discs.length);
    for (const d of [...discs].sort((a, b) => b.r - a.r)) {
      const node = labels[d.i];
      const w = meas.measureText(node?.textContent || '').width;
      const h = fs;
      // The box is measured on a CANVAS and the name is drawn as SVG, so it is deliberately
      // generous: `h` is the font size and the real glyph box runs ascender to descender,
      // about a quarter taller. Pittsburgh and Baltimore in the Orlando view overlapped by
      // three pixels on the exact box. The margin on top of that is for the metric itself
      // moving — a run that measured while the webfont was still swapping put San Antonio
      // three pixels into Austin, once, and a placement that only just clears is a placement
      // that will not clear on somebody else's machine.
      const at = (dx: number, dy: number, anchor: string, dist: number) => {
        const tx = d.x + dx * (d.r + dist);
        const ty = d.y + dy * (d.r + dist + h / 2);
        const x0 = anchor === 'start' ? tx : anchor === 'end' ? tx - w : tx - w / 2;
        return { tx, ty, anchor, box: [x0 - 4, ty - h * 0.7, x0 + w + 4, ty + h * 0.7] as Box };
      };
      // THREE TIERS, AND THE THIRD IS THE ONE THAT MATTERS. A name goes over nothing if it
      // can; over the MARK if it cannot, where the halo keeps it readable; and over another
      // name only if 128 candidates all failed — in which case it takes the one that
      // overlaps least, measured, rather than a fixed slot.
      //
      // A fixed last resort is what this had, and it was a real defect hiding behind a
      // margin: the moment the boxes grew, Riverside dropped through to "under my own
      // cluster" and landed square on San Diego. A fallback that ignores everything already
      // placed is not a fallback, it is a collision with extra steps.
      let hard: (ReturnType<typeof at> & { dist: number }) | null = null;
      let soft: (ReturnType<typeof at> & { dist: number }) | null = null;
      let least: (ReturnType<typeof at> & { dist: number }) | null = null;
      let leastArea = Infinity;
      for (const dist of RINGS) {
        for (const { dx, dy, anchor } of HEADINGS) {
          const c = at(dx, dy, anchor, dist);
          if (c.box[0] < 3 || c.box[2] > m.w - 3 || c.box[1] < 3 || c.box[3] > m.h - 3) continue;
          let area = 0;
          for (const t of taken) {
            const ow = Math.min(c.box[2], t[2]) - Math.max(c.box[0], t[0]);
            const oh = Math.min(c.box[3], t[3]) - Math.max(c.box[1], t[1]);
            if (ow > 0 && oh > 0) area += ow * oh;
          }
          if (area > 0) {
            if (area < leastArea) {
              leastArea = area;
              least = { ...c, dist };
            }
            continue;
          }
          if (hitsDisc(c.box, d.i)) {
            soft ??= { ...c, dist };
            continue;
          }
          hard = { ...c, dist };
          break;
        }
        if (hard) break;
      }
      const p = hard ?? soft ?? least ?? { ...at(0, 1, 'middle', RINGS[0]), dist: RINGS[0] };
      taken.push(p.box);
      const crowded = discs.some(
        (c) => c.i !== d.i && c.r > 0 && Math.hypot(c.x - d.x, c.y - d.y) < c.r + d.r
      );
      placedAt[d.i] = { tx: p.tx, ty: p.ty, anchor: p.anchor, box: p.box, lead: crowded || p.dist > RINGS[0] };
    }

    labels.forEach((node, i) => {
      const p = placedAt[i];
      node.setAttribute('text-anchor', p.anchor);
      node.setAttribute('transform', `translate(${p.tx.toFixed(1)},${p.ty.toFixed(1)})`);
      node.setAttribute('dominant-baseline', 'middle');
      node.classList.toggle('strong', D.codes[i] === cur);
      node.classList.toggle('quiet', cur !== 'rest' && D.codes[i] !== cur);
    });

    leads.forEach((g, i) => {
      const p = placedAt[i];
      const d = discs[i];
      g.toggleAttribute('hidden', !p.lead);
      if (!p.lead) return;
      const nx = Math.min(Math.max(d.x, p.box[0]), p.box[2]);
      const ny = Math.min(Math.max(d.y, p.box[1]), p.box[3]);
      for (const line of g.querySelectorAll('line')) {
        line.setAttribute('x1', d.x.toFixed(1));
        line.setAttribute('y1', d.y.toFixed(1));
        line.setAttribute('x2', nx.toFixed(1));
        line.setAttribute('y2', ny.toFixed(1));
      }
      for (const dot of g.querySelectorAll('circle')) {
        dot.setAttribute('cx', d.x.toFixed(1));
        dot.setAttribute('cy', d.y.toFixed(1));
      }
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
    // `labelUnits` itself. The corner is over the Pacific on the wide box and over
    // the first grid cell on the phone — the background is sized to the visible
    // key's own measured box, not guessed, so it stays legible over whatever ends
    // up underneath it.
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
    if (metricBox) metricBox.hidden = cbsa === null;
    showPair(null);
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

  // ── the pair readout ─────────────────────────────────────────────────────────
  //
  // THE NET IS DRAWN AND NEVER PRINTED. `contract.aggregation` licenses a mark that
  // aggregates the cells it is made of and refuses the same aggregate as a figure, so
  // hovering a partner hands the reader THE TWO PUBLISHED CELLS side by side — how many went
  // each way — and lets them do the subtraction the picture already drew. No net, no share,
  // no rate: the per-thousand view changes the mark's scale and prints nothing new.
  //
  // Every one of these blocks is server-rendered and merely UNHIDDEN here, like every other
  // string on this page. A client that assembled "12,345" from a payload would put a figure
  // on screen behind the ledger's back, which is the one thing the copy lint cannot see.

  const card = el<HTMLElement>('#paircard');
  const pairBlocks = new Map<string, HTMLElement>();
  card?.querySelectorAll<HTMLElement>('[data-pair]').forEach((p) => pairBlocks.set(p.dataset.pair!, p));
  const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

  function showPair(cbsa: string | null) {
    if (hover === cbsa) return;
    hover = cbsa;
    // The hovered stream brightens, so the hover has to reach the canvas even when nothing
    // is in flight to redraw it — a reader who asked for no motion still gets the highlight.
    kick();
    if (!card) return;
    const block = cbsa && cur !== 'rest' ? pairBlocks.get(pairKey(cur, cbsa)) : undefined;
    pairBlocks.forEach((p, k) => {
      p.hidden = !block || k !== pairKey(cur, cbsa!);
    });
    card.hidden = !block;
    if (!block) return;
    const i = D.codes.indexOf(cbsa!);
    const d = to[i];
    const r = Math.max(d.r, 10);
    const box = stage!.getBoundingClientRect();
    const cx = ox + d.x * scale;
    const cy = oy + d.y * scale;
    card.style.visibility = 'hidden';
    card.style.left = '0px';
    card.style.top = '0px';
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    let left = cx + r * scale + 10;
    if (left + w > box.width - 6) left = cx - r * scale - 10 - w;
    card.style.left = `${Math.max(6, left)}px`;
    card.style.top = `${Math.max(6, Math.min(cy - h / 2, box.height - h - 6))}px`;
    card.style.visibility = '';
  }

  // ── the metric ───────────────────────────────────────────────────────────────
  //
  // Two pre-built sets of counts, and the toggle picks one. It appears only once a metro is
  // chosen, because the resting cluster is a metro's own two published columns and a rate
  // has no pair to be a rate of — a control that is on screen and does nothing is worse than
  // one that waits.

  const metricBox = el<HTMLElement>('#metric');
  const metricBtns = [...document.querySelectorAll<HTMLButtonElement>('[data-metric]')];
  const scaleNotes = [...document.querySelectorAll<HTMLElement>('[data-scalenote]')];

  function setMetric(next: 'people' | 'rate') {
    metricBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.metric === next)));
    scaleNotes.forEach((n) => (n.hidden = n.dataset.scalenote !== next));
    if (next === metric) return;
    if (cur === 'rest') {
      metric = next;
      return;
    }
    from = frame(cur, mode());
    metric = next;
    prevKey = cur;
    render(true);
    showPair(null);
  }
  metricBtns.forEach((b) =>
    b.addEventListener('click', () => setMetric(b.dataset.metric === 'rate' ? 'rate' : 'people'))
  );

  // ── pointing at a metro ──────────────────────────────────────────────────────
  //
  // THE POINTER IS RESOLVED BY NEAREST CENTRE, not by which circle the event landed in, and
  // true positions are why. Riverside's disc sits inside Los Angeles's; the hit circles are
  // the discs, so a click on the middle of Los Angeles lands inside Riverside's circle and
  // whichever of the two the document draws last silently wins. Nearest centre cannot make
  // that mistake, and it needs no reordering of the thirty controls — which stay in
  // longitude order, because that order is the tab order.
  //
  // The thirty <g>s remain real focusable buttons, and the keyboard path goes through them
  // unchanged: a screen reader and a Tab key reach every metro whether or not a pixel of the
  // picture arrived.

  function nearest(clientX: number, clientY: number): { cbsa: string; d: number } | null {
    const box = stage!.getBoundingClientRect();
    const ux = (clientX - box.left - ox) / (scale || 1);
    const uy = (clientY - box.top - oy) / (scale || 1);
    let best: string | null = null;
    let bd = Infinity;
    for (let i = 0; i < to.length; i++) {
      const d = Math.hypot(to[i].x - ux, to[i].y - uy);
      if (d < bd) {
        bd = d;
        best = D.codes[i];
      }
    }
    return best ? { cbsa: best, d: bd } : null;
  }
  /** Generous enough that a reader aiming at a name hits the mark, and it scales with the
      mark rather than with the screen, so the phone's grid gets the same slack. */
  const REACH = () => (mode() === PHONE ? 30 : 46);

  if (D.focus === null) {
    let downX = 0;
    let downY = 0;
    let tapping = false;

    hits.forEach((g) => {
      const cbsa = g.dataset.metro!;
      // Keyboard only. The pointer is handled once, on the overlay, by nearest centre.
      g.addEventListener('focus', () => {
        if (cur !== 'rest' && cbsa !== cur) showPair(cbsa);
      });
      g.addEventListener('blur', () => showPair(null));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(cbsa);
        }
      });
    });

    over!.addEventListener('pointermove', (e) => {
      if (cur === 'rest') return showPair(null);
      const n = nearest(e.clientX, e.clientY);
      showPair(n && n.d < REACH() && n.cbsa !== cur ? n.cbsa : null);
    });
    over!.addEventListener('pointerleave', () => showPair(null));

    // WebKit swallows the first tap's click on a mark whose pointer handling mutates the
    // DOM, so a coarse pointer selects on pointerup behind a movement guard; the mouse keeps
    // click. pointercancel is what replaces pointerleave on touch.
    const choose = (clientX: number, clientY: number) => {
      const n = nearest(clientX, clientY);
      select(n && n.d < REACH() ? n.cbsa : null);
    };
    over!.addEventListener('click', (e) => {
      // `detail === 0` is a click a keyboard synthesised, and it carries no coordinates —
      // sending it to a nearest-centre test would resolve it against the box's top-left.
      if (e.detail === 0) return;
      const pt = (e as PointerEvent).pointerType;
      if (pt && pt !== 'mouse') return;
      choose(e.clientX, e.clientY);
    });
    over!.addEventListener('pointerdown', (e) => {
      downX = e.clientX;
      downY = e.clientY;
      tapping = e.pointerType !== 'mouse';
    });
    over!.addEventListener('pointercancel', () => {
      tapping = false;
    });
    over!.addEventListener('pointerup', (e) => {
      if (!tapping) return;
      tapping = false;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 10) return;
      choose(e.clientX, e.clientY);
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
    if (metricBox) metricBox.hidden = false;
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
