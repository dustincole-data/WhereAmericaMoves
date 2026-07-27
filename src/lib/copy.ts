// The text layer — every user-facing string VERBATIM from ticket 07, plus the
// panel HTML builders shared between SSR share pages and the client island so the
// copy lives in exactly one place. {tokens} bind to the 06 contract (07 §9).

import {
  fmtInt,
  fmtSigned,
  fmtAgi,
  fmtRate,
  fmtRateAbs,
  gainLose,
  verdictArticle,
  approxTotal,
  agiAxis,
  spreadHandles,
  CAP_MERGE_GAP,
} from './format';
import type { MetroView, Mode } from './data';
import {
  META,
  N_DEST,
  N_DEPART,
  N_EVEN,
  TOP_GAIN,
  TOP_LOSS,
  TOP_GAIN_RATE,
  TOP_LOSS_RATE,
  VIEWS,
} from './data';

const N = VIEWS.length;

const YR = META.year_pair.replace('-', '–'); // en-dash for display (the one non-U+2212 exception)

// ── Frame (07 §3) ──
export const HEADLINE = 'America keeps moving south and west.';
export const DEK_SENTENCE1 =
  'Every year the IRS quietly records where households filed their taxes from — and where they filed the year before.';
export const DEK =
  'Every year the IRS quietly records where households filed their taxes from — and where they filed the year before. The ring below is the <em>30 largest</em> U.S. metros trading people all at once; click any metro, on the ring or the map, to see who it trades with, whether it&rsquo;s <em>gaining or losing</em>, and what those movers earn.';

// ── Hints (07 §4) ──
export const HERO_HINT_NATIONAL =
  'Each ribbon is people exchanged between two metros; colour is net direction (cool = gaining, warm = leaving). Pick a metro on the map to light it here.';
export const HERO_HINT_SELECTED =
  'Its ribbons are lit; the other 29 metros are dimmed to context. Use the ring centre or “National view” to reset.';
// the share pages keep the focus-chord form, so they keep its own hint
export const HERO_HINT_FOCUS_CHORD =
  'Its top partner metros ring the hub; arc colour is net direction with that partner. Rest of U.S. is the muted base spoke.';
export const MAP_HINT = 'Dot size = total movers (in + out) · fill = net direction.';

// ── Per-capita mode (09 §6) — additive; every string above stays verbatim in People mode ──
export const MODE_GROUP_LABEL = 'Show figures as';
export const MODE_LABEL_PEOPLE = 'People';
export const MODE_LABEL_RATE = 'Per 1,000 residents';
export const MODE_LABEL_RATE_SHORT = 'Per 1,000';
export const HERO_HINT_NATIONAL_RATE =
  'Each ribbon is people exchanged between two metros, per 1,000 residents of the metro they left; colour is net direction (cool = gaining, warm = leaving). Pick a metro on the map to light it here.';
export const MAP_HINT_RATE = 'Dot size = total movers (in + out) per 1,000 residents · fill = net direction.';
/** The numerator and denominator are different universes; the page has to say so (09 §6.5). */
export const DENOMINATOR_NOTE =
  'Rates use Census 2023 metro population. IRS migration counts tax filers and their dependents — not every resident — so rates run slightly low.';

// ── At-rest / loading / error (07 §4.4, §4.5, §8) ──
export const LOADING = 'Drawing the ring…';
export const FETCH_FAIL = 'The ring couldn’t load. Refresh to try again — the map and summary still work.';

// ── Ring-centre (07 §4.1, §4.2) ──
export const RING_CENTER_NATIONAL = '30 metros, one year';
export const RING_CENTER_RESET = '↺ national view';

// ── Accessibility copy (07 §6) ──
export const HERO_ARIA =
  'Migration chord of the 30 largest U.S. metros, sized by people exchanged and coloured by net direction.';
export const MAP_ARIA = 'U.S. metro net-migration map; use the menu above, or Tab to a metro, to select it.';
export const SELECT_LABEL = 'Choose a metro';

export const dotAria = (m: MetroView, mode: Mode = 'people'): string =>
  mode === 'per1k'
    ? `${m.name} ${m.st}: net ${fmtRate(m.net_rate)} per 1,000 residents, ${gainLose(m.net)}. Select.`
    : `${m.name} ${m.st}: net ${fmtSigned(m.net)}, ${gainLose(m.net)} people. Select.`;

