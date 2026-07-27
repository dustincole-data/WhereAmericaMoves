// Client viz — the three D3 renderers (ticket 04 hero forms + ticket 05 map),
// ported from the prototype onto real data + npm submodules. Pure drawing; the
// interaction state machine lives in explorer.ts.

import { select } from 'd3-selection';
import { chordDirected, ribbonArrow } from 'd3-chord';
import { arc as d3arc } from 'd3-shape';
import { descending } from 'd3-array';
import { scaleSqrt } from 'd3-scale';
import { geoAlbersUsa, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import { netColor } from './colors';
import { fmtInt, fmtSigned, fmtRate, fmtRateAbs, gainLose } from './format';
import { HERO_ARIA, RING_CENTER_NATIONAL, RING_CENTER_RESET, dotAria } from './copy';
import type { MetroView, Mode } from './data';
import { MAX_NET_RATE } from './data';

export interface Tip {
  show(e: MouseEvent, html: string): void;
  move(e: MouseEvent): void;
  hide(): void;
}

// ── DESKTOP: dense directed 30-arc chord (ticket 04 B) ──
export interface DenseHandles {
  highlight(idx: number, on: boolean): void;
}
// A phone renders this SVG about 324 CSS px wide, so every unit below is worth
// ~0.54 of a pixel at the desktop viewBox — which is what put the ring labels at
// 5.1 CSS px and forced the old mobile fork. The compact geometry shrinks the
// viewBox instead of the chord: the same 30 arcs, drawn at ~0.9 units-to-pixels.
const DENSE = {
  wide: { vb: '0 0 600 560', cx: 300, cy: 272, R: 210, label: 9.5, centre: 21, reset: 13, labels: 'all' },
  compact: { vb: '0 0 360 360', cx: 180, cy: 180, R: 165, label: 12, centre: 17, reset: 12, labels: 'selection' },
};
export const DENSE_COMPACT_VIEWBOX = DENSE.compact.vb;

export function renderDense(
  svgEl: SVGSVGElement,
  views: MetroView[],
  matrix: number[][],
  selected: number | null,
  maxNet: number,
  onToggle: (i: number) => void,
  onDeselect: () => void,
  tip: Tip,
  compact = false,
  mode: Mode = 'people'
): DenseHandles {
  const G = compact ? DENSE.compact : DENSE.wide;
  // In rate mode the caller passes the rate matrix and MAX_NET_RATE; the arcs and
  // ribbons must colour off the matching net measure or the two disagree (09 §3.1).
  const netOf = (v: MetroView) => (mode === 'per1k' ? v.net_rate : v.net);
  const svg = select(svgEl);
  svg.selectAll('*').remove();
  svg.attr('viewBox', G.vb).attr('aria-label', HERO_ARIA);
  const defs = svg.append('defs');
  defs.html(
    `<filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4"/></filter>`
  );
  const cx = G.cx,
    cy = G.cy,
    R = G.R,
    ir = R - (compact ? 11 : 14);
  const chords = chordDirected().padAngle(0.026).sortSubgroups(descending)(matrix);
  const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);
  const arc = d3arc<any>().innerRadius(ir).outerRadius(R);
  const ribbon = ribbonArrow<any, any>().radius(ir - 2) as any;
  const hasSel = selected !== null;

  // group arcs
  const grp = g.append('g').selectAll('g').data(chords.groups).join('g');
  grp
    .append('path')
    .attr('d', arc as any)
    .attr('fill', (d: any) => netColor(netOf(views[d.index]), maxNet))
    .attr('stroke', 'var(--surface)')
    .attr('stroke-width', 0.8)
    .attr('opacity', (d: any) => (hasSel ? (d.index === selected ? 1 : 0.42) : 0.9))
    .style('cursor', 'pointer')
    .on('click', (_e: any, d: any) => onToggle(d.index))
    .on('mouseenter', (e: MouseEvent, d: any) => {
      handles.highlight(d.index, true);
      const m = views[d.index];
      const fig =
        mode === 'per1k' ? `${fmtRate(m.net_rate)}</span> per 1,000` : `${fmtSigned(m.net)}</span>`;
      tip.show(
        e,
        `<div class="tt">${m.name}, ${m.st}</div>net <span class="mono ${
          m.net >= 0 ? 'in' : 'out'
        }">${fig} — ${gainLose(m.net)}`
      );
    })
    .on('mousemove', (e: MouseEvent) => tip.move(e))
    .on('mouseleave', (_e: any, d: any) => {
      handles.highlight(d.index, false);
      tip.hide();
    });
  if (G.labels === 'all')
  grp
    .append('text')
    .each(function (d: any) {
      d.ang = (d.startAngle + d.endAngle) / 2;
    })
    .attr('dy', '.32em')
    .attr('font-family', 'var(--font-sans)')
    .attr('font-size', G.label)
    .attr('fill', (d: any) => (d.index === selected ? 'var(--ink)' : 'var(--muted)'))
    .attr('font-weight', (d: any) => (d.index === selected ? 600 : 400))
    .attr(
      'transform',
      (d: any) => `rotate(${(d.ang * 180) / Math.PI - 90}) translate(${R + 5}) ${d.ang > Math.PI ? 'rotate(180)' : ''}`
    )
    .attr('text-anchor', (d: any) => (d.ang > Math.PI ? 'end' : 'start'))
    .text((d: any) => views[d.index].name)
    .style('cursor', 'pointer')
    .on('click', (_e: any, d: any) => onToggle(d.index));

  // A phone has no room for 30 radial labels at a readable size: sized to be read
  // they collide and squeeze the ring down to a doily. So the compact ring names
  // only what the reader is actually looking at — the selected metro and the
  // partners its lit ribbons run to — inside the ring, where there is room.
  if (G.labels === 'selection' && hasSel) {
    const weight = (j: number) => matrix[selected!][j] + matrix[j][selected!];
    const named = new Set(
      views
        .map((_, j) => j)
        .filter((j) => j !== selected)
        .sort((a, b) => weight(b) - weight(a))
        .slice(0, 6)
        .concat(selected!)
    );
    g.append('g')
      .selectAll('text')
      .data(chords.groups.filter((d: any) => named.has(d.index)))
      .join('text')
      .each(function (d: any) {
        d.ang = (d.startAngle + d.endAngle) / 2;
      })
      .attr('dy', '.32em')
      .attr('font-family', 'var(--font-sans)')
      .attr('font-size', G.label)
      .attr('fill', (d: any) => (d.index === selected ? 'var(--ink)' : 'var(--ink-2)'))
      .attr('font-weight', (d: any) => (d.index === selected ? 700 : 500))
      .attr('stroke', 'var(--surface)')
      .attr('stroke-width', 3)
      .attr('paint-order', 'stroke')
      .attr(
        'transform',
        (d: any) =>
          `rotate(${(d.ang * 180) / Math.PI - 90}) translate(${ir - 9}) ${d.ang > Math.PI ? 'rotate(180)' : ''}`
      )
      .attr('text-anchor', (d: any) => (d.ang > Math.PI ? 'start' : 'end'))
      .text((d: any) => views[d.index].name)
      .style('cursor', 'pointer')
      .on('click', (_e: any, d: any) => onToggle(d.index));
  }

  // ribbons
  const rib = g
    .append('g')
    .attr('fill-opacity', 0.66)
    .selectAll('path')
    .data(chords)
    .join('path')
    .attr('d', ribbon)
    .attr('stroke', 'none')
    .attr('fill', (d: any) => netColor(netOf(views[d.source.index]), maxNet))
    .attr('opacity', (d: any) => {
      if (!hasSel) return 0.14;
      return d.source.index === selected || d.target.index === selected ? 0.92 : 0.035;
    });

  // centre: reset target (selected) or Caveat annotation (national)
  if (hasSel) {
    g.append('circle')
      .attr('r', ir - 6)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .attr('aria-hidden', 'true')
      .on('click', onDeselect);
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.32em')
      .attr('font-family', 'var(--font-serif)')
      .attr('font-size', G.reset)
      .attr('fill', 'var(--muted)')
      .style('cursor', 'pointer')
      .text(RING_CENTER_RESET)
      .on('click', onDeselect);
  } else {
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.32em')
      .attr('font-family', 'var(--font-hand)')
      .attr('font-size', G.centre)
      .attr('fill', 'var(--muted)')
      .text(RING_CENTER_NATIONAL);
  }

  const handles: DenseHandles = {
    highlight(idx: number, on: boolean) {
      rib.attr('opacity', (d: any) => {
        const rel = d.source.index === idx || d.target.index === idx;
        const sel = hasSel && (d.source.index === selected || d.target.index === selected);
        if (on) return rel ? 0.94 : 0.03;
        if (!hasSel) return 0.14;
        return sel ? 0.92 : 0.035;
      });
    },
  };
  return handles;
}

