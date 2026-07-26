// Explorer orchestration — overview-first, highlight-in-place, one selection state
// (ticket 05). Wires the chord + map + panel into a single coordinated instrument.

import { select as d3select } from 'd3-selection';
import { VIEWS, MAX_NET, CBSA_TO_INDEX } from './data';
import type { MetroView } from './data';
import { renderDense, buildMap, DENSE_COMPACT_VIEWBOX } from './viz';
import type { DenseHandles, Tip } from './viz';
import {
  nationalPanelHTML,
  metroPanelCoreHTML,
  liveNational,
  liveMetro,
  HERO_HINT_NATIONAL,
  HERO_HINT_SELECTED,
  LOADING,
  FETCH_FAIL,
} from './copy';
import { verdictShort } from './format';

const $ = <T extends Element>(sel: string) => document.querySelector(sel) as T;

const heroSvg = $<SVGSVGElement>('#hero');
const mapSvg = $<SVGSVGElement>('#map');
const panel = $<HTMLDivElement>('#panel');
const scopeEl = $<HTMLDivElement>('#scope');
const verdictEl = $<HTMLDivElement>('#verdict');
const hintEl = $<HTMLDivElement>('#herohint');
const pick = $<HTMLSelectElement>('#metroPick');
const live = $<HTMLDivElement>('#live');
const tipEl = $<HTMLDivElement>('#tip');

let selected: number | null = null;
let matrix: number[][] | null = null;
let fetchFailed = false;
let denseHandles: DenseHandles | null = null;

const isMobile = () => matchMedia('(max-width:640px)').matches;

// ── tooltip ──
// A touch has no hover to leave, so a tapped tip pins itself and carries explicit
// dismissals: the ×, or a pointerdown anywhere off it (tap-away, or the start of a
// scroll). The pinned body is transparent to pointers, so a tap that lands on top of
// it still reaches the metro underneath and simply moves the tip there. Mouse hover is
// untouched: it never pins, so mouseleave still does the work.
let coarse = false;

const tip: Tip = {
  show(e, html) {
    tipEl.innerHTML = coarse ? html + '<button class="tipx" type="button" aria-label="Dismiss">×</button>' : html;
    tipEl.classList.toggle('pinned', coarse);
    tipEl.style.opacity = '1';
    this.move(e);
  },
  move(e) {
    const pad = 14;
    let x = e.clientX + pad,
      y = e.clientY + pad;
    const w = tipEl.offsetWidth,
      h = tipEl.offsetHeight;
    if (x + w > innerWidth - 8) x = e.clientX - w - pad;
    if (y + h > innerHeight - 8) y = e.clientY - h - pad;
    // flipping can push a wide tip (the pinned one carries the ×) off the near edge on a
    // narrow screen, so keep it on-screen after the flip
    x = Math.max(8, Math.min(x, innerWidth - w - 8));
    y = Math.max(8, Math.min(y, innerHeight - h - 8));
    tipEl.style.left = x + 'px';
    tipEl.style.top = y + 'px';
  },
  hide() {
    tipEl.classList.remove('pinned');
    tipEl.style.opacity = '0';
  },
};

addEventListener(
  'pointerdown',
  (e) => {
    coarse = e.pointerType !== 'mouse';
    if (tipEl.classList.contains('pinned') && !tipEl.contains(e.target as Node)) tip.hide();
  },
  true
);
tipEl.addEventListener('click', () => tip.hide());

// ── hero ──
function heroMessage(text: string) {
  const svg = d3select(heroSvg);
  svg.selectAll('*').remove();
  const compact = isMobile();
  svg.attr('viewBox', compact ? DENSE_COMPACT_VIEWBOX : '0 0 600 560');
  svg
    .append('text')
    .attr('x', compact ? 180 : 300)
    .attr('y', compact ? 180 : 272)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'var(--font-serif)')
    .attr('font-size', 16)
    .attr('fill', 'var(--muted)')
    .text(text);
}