/** Unchanged in both modes: the destination count is identical under a positive rescale (09 §2.3). */
export const liveNational = (): string => `National view. ${N_DEST} of ${N} metros are gaining people.`;

export const liveMetro = (m: MetroView, mode: Mode = 'people'): string => {
  const base =
    mode === 'per1k'
      ? `${m.name}, ${m.st} selected. ${fmtRateAbs(m.in_rate)} moved in per 1,000 residents, ${fmtRateAbs(
          m.out_rate
        )} moved out, net ${fmtRate(m.net_rate)}, ${gainLose(m.net)}.`
      : `${m.name}, ${m.st} selected. ${fmtInt(m.total_in)} moved in, ${fmtInt(
          m.total_out
        )} moved out, net ${fmtSigned(m.net)}, ${gainLose(m.net)} people.`;
  // AGI never normalises — it is already a per-person average (09 §5.1).
  if (m.agi_in == null || m.agi_out == null) return `${base} Average income isn’t available for this metro.`;
  return `${base} Average AGI ${fmtAgi(m.agi_in)} in versus ${fmtAgi(m.agi_out)} out.`;
};

// ── National panel (07 §4.1) ──
export function nationalPanelHTML(mode: Mode = 'people'): string {
  const evenClause = N_EVEN > 0 ? ` (and ${N_EVEN} in balance)` : '';
  // Only the two extremes cells move: the lead sentence's counts are mode-independent
  // (09 §2.3) and the "about N million" total is a national count, not a comparison.
  const per = mode === 'per1k';
  const gain = per ? TOP_GAIN_RATE : TOP_GAIN;
  const loss = per ? TOP_LOSS_RATE : TOP_LOSS;
  const fig = (m: MetroView) => (per ? `${fmtRate(m.net_rate)} net per 1,000` : `${fmtSigned(m.net)} net`);
  return `
  <div class="panelhead"><div class="panel-title" style="margin:0">The national picture · at rest</div></div>
  <div class="nat">
    <p class="lead">Of the <b>${N}</b> largest U.S. metros, <b class="pos">${N_DEST}</b> are net destinations and <b class="neg">${N_DEPART}</b> are net departures${evenClause}. They trade <b>${approxTotal(
      META.inter_metro_total
    )}</b> people with one another in a year — every ribbon in the ring.</p>
    <div class="ext">
      <div class="c"><div class="lab">Biggest gain</div><div class="m">${gain.name}</div><div class="f pos">${fig(
        gain
      )}</div></div>
      <div class="c"><div class="lab">Biggest loss</div><div class="m">${loss.name}</div><div class="f neg">${fig(
        loss
      )}</div></div>
    </div>
    <div class="cue"><b>Click any metro</b> — on the ring or the map — to light up its exchanges and read its in / out / net and what its movers earn.</div>
  </div>`;
}

// ── Metro readout core (07 §4.2, §5.2–§5.4) — identical in the explorer and on share pages ──
function agiSub(v: number | null): string {
  return v == null ? '—' : `${fmtAgi(v)} avg AGI`;
}

function restLineHTML(m: MetroView, mode: Mode = 'people'): string {
  // Counts, so they normalise the same way the headline figures do.
  const rate = (n: number) => fmtRateAbs((n / m.pop) * 1000);
  const f = mode === 'per1k' ? rate : fmtInt;
  const head = `<b>Rest of U.S.</b> — <span class="mono">${f(m.rest_in)}</span> in · <span class="mono">${f(
    m.rest_out
  )}</span> out with everywhere outside the 30 metros`;
  if (m.rest_sup_total > 0) {
    return `<div class="restline">${head}, including <span class="mono">${f(
      m.rest_sup_total
    )}</span> in small flows the IRS suppressed and we keep separate.</div>`;
  }
  return `<div class="restline">${head}.</div>`;
}

