// The text layer — every user-facing string VERBATIM from ticket 07, plus the
// panel HTML builders shared between SSR share pages and the client island so the
// copy lives in exactly one place. {tokens} bind to the 06 contract (07 §9).

import { fmtInt, fmtSigned, fmtAgi, gainLose, verdictArticle, approxTotal, agiAxis } from './format';
import type { MetroView } from './data';
import { META, N_DEST, N_DEPART, N_EVEN, TOP_GAIN, TOP_LOSS, VIEWS } from './data';

const N = VIEWS.length;

const YR = META.year_pair.replace('-', '–'); // en-dash for display (the one non-U+2212 exception)

// ── Frame (07 §3) ──
export const HEADLINE = 'America keeps moving south and west.';
export const DEK_SENTENCE1 =
  'Every year the IRS quietly records where households filed their taxes from — and where they filed the year before.';
export const DEK =
  'Every year the IRS quietly records where households filed their taxes from — and where they filed the year before. The ring below is the <em>30 largest</em> U.S. metros, plus <em>Louisville</em>, trading people all at once; click any metro, on the ring or the map, to see who it trades with, whether it&rsquo;s <em>gaining or losing</em>, and what those movers earn.';

// ── Hints (07 §4) ──
export const HERO_HINT_NATIONAL =
  'Each ribbon is people exchanged between two metros; colour is net direction (cool = gaining, warm = leaving). Hover a metro on the map to link it here.';
export const HERO_HINT_SELECTED_DESKTOP =
  'Its ribbons are lit; the other 30 metros are dimmed to context. Click the centre or “National view” to reset.';
export const HERO_HINT_SELECTED_MOBILE =
  'Its top partner metros ring the hub; arc colour is net direction with that partner. Rest of U.S. is the muted base spoke.';
export const MAP_HINT = 'Dot size = total movers (in + out) · fill = net direction.';

// ── At-rest / loading / error (07 §4.4, §4.5, §8) ──
export const MOBILE_PLACEHOLDER_1 = 'Tap a metro on the map above';
export const MOBILE_PLACEHOLDER_2 = 'to see who it trades people with.';
export const LOADING = 'Drawing the ring…';
export const FETCH_FAIL = 'The ring couldn’t load. Refresh to try again — the map and summary still work.';

// ── Ring-centre (07 §4.1, §4.2) ──
export const RING_CENTER_NATIONAL = '31 metros, one year';
export const RING_CENTER_RESET = '↺ national view';

// ── Accessibility copy (07 §6) ──
export const HERO_ARIA =
  'Migration chord of the 31 largest U.S. metros — the 30 biggest, plus Louisville — sized by people exchanged and coloured by net direction.';
export const MAP_ARIA = 'U.S. metro net-migration map; use the menu above, or Tab to a metro, to select it.';
export const SELECT_LABEL = 'Choose a metro';

export const dotAria = (m: MetroView): string =>
  `${m.name} ${m.st}: net ${fmtSigned(m.net)}, ${gainLose(m.net)} people. Select.`;

export const liveNational = (): string => `National view. ${N_DEST} of ${N} metros are gaining people.`;

export const liveMetro = (m: MetroView): string => {
  const base = `${m.name}, ${m.st} selected. ${fmtInt(m.total_in)} moved in, ${fmtInt(
    m.total_out
  )} moved out, net ${fmtSigned(m.net)}, ${gainLose(m.net)} people.`;
  if (m.agi_in == null || m.agi_out == null) return `${base} Average income isn’t available for this metro.`;
  return `${base} Average AGI ${fmtAgi(m.agi_in)} in versus ${fmtAgi(m.agi_out)} out.`;
};

// ── National panel (07 §4.1) ──
export function nationalPanelHTML(): string {
  const evenClause = N_EVEN > 0 ? ` (and ${N_EVEN} in balance)` : '';
  return `
  <div class="panelhead"><div class="panel-title" style="margin:0">The national picture · at rest</div></div>
  <div class="nat">
    <p class="lead">Of these <b>${N}</b> metros — the 30 largest, plus Louisville — <b class="pos">${N_DEST}</b> are net destinations and <b class="neg">${N_DEPART}</b> are net departures${evenClause}. They trade about <b>${approxTotal(
      META.inter_metro_total
    )}</b> people with one another in a year — every ribbon in the ring.</p>
    <div class="ext">
      <div class="c"><div class="lab">Biggest gain</div><div class="m">${TOP_GAIN.name}</div><div class="f pos">${fmtSigned(
        TOP_GAIN.net
      )} net</div></div>
      <div class="c"><div class="lab">Biggest loss</div><div class="m">${TOP_LOSS.name}</div><div class="f neg">${fmtSigned(
        TOP_LOSS.net
      )} net</div></div>
    </div>
    <div class="cue"><b>Click any metro</b> — on the ring or the map — to light up its exchanges and read its in / out / net and what its movers earn.</div>
  </div>`;
}

// ── Metro readout core (07 §4.2, §5.2–§5.4) — identical in the explorer and on share pages ──
function agiSub(v: number | null): string {
  return v == null ? '—' : `${fmtAgi(v)} avg AGI`;
}

function restLineHTML(m: MetroView): string {
  const head = `<b>Rest of U.S.</b> — <span class="mono">${fmtInt(m.rest_in)}</span> in · <span class="mono">${fmtInt(
    m.rest_out
  )}</span> out with everywhere outside the 31 metros`;
  if (m.rest_sup_total > 0) {
    return `<div class="restline">${head}, including <span class="mono">${fmtInt(
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
  const cap = (cls: string, v: number, label: string) =>
    `<div class="end ${cls}" style="left:${sx(v)}%"></div><div class="cap ${cls}" style="left:${sx(
      v
    )}%">${label} ${fmtAgi(v)}</div>`;
  return `
  <div class="income">
    <div class="hd"><span class="t">What movers earn · avg AGI</span><span class="note">income rides the readout, not the mark</span></div>
    <div class="db">
      <div class="track"></div>
      ${cap('in', m.agi_in, 'in')}
      ${cap('out', m.agi_out, 'out')}
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
export function metroPanelCoreHTML(m: MetroView): string {
  const v = m.net >= 0 ? 'pos' : 'neg';
  return `
  <div class="verdict ${v}" style="font-family:var(--font-serif);font-style:italic;font-size:14px;margin:-2px 0 11px">${verdictArticle(
    m.net
  )}</div>
  <div class="readout">
    <div class="cell"><div class="lab">Moved in</div><div class="fig">${fmtInt(
      m.total_in
    )}</div><div class="sub">${agiSub(m.agi_in)}</div></div>
    <div class="cell"><div class="lab">Moved out</div><div class="fig">${fmtInt(
      m.total_out
    )}</div><div class="sub">${agiSub(m.agi_out)}</div></div>
    <div class="cell"><div class="lab">Net</div><div class="fig ${v}">${fmtSigned(
      m.net
    )}</div><div class="sub ${v}">${gainLose(m.net)} people</div></div>
  </div>
  ${restLineHTML(m)}
  ${incomeHTML(m)}`;
}
