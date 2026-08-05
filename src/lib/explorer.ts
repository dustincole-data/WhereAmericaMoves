// The explorer's state machine, and it is very small on purpose.
//
// It constructs NO copy. All thirty readouts are server-rendered into the page and this
// only decides which one is visible — so every string the reader can reach is in dist for
// the lint's backstop to read, and there is no template in the client bundle that could
// put a figure on screen behind the ledger's back. v1 built panel HTML in the browser from
// a shared builder; the builder is gone.
//
// Three jobs: swap the visible readout, ring the selected mark, and light that metro's own
// crowd inside the hero — which is the hero's marks filtered, not a second encoding.

import { buildMap, type MapMetro } from './map';

const el = <T extends Element>(sel: string) => document.querySelector(sel) as T | null;

const mapSvg = el<SVGSVGElement>('#map');
const payloadEl = el<HTMLScriptElement>('#map-data');
const field = el<HTMLElement>('#field');
const atRest = el<HTMLElement>('#atrest');
const picker = el<HTMLSelectElement>('#metroPick');
const live = el<HTMLElement>('#live');

if (mapSvg && payloadEl) {
  type Payload = { cbsa: string; lat: number; lon: number; through: number; hue: string; aria: string };
  const payload: Payload[] = JSON.parse(payloadEl.textContent || '[]');

  const panels = new Map<string, HTMLElement>();
  document.querySelectorAll<HTMLElement>('[data-metro-panel]').forEach((p) => {
    panels.set(p.dataset.metroPanel!, p);
    p.hidden = true;
  });

  const metros: MapMetro[] = payload.map((p) => ({
    cbsa: p.cbsa,
    slug: '',
    name: '',
    st: '',
    lat: p.lat,
    lon: p.lon,
    through: p.through,
    hue: p.hue,
    aria: p.aria,
  }));

  let selected: string | null = null;
  let litNodes: Element[] = [];

  /** The metro's own crowd: every mark it is one end of. The hero already carries
      data-origin and data-dest per mark, so this is a filter over geometry already on the
      page rather than a second chart of the same cells. */
  function lightCrowd(cbsa: string | null) {
    if (!field) return;
    litNodes.forEach((n) => n.classList.remove('lit'));
    litNodes = [];
    if (!cbsa) {
      field.classList.remove('focused');
      return;
    }
    field.classList.add('focused');
    litNodes = [
      ...field.querySelectorAll(`[data-dest="${cbsa}"], [data-origin="${cbsa}"], [data-metro="${cbsa}"]`),
    ];
    litNodes.forEach((n) => n.classList.add('lit'));
  }

  function select(cbsa: string | null) {
    selected = cbsa;
    panels.forEach((p, key) => {
      p.hidden = key !== cbsa;
    });
    if (atRest) atRest.hidden = cbsa !== null;
    lightCrowd(cbsa);
    handles.redraw();
    if (picker && picker.value !== (cbsa ?? '')) picker.value = cbsa ?? '';
    if (live) {
      const p = cbsa ? panels.get(cbsa) : null;
      live.textContent = p ? p.querySelector('h2')?.textContent || '' : atRest?.textContent || '';
    }
  }

  const handles = buildMap(
    mapSvg,
    metros,
    () => selected,
    '/vendor/us-states-10m.json',
    (cbsa) => select(cbsa),
    () => select(null),
    () => {}
  );

  picker?.addEventListener('change', () => select(picker.value || null));

  // Deep link from a metro page, so the two surfaces agree: /#12060 opens on that metro.
  const initial = decodeURIComponent(location.hash.replace('#', ''));
  if (initial && panels.has(initial)) select(initial);
  else select(null);
}