function incomeHTML(m: MetroView): string {
  if (m.agi_in == null || m.agi_out == null) {
    return `<div class="income"><div class="guard">Average income isn’t available for this metro — too many of its flows were too small to disclose.</div></div>`;
  }
  const { min, max } = agiAxis(m.agi_in, m.agi_out);
  const sx = (x: number) => ((x - min) / (max - min || 1)) * 100;
  const xIn = sx(m.agi_in),
    xOut = sx(m.agi_out);
  // Close incomes land both handles — and both captions — on the same spot. Hold the
  // handles a readable distance apart, and once the captions would overprint, replace
  // them with one merged readout.
  const [pIn, pOut] = spreadHandles(xIn, xOut);
  const merged = Math.abs(xIn - xOut) < CAP_MERGE_GAP;
  const cap = (cls: string, v: number, label: string, p: number) =>
    `<div class="end ${cls}" style="left:${p}%"></div>` +
    (merged ? '' : `<div class="cap ${cls}" style="left:${p}%">${label} ${fmtAgi(v)}</div>`);
  const mergedCap = `<div class="cap both"><span class="in">in ${fmtAgi(m.agi_in)}</span> · <span class="out">out ${fmtAgi(
    m.agi_out
  )}</span></div>`;
  return `
  <div class="income">
    <div class="hd"><span class="t">What movers earn · avg AGI</span><span class="note">income rides the readout, not the mark</span></div>
    <div class="db">
      <div class="track"></div>
      ${merged ? mergedCap : ''}
      ${cap('in', m.agi_in, 'in', pIn)}
      ${cap('out', m.agi_out, 'out', pOut)}
      <div class="axmin">${fmtAgi(min)}</div>
      <div class="axmax">${fmtAgi(max)}</div>
    </div>
  </div>`;
}

// ── Titles + OG/meta strings (08 §8.3–§8.4) ──
export const HOME_TITLE = 'Where America Moves — who moves where, and what they earn';
export const HOME_DESC = DEK_SENTENCE1;
export const OG_HOME_TITLE = 'Where America Moves';
export const OG_HOME_DESC = DEK_SENTENCE1;

export const pageMetroTitle = (m: MetroView): string => `${m.name} — Where America Moves`;
export const ogMetroTitle = (m: MetroView): string => m.name;
export const metroDesc = (m: MetroView): string =>
  `${fmtSigned(m.net)} net · ${gainLose(m.net)} people. ${fmtInt(m.total_in)} moved in, ${fmtInt(
    m.total_out
  )} out — and what they earn, in ${YR} IRS data.`;

/** verdict + 3-cell readout + rest line + income. Shared verbatim; the surrounding
    header (name + reset chip on the explorer, page heading + link on share) differs. */
export function metroPanelCoreHTML(m: MetroView, mode: Mode = 'people'): string {
  const v = m.net >= 0 ? 'pos' : 'neg'; // sign is mode-independent (09 §2.3)
  const per = mode === 'per1k';
  // In rate mode the sub-lines carry the unit; AGI keeps riding the dumbbell below,
  // in dollars, in both modes — it is already a per-person average (09 §5.1).
  const figIn = per ? fmtRateAbs(m.in_rate) : fmtInt(m.total_in);
  const figOut = per ? fmtRateAbs(m.out_rate) : fmtInt(m.total_out);
  const figNet = per ? fmtRate(m.net_rate) : fmtSigned(m.net);
  const subIn = per ? 'per 1,000 residents' : agiSub(m.agi_in);
  const subOut = per ? 'per 1,000 residents' : agiSub(m.agi_out);
  const subNet = per ? `${gainLose(m.net)}, per 1,000` : `${gainLose(m.net)} people`;
  return `
  <div class="verdict ${v}" style="font-family:var(--font-serif);font-style:italic;font-size:14px;margin:-2px 0 11px">${verdictArticle(
    m.net
  )}</div>
  <div class="readout">
    <div class="cell"><div class="lab">Moved in</div><div class="fig">${figIn}</div><div class="sub">${subIn}</div></div>
    <div class="cell"><div class="lab">Moved out</div><div class="fig">${figOut}</div><div class="sub">${subOut}</div></div>
    <div class="cell"><div class="lab">Net</div><div class="fig ${v}">${figNet}</div><div class="sub ${v}">${subNet}</div></div>
  </div>
  ${restLineHTML(m, mode)}
  ${incomeHTML(m)}`;
}
