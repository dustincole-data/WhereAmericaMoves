// The explorer's selector: thirty metros on the basemap, one mark each.
//
// What this is NOT, and the deletion is the point: v1's directed 30-arc chord is gone,
// with `d3-chord` and `d3-shape`. Beauty 03 killed the ring three times as the hero and
// Beauty 10 finished it off below the fold, because the objection — every ribbon routed
// through one centre, so hues interleave at mark scale — is a property of the mark and
// not of its position. Drawing the same 863 cells a second time also gave the piece's
// subject, the record, no help at all.
//
// Unit of analysis here is a METRO (frame `metro_totals`), where the hero's is a directed
// PAIR (frame `top_metro_relations`). Two frames, two marks, no duplication.
//
// Two encodings and no third:
//   • AREA is people — (in + out) of a metro's own two cells. `contract.aggregation`: a
//     mark may aggregate the cells it is made of.
//   • HUE is where the metro is, taken from the hero's own emitted table so the two marks
//     cannot drift apart. A hue measures nothing.
//
// Net direction is NOT drawn, and that is a ruling rather than a simplification.
// `not_claimable` (D0019) says which twelve metros are the net destinations is not
// claimable — "no map that colours a metro by direction as a claimed fact". v1's
// cool/warm fill made exactly that assertion thirty times. The signed net survives as a
// number in each metro's own readout, where it is a readout of its own cell.

import { select } from 'd3-selection';
import { scaleSqrt } from 'd3-scale';
import { geoAlbersUsa, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';

export interface MapMetro {
  cbsa: string;
  slug: string;
  name: string;
  st: string;
  lat: number;
  lon: number;
  through: number; // in + out
  hue: string;
  aria: string;
}

export interface MapHandles {
  redraw(): void;
}

export function buildMap(
  svgEl: SVGSVGElement,
  metros: MapMetro[],
  getSelected: () => string | null,
  topojsonUrl: string,
  onSelect: (cbsa: string) => void,
  onDeselect: () => void,
  onHover: (cbsa: string, on: boolean) => void
): MapHandles {
  const svg = select(svgEl);
  const MW = 640;
  const MH = 400;
  const proj = geoAlbersUsa()
    .scale(820)
    .translate([MW / 2, MH / 2 - 6]);
  const path = geoPath(proj);
  const gStates = svg.append('g').attr('class', 'basemap');
  const gDots = svg.append('g').attr('class', 'dots');

  const placed = metros.map((m) => {
    const p = proj([m.lon, m.lat]);
    return { ...m, mx: p ? p[0] : MW / 2, my: p ? p[1] : MH / 2 };
  });
  type Placed = (typeof placed)[number];

  const maxThru = Math.max(1, ...placed.map((m) => m.through));
  const dotR = scaleSqrt().domain([0, maxThru]).range([3, 16]);

  // Touch never gets a dependable click: WebKit treats the first tap on a mark that reacts
  // to hover as a hover, delivers the mouseenter, and swallows the click — so one tap
  // raised the readout but never selected. Coarse pointers select on pointerup, with a
  // movement guard so a scroll that starts on a dot is not a tap; the mouse keeps click.
  let downX = 0;
  let downY = 0;
  let tapping = false;

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
        .attr('stroke', 'var(--rule)')
        .attr('stroke-width', 1);
      gStates
        .append('path')
        .datum(mesh(us, us.objects.states, (a: any, b: any) => a !== b))
        .attr('d', path as any)
        .attr('fill', 'none')
        .attr('stroke', 'var(--rule)')
        .attr('stroke-width', 0.8);
      draw();
    })
    .catch(() => {
      // The dots are the selector; the outline is orientation. Losing it costs orientation
      // and nothing else, so the map still works.
      gStates
        .append('rect')
        .attr('x', 20)
        .attr('y', 30)
        .attr('width', 600)
        .attr('height', 330)
        .attr('rx', 14)
        .attr('fill', 'none')
        .attr('stroke', 'var(--rule)')
        .attr('stroke-dasharray', '3 5');
      draw();
    });

  function draw() {
    const selected = getSelected();
    const dots = gDots
      .selectAll<SVGGElement, Placed>('g.dot')
      .data(placed, (d: any) => d.cbsa)
      .join((enter) => {
        const gg = enter
          .append('g')
          .attr('class', 'dot')
          .attr('tabindex', 0)
          .attr('role', 'button');
        gg.append('circle').attr('class', 'halo');
        gg.append('circle').attr('class', 'core');
        gg.append('circle').attr('class', 'ring');
        return gg;
      });

    dots
      .attr('transform', (d) => `translate(${d.mx},${d.my})`)
      .attr('data-cbsa', (d) => d.cbsa)
      .attr('aria-label', (d) => d.aria)
      .on('click', (_e, d) => onSelect(d.cbsa))
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
        onSelect(d.cbsa);
      })
      .on('keydown', (e: KeyboardEvent, d) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(d.cbsa);
        }
      })
      .on('focus', (_e, d) => onHover(d.cbsa, true))
      .on('blur', (_e, d) => onHover(d.cbsa, false))
      .on('mouseenter', (_e, d) => onHover(d.cbsa, true))
      .on('mouseleave', (_e, d) => onHover(d.cbsa, false));

    dots
      .select('.halo')
      .attr('r', (d) => dotR(d.through) + 5)
      .attr('fill', (d) => d.hue)
      .attr('opacity', 0.16);
    dots
      .select('.core')
      .attr('r', (d) => dotR(d.through))
      .attr('fill', (d) => d.hue)
      .attr('stroke', 'var(--ground)')
      .attr('stroke-width', 1);
    dots
      .select('.ring')
      .attr('r', (d) => dotR(d.through) + 3.5)
      .attr('fill', 'none')
      .attr('stroke', 'var(--ink)')
      .attr('stroke-width', (d) => (d.cbsa === selected ? 2 : 0));

    gDots
      .selectAll<SVGGElement, Placed>('g.dot')
      .sort((a, b) => (a.cbsa === selected ? 1 : 0) - (b.cbsa === selected ? 1 : 0));
  }

  return { redraw: draw };
}
