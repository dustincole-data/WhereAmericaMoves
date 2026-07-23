// Shared data layer — turns the baked JSON into the index-aligned view model the
// frame, chord, map and panel all read. Imported at build (Astro SSR) and bundled
// into the client island; metro_pairs (the directed matrix) is fetched separately.

import summary from '../data/metro_summary.json';
import buildMeta from '../data/build_meta.json';
import { METROS } from '../../scripts/metros';

export interface Partner {
  cbsa: string;
  name: string;
  slug: string;
  in: number;
  out: number;
  net: number;
}

export interface MetroView {
  i: number; // ring order = METROS order (population desc)
  cbsa: string;
  name: string; // short display
  st: string; // state cluster (muted)
  slug: string;
  full: string; // official CBSA title (aria / title)
  lat: number;
  lon: number;
  net: number;
  total_in: number;
  total_out: number;
  agi_in: number | null;
  agi_out: number | null;
  rest_in: number; // rest_of_us_in_direct + _in_suppressed
  rest_out: number;
  rest_sup_total: number; // _in_suppressed + _out_suppressed
  partners: Partner[]; // combined top partners (in/out/net)
}

const byCbsa = new Map<string, any>((summary as any[]).map((s) => [s.cbsa, s]));

export const META = buildMeta as {
  year_pair: string;
  irs_source: string;
  metro_count: number;
  inter_metro_total: number;
  generated_utc: string;
};

/** Views in ring order (METROS order). i is the stable index used by the chord matrix. */
export const VIEWS: MetroView[] = METROS.map((m, i) => {
  const s = byCbsa.get(m.cbsa);
  return {
    i,
    cbsa: m.cbsa,
    name: s.name,
    st: s.state_abbr,
    slug: s.slug,
    full: s.full_name,
    lat: m.lat,
    lon: m.lon,
    net: s.net,
    total_in: s.total_in,
    total_out: s.total_out,
    agi_in: s.agi_avg_in_dollars,
    agi_out: s.agi_avg_out_dollars,
    rest_in: s.rest_of_us_in_direct + s.rest_of_us_in_suppressed,
    rest_out: s.rest_of_us_out_direct + s.rest_of_us_out_suppressed,
    rest_sup_total: s.rest_of_us_in_suppressed + s.rest_of_us_out_suppressed,
    partners: s.top_partners,
  };
});

export const CBSA_TO_INDEX = new Map<string, number>(VIEWS.map((v) => [v.cbsa, v.i]));
export const MAX_NET = Math.max(1, ...VIEWS.map((v) => Math.abs(v.net)));
export const VIEW_BY_SLUG = new Map<string, MetroView>(VIEWS.map((v) => [v.slug, v]));

/** national tallies */
export const N_DEST = VIEWS.filter((v) => v.net > 0).length;
export const N_DEPART = VIEWS.filter((v) => v.net < 0).length;
export const N_EVEN = VIEWS.filter((v) => v.net === 0).length;
export const TOP_GAIN = VIEWS.reduce((a, b) => (b.net > a.net ? b : a));
export const TOP_LOSS = VIEWS.reduce((a, b) => (b.net < a.net ? b : a));