function renderHero() {
  if (fetchFailed) return heroMessage(FETCH_FAIL);
  if (!matrix) return heroMessage(LOADING);
  denseHandles = renderDense(heroSvg, VIEWS, matrix, selected, MAX_NET, toggle, deselect, tip, isMobile());
}

// ── panel ──
function renderPanel() {
  if (selected === null) {
    panel.innerHTML = nationalPanelHTML();
    return;
  }
  const m = VIEWS[selected];
  panel.innerHTML =
    `<div class="panelhead"><div class="metroname">${m.name} <span class="st">${m.st}</span></div>` +
    `<button class="reset" type="button"><span class="x">↺</span> National view</button></div>` +
    metroPanelCoreHTML(m);
  panel.querySelector('.reset')?.addEventListener('click', deselect);
}

// ── frame head + live region ──
function syncHead() {
  if (selected === null) {
    scopeEl.textContent = 'All 30 metros';
    verdictEl.className = 'verdict';
    verdictEl.textContent = '';
    hintEl.textContent = HERO_HINT_NATIONAL;
  } else {
    const m = VIEWS[selected];
    scopeEl.innerHTML = `${m.name} <span class="st">${m.st}</span>`;
    verdictEl.className = 'verdict ' + (m.net >= 0 ? 'pos' : 'neg');
    verdictEl.textContent = verdictShort(m.net);
    hintEl.textContent = HERO_HINT_SELECTED;
  }
}

function announce() {
  live.textContent = selected === null ? liveNational() : liveMetro(VIEWS[selected]);
}

// ── map ──
const mapHandles = buildMap(
  mapSvg,
  VIEWS,
  () => selected,
  MAX_NET,
  '/vendor/us-states-10m.json',
  (i) => select(i),
  deselect,
  hoverMetro,
  tip
);

function hoverMetro(i: number, on: boolean) {
  if (denseHandles) denseHandles.highlight(i, on);
  (d3select(mapSvg).selectAll('g.dot').select('.core') as any).attr('opacity', (d: MetroView) =>
    on ? (d.i === i ? 1 : 0.4) : 1
  );
}

// ── selection state machine ──
function refresh() {
  mapHandles.redraw();
  renderHero();
  renderPanel();
  syncHead();
  pick.value = selected === null ? '' : String(selected);
  announce();
}
function select(i: number) {
  selected = i;
  refresh();
}
function deselect() {
  selected = null;
  refresh();
}
function toggle(i: number) {
  selected === i ? deselect() : select(i);
}

// ── controls ──
pick.addEventListener('change', function () {
  this.value === '' ? deselect() : select(+this.value);
});

addEventListener('keydown', (e) => {
  const tag = (document.activeElement?.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  if (e.key === 'Escape') {
    tip.hide();
    if (selected !== null) deselect();
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const cur = selected === null ? -1 : selected;
    select((((cur + dir) % VIEWS.length) + VIEWS.length) % VIEWS.length);
  }
});

let wasMobile = isMobile();
addEventListener('resize', () => {
  const now = isMobile();
  if (now !== wasMobile) {
    wasMobile = now;
    renderHero();
    syncHead();
  }
});

// ── init: overview-first national view; fetch the directed matrix for the dense chord ──
refresh();
fetch('/data/metro_pairs.json')
  .then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  })
  .then((pairs: any[]) => {
    const n = VIEWS.length;
    const mx = Array.from({ length: n }, () => new Array(n).fill(0));
    for (const p of pairs) {
      const i = CBSA_TO_INDEX.get(p.origin_cbsa);
      const j = CBSA_TO_INDEX.get(p.dest_cbsa);
      if (i != null && j != null && i !== j) mx[i][j] += p.people;
    }
    matrix = mx;
    renderHero();
  })
  .catch(() => {
    fetchFailed = true;
    renderHero();
  });
