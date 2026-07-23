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
import { fmtInt, fmtSigned, gainLose } from './format';
import { HERO_ARIA, RING_CENTER_NATIONAL, RING_CENTER_RESET } from './copy';
import type { MetroView } from './data';

export interface Tip {
  show(e: MouseEvent, html: string): void;
  move(e: MouseEvent): void;
  hide(): void;
}

// ── DESKTOP: dense directed 31-arc chord (ticket 04 B) ──
export interface DenseHandles {
  highlight(idx: number, on: boolean): void;
}
export function renderDense(
  svgEl: SVGSVGElement,
  views: MetroView[],
  matrix: number[][],
  selected: number | null,
  maxNet: number,
  onToggle: (i: number) => void,
  onDeselect: () => void,
  tip: Tip
): DenseHandles {
  const svg = select(svgEl);
  svg.selectAll('*').remove();
  svg.attr('viewBox', '0 0 600 560').attr('aria-label', HERO_ARIA);
  const defs = svg.append('defs');
  defs.html(
    `<filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4"/></filter>`
  );
  const cx = 300,
    cy = 272,
    R = 210,
    ir = R - 14;
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
    .attr('fill', (d: any) => netColor(views[d.index].net, maxNet))
    .attr('stroke', 'var(--surface)')
    .attr('stroke-width', 0.8)
    .attr('opacity', (d: any) => (hasSel ? (d.index === selected ? 1 : 0.42) : 0.9))
    .style('cursor', 'pointer')
    .on('click', (_e: any, d: any) => onToggle(d.index))
    .on('mouseenter', (e: MouseEvent, d: any) => {
      handles.highlight(d.index, true);
      const m = views[d.index];
      tip.show(
        e,
        `<div class="tt">${m.name}, ${m.st}</div>net <span class="mono ${m.net >= 0 ? 'in' : 'out'}">${fmtSigned(
          m.net
        )}</span> — ${gainLose(m.net)}`
      );
    })
    .on('mousemove', (e: MouseEvent) => tip.move(e))
    .on('mouseleave', (_e: any, d: any) => {
      handles.highlight(d.index, false);
      tip.hide();
    });
  grp
    .append('text')
    .each(function (d: any) {
      d.ang = (d.startAngle + d.endAngle) / 2;
    })
    .attr('dy', '.32em')
    .attr('font-family', 'var(--font-sans)')
    .attr('font-size', 9.5)
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

  // ribbons
  const rib = g
    .append('g')
    .attr('fill-opacity', 0.66)
    .selectAll('path')
    .data(chords)
    .join('path')
    .attr('d', ribbon)
    .attr('stroke', 'none')
    .attr('fill', (d: any) => netColor(views[d.source.index].net, maxNet))
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
      .attr('font-size', 13)
      .attr('fill', 'var(--muted)')
      .style('cursor', 'pointer')
      .text(RING_CENTER_RESET)
      .on('click', onDeselect);
  } else {
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.32em')
      .attr('font-family', 'var(--font-hand)')
      .attr('font-size', 21)
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
  onHover: (i: number, on: boolean) => void,
  tip: Tip
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
      .attr('aria-label', (d) => `${d.name} ${d.st}: net ${fmtSigned(d.net)}, ${gainLose(d.net)} people. Select.`)
      .on('click', (_e, d) => onSelect(d.i))
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
        tip.show(
          e,
          `<div class="tt">${d.name}, ${d.st}</div><span class="mono">${fmtInt(
            d.total_in
          )}</span> in · <span class="mono">${fmtInt(d.total_out)}</span> out<br>net <span class="mono ${
            d.net >= 0 ? 'in' : 'out'
          }">${fmtSigned(d.net)}</span> — ${gainLose(d.net)} people`
        );
      })
      .on('mousemove', (e: MouseEvent) => tip.move(e))
      .on('mouseleave', (_e, d) => {
        onHover(d.i, false);
        tip.hide();
      });
    dots
      .select('.halo')
      .attr('r', (d) => dotR(d.total_in + d.total_out) + 5)
      .attr('fill', (d) => netColor(d.net, maxNet))
      .attr('opacity', 0.14);
    dots
      .select('.core')
      .attr('r', (d) => dotR(d.total_in + d.total_out))
      .attr('fill', (d) => netColor(d.net, maxNet))
      .attr('stroke', 'var(--surface)')
      .attr('stroke-width', 1);
    dots
      .select('.ring')
      .attr('r', (d) => dotR(d.total_in + d.total_out) + 3.5)
      .attr('fill', 'none')
      .attr('stroke', 'var(--ink)')
      .attr('stroke-width', (d) => (d.i === selected ? 2 : 0));
    gDots.selectAll<SVGGElement, MetroView>('g.dot').sort((a, b) => (a.i === selected ? 1 : 0) - (b.i === selected ? 1 : 0));
  }

  return { redraw: draw };
}