// ── MOBILE hero + share hero: focus radial chord (ticket 04 A) ──
export function renderFocus(
  svgEl: SVGSVGElement,
  m: MetroView | null,
  maxNet: number,
  onSelectPartner: (p: MetroView['partners'][number]) => void,
  placeholder?: [string, string]
) {
  const svg = select(svgEl);
  svg.selectAll('*').remove();
  svg.attr('viewBox', '0 0 520 500');
  const defs = svg.append('defs');
  defs.html(
    `<filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4"/></filter>`
  );
  const gHero = svg.append('g');

  if (!m) {
    const [l1, l2] = placeholder ?? ['', ''];
    gHero
      .append('text')
      .attr('x', 260)
      .attr('y', 235)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'var(--font-serif)')
      .attr('font-size', 16)
      .attr('fill', 'var(--muted)')
      .text(l1);
    gHero
      .append('text')
      .attr('x', 260)
      .attr('y', 262)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'var(--font-serif)')
      .attr('font-size', 16)
      .attr('fill', 'var(--muted)')
      .text(l2);
    return;
  }

  const cx = 260,
    cy = 232,
    R = 170;
  const P = m.partners.slice(0, 10).map((p) => ({ ...p, gross: p.in + p.out }));
  const restNode: any = {
    rest: true,
    name: 'Rest of U.S.',
    in: m.rest_in,
    out: m.rest_out,
    gross: m.rest_in + m.rest_out,
    net: m.rest_in - m.rest_out,
  };
  const ordered = P.slice().sort((a, b) => b.net - a.net);
  const grossMax = Math.max(1, ...P.map((d) => d.gross));
  const wScale = scaleSqrt().domain([0, grossMax]).range([2.5, 9]);
  const arcRef = Math.max(1, ...P.map((d) => Math.abs(d.net)));

  gHero
    .append('circle')
    .attr('cx', cx)
    .attr('cy', cy)
    .attr('r', 92)
    .attr('fill', netColor(m.net, maxNet))
    .attr('opacity', 0.13)
    .attr('filter', 'url(#soft)');

  const span = Math.PI * 2 * (300 / 360);
  ordered.forEach((p: any, idx: number) => {
    const a = -Math.PI / 2 - span / 2 + span * (idx / Math.max(1, ordered.length - 1));
    p.a = a;
    p.px = cx + Math.cos(a) * R;
    p.py = cy + Math.sin(a) * R;
  });
  restNode.a = Math.PI / 2;
  restNode.px = cx;
  restNode.py = cy + R + 8;

  const gHalo = gHero.append('g'),
    gArcs = gHero.append('g'),
    gNodes = gHero.append('g');
  const arcPath = (p: any) => {
    const mx = (cx + p.px) / 2,
      my = (cy + p.py) / 2;
    const ctrlx = cx + (mx - cx) * 0.35,
      ctrly = cy + (my - cy) * 0.35;
    return `M${cx},${cy} Q${ctrlx},${ctrly} ${p.px},${p.py}`;
  };
  gHalo
    .selectAll('path')
    .data(ordered)
    .join('path')
    .attr('d', arcPath)
    .attr('fill', 'none')
    .attr('filter', 'url(#soft)')
    .attr('stroke', (p: any) => netColor(p.net, arcRef))
    .attr('stroke-width', (p: any) => wScale(p.gross))
    .attr('opacity', 0.3)
    .attr('stroke-linecap', 'round');
  gArcs
    .append('path')
    .attr('d', arcPath(restNode))
    .attr('fill', 'none')
    .attr('stroke', 'var(--muted)')
    .attr('stroke-width', 8)
    .attr('opacity', 0.32)
    .attr('stroke-linecap', 'round');
  gArcs
    .selectAll('path.parc')
    .data(ordered)
    .join('path')
    .attr('class', 'parc')
    .attr('d', arcPath)
    .attr('fill', 'none')
    .attr('stroke-linecap', 'round')
    .attr('stroke', (p: any) => netColor(p.net, arcRef))
    .attr('stroke-width', (p: any) => wScale(p.gross))
    .attr('opacity', 0.92);

  const nodeData = ordered.concat([restNode]);
  const gn = gNodes
    .selectAll('g.pn')
    .data(nodeData)
    .join('g')
    .attr('transform', (d: any) => `translate(${d.px},${d.py})`)
    .style('cursor', (d: any) => (d.rest ? 'default' : 'pointer'));
  gn.append('circle')
    .attr('r', (d: any) => (d.rest ? 5 : 3.2))
    .attr('fill', (d: any) => (d.rest ? 'var(--muted)' : 'var(--ink)'));
  gn.append('text')
    .text((d: any) => d.name)
    .attr('x', (d: any) => (Math.cos(d.a) >= 0 ? 9 : -9))
    .attr('text-anchor', (d: any) => (Math.cos(d.a) >= 0 ? 'start' : 'end'))
    .attr('y', 4)
    .attr('font-family', 'var(--font-sans)')
    .attr('font-size', 11.5)
    .attr('fill', 'var(--ink-2)')
    .attr('font-weight', 500);
  gn.append('text')
    .text((d: any) => fmtSigned(d.net))
    .attr('x', (d: any) => (Math.cos(d.a) >= 0 ? 9 : -9))
    .attr('text-anchor', (d: any) => (Math.cos(d.a) >= 0 ? 'start' : 'end'))
    .attr('y', 17)
    .attr('font-family', 'var(--font-mono)')
    .attr('font-size', 10)
    .attr('fill', (d: any) => (d.net >= 0 ? 'var(--in-core)' : 'var(--out-core)'));
  gn.filter((d: any) => !d.rest).on('click', (_e: any, d: any) => onSelectPartner(d));

  gHero
    .append('circle')
    .attr('cx', cx)
    .attr('cy', cy)
    .attr('r', 8)
    .attr('fill', 'var(--surface)')
    .attr('stroke', 'var(--ink)')
    .attr('stroke-width', 2);
  gHero
    .append('text')
    .attr('x', cx)
    .attr('y', cy - 15)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'var(--font-serif)')
    .attr('font-weight', 600)
    .attr('font-size', 14)
    .attr('fill', 'var(--ink)')
    .text(m.name);
}

// ── Choropleth selector (ticket 05 rail; constant) ──
export interface MapHandles {
  redraw(): void;
}
export function buildMap(
  svgEl: SVGSVGElement,
  views: MetroView[],
  getSelected: () => number | null,
  maxNet: number,
  topojsonUrl: string,
  onSelect: (i: number) => void,
  onDeselect: () => void,
  onHover: (i: number, on: boolean) => void,
  tip: Tip,
  getMode: () => Mode = () => 'people'
): MapHandles {
  const svg = select(svgEl);
  const MW = 640,
    MH = 400;
  const proj = geoAlbersUsa()
    .scale(820)
    .translate([MW / 2, MH / 2 - 6]);
  const path = geoPath(proj);
  const gStates = svg.append('g');
  const gDots = svg.append('g');
  views.forEach((m) => {
    const p = proj([m.lon, m.lat]);
    (m as any).mx = p ? p[0] : MW / 2;
    (m as any).my = p ? p[1] : MH / 2;
  });
  const maxThru = Math.max(1, ...views.map((m) => m.total_in + m.total_out));
  const dotR = scaleSqrt().domain([0, maxThru]).range([3, 16]);
  // Rate mode keeps the zero baseline: a shifted domain would exaggerate, and the flip
  // is already legible (New York 16.0 → 10.1 px, Austin 8.9 → 15.7 px). 09 §3.2.
  const maxChurnRate = Math.max(1e-9, ...views.map((m) => m.churn_rate));
  const dotRRate = scaleSqrt().domain([0, maxChurnRate]).range([3, 16]);

  /** Fill and size must switch together or the map is mixed-unit (09 §3.2). */
  const dotSize = (d: MetroView) =>
    getMode() === 'per1k' ? dotRRate(d.churn_rate) : dotR(d.total_in + d.total_out);
  const dotFill = (d: MetroView) =>
    getMode() === 'per1k' ? netColor(d.net_rate, MAX_NET_RATE) : netColor(d.net, maxNet);

  const dotTipHTML = (d: MetroView) =>
    getMode() === 'per1k'
      ? `<div class="tt">${d.name}, ${d.st}</div><span class="mono">${fmtRateAbs(
          d.in_rate
        )}</span> in · <span class="mono">${fmtRateAbs(d.out_rate)}</span> out<br>net <span class="mono ${
          d.net >= 0 ? 'in' : 'out'
        }">${fmtRate(d.net_rate)}</span> per 1,000 — ${gainLose(d.net)}`
      : `<div class="tt">${d.name}, ${d.st}</div><span class="mono">${fmtInt(
          d.total_in
        )}</span> in · <span class="mono">${fmtInt(d.total_out)}</span> out<br>net <span class="mono ${
          d.net >= 0 ? 'in' : 'out'
        }">${fmtSigned(d.net)}</span> — ${gainLose(d.net)} people`;

  // Touch never gets a dependable click: WebKit treats the first tap on a mark that
  // reacts to hover as a hover, delivers the mouseenter that shows the tip, and
  // swallows the click — so one tap raised the readout but never selected. Coarse
  // pointers therefore select on pointerup (with a movement guard so a scroll that
  // starts on a dot is not a tap); the mouse keeps using click.
  let downX = 0,
    downY = 0,
    tapping = false;

  // Tapping the map away from every metro is the way back to the national view.
  svg.on('pointerup', (e: PointerEvent) => {
    if (!(e.target as Element).closest?.('g.dot')) onDeselect();
  });

  fetch(topojsonUrl)
    .then((r) => r.json())
    .then((us: any) => {
      const states = feature(us, us.objects.states) as any;
      gStates
        .selectAll('path')
        .data(states.features)
        .join('path')
        .attr('d', path as any)
        .attr('fill', 'none')
        .attr('stroke', '#E3D8C7')
        .attr('stroke-width', 1);
      gStates
        .append('path')
        .datum(mesh(us, us.objects.states, (a: any, b: any) => a !== b))
        .attr('d', path as any)
        .attr('fill', 'none')
        .attr('stroke', '#E3D8C7')
        .attr('stroke-width', 0.8);
      draw();
    })
    .catch(() => {
      gStates
        .append('rect')
        .attr('x', 20)
        .attr('y', 30)
        .attr('width', 600)
        .attr('height', 330)
        .attr('rx', 14)
        .attr('fill', 'none')
        .attr('stroke', '#E3D8C7')
        .attr('stroke-dasharray', '3 5');
      draw();
    });

  function draw() {
    const selected = getSelected();
    const dots = gDots
      .selectAll<SVGGElement, MetroView>('g.dot')
      .data(views, (d: any) => d.i)
      .join((enter) => {
        const gg = enter
          .append('g')
          .attr('class', 'dot')
          .style('cursor', 'pointer')
          .attr('tabindex', 0)
          .attr('role', 'button');
        gg.append('circle').attr('class', 'halo');
        gg.append('circle').attr('class', 'core');
        gg.append('circle').attr('class', 'ring');
        return gg;
      });
    dots
      .attr('transform', (d: any) => `translate(${d.mx},${d.my})`)
      .attr('aria-label', (d) => dotAria(d, getMode()))
      .on('click', (_e, d) => onSelect(d.i))
      .on('pointerdown', (e: PointerEvent) => {
        downX = e.clientX;
        downY = e.clientY;
        tapping = e.pointerType !== 'mouse';
      })
      .on('pointercancel', () => {
        tapping = false;
      })
      .on('pointerup', (e: PointerEvent, d) => {
        if (!tapping) return;
        tapping = false;
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 10) return;
        onSelect(d.i);
        tip.show(e as unknown as MouseEvent, dotTipHTML(d));
      })
      .on('keydown', (e: KeyboardEvent, d) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(d.i);
        }
      })
      .on('focus', (_e, d) => onHover(d.i, true))
      .on('blur', (_e, d) => onHover(d.i, false))
      .on('mouseenter', (e: MouseEvent, d) => {
        onHover(d.i, true);
        tip.show(e, dotTipHTML(d));
      })
      .on('mousemove', (e: MouseEvent) => tip.move(e))
      .on('mouseleave', (_e, d) => {
        onHover(d.i, false);
        tip.hide();
      });
    dots
      .select('.halo')
      .attr('r', (d) => dotSize(d) + 5)
      .attr('fill', dotFill)
      .attr('opacity', 0.14);
    dots
      .select('.core')
      .attr('r', dotSize)
      .attr('fill', dotFill)
      .attr('stroke', 'var(--surface)')
      .attr('stroke-width', 1);
    dots
      .select('.ring')
      .attr('r', (d) => dotSize(d) + 3.5)
      .attr('fill', 'none')
      .attr('stroke', 'var(--ink)')
      .attr('stroke-width', (d) => (d.i === selected ? 2 : 0));
    gDots.selectAll<SVGGElement, MetroView>('g.dot').sort((a, b) => (a.i === selected ? 1 : 0) - (b.i === selected ? 1 : 0));
  }

  return { redraw: draw };
}
