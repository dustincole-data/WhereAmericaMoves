// Every user-visible string in Where America Moves v2.
//
// The spine is Beauty 06: the subject is THE RECORD, not the movement. Four beats —
// ① the withheld quarter · ② no county won · ③ no rates · ④ 7 of 870 pairs with no
// disclosed flow — of which three are facts about the publisher's record and exactly one
// (② ) is a fact about our checking. The second our-side finding, that nothing here is
// corroborated, is in the limits block, which is what keeps this from being a piece about
// our pipeline.
//
// Every figure below is read out of the package at build. Nothing is typed in, and nothing
// is derived: where a number needed arithmetic to reach, it is not here.
//
// Descriptive verbs only. All three claims are `register: descriptive` with `unlock: null`,
// which blocks the associational tier too — no "is associated with", no "correlates with",
// and obviously nothing causal.

import { say, join, type CopyRecord } from './record';
import { fmtInt, fmtSigned } from '../lib/format';
import {
  C0003,
  C0005,
  C0006,
  WITHHELD,
  ABSENT_PAIRS,
  FRAME_PAIRS,
  UNIVERSE,
  MANIFEST,
  PACKAGE_STAMP,
  TOTALS_BY_CBSA,
  frameMeta,
  type MetroTotals,
} from '../lib/package';
import { METRO_BY_CBSA } from '../lib/metros';

const N_METROS = UNIVERSE.size;

// ── the frame ──────────────────────────────────────────────────────────────────

/** 06 keeps the title. It poses the question the piece qualifies, and it names no measured
    quantity, so the naming rule does not reach it. */
export const SITE_NAME = say('Where America Moves', 'apparatus');
export const HOME_TITLE = say('Where America Moves: what the record cannot say', 'apparatus');
export const HOME_DESC = say(
  `${C0003.text} More than one in four of them cannot be put on a map.`,
  'C0003'
);

// ── the plate ──────────────────────────────────────────────────────────────────

/** 06's headline, and the one the corrected plate already carries. Two defects were caught
    in it after it had shipped into a built asset: "one in four" is 25% against 27.43%, and
    understating the absence is the one direction this piece cannot afford; and "these
    moves" was the wrong noun, since C0003 counts people and a move here is a change of
    filing address. The lint rules on both mechanically now. */
export const HEADLINE = say('More than one in four of them cannot be put on a map.', 'C0003');

export const STANDFIRST: CopyRecord[] = [
  say(C0003.text, 'C0003'),
  say('They are tax filers and their dependents, not residents.', 'apparatus'),
  say(
    `${fmtInt(WITHHELD)} of them are inside that total and outside every map of it: counted, and attributable to no pair of counties.`,
    'C0003'
  ),
  say(
    `The IRS withholds any county-to-county flow below ${MANIFEST.source.disclosure_floor.value} returns.`,
    'apparatus'
  ),
];

export const REGISTER_CLAIM = say('The claim · one row · gate-confirmed · C0003', 'apparatus');
export const BAR_DISCLOSED = say('attributable to a specific pair of counties', 'apparatus');
export const BAR_WITHHELD = say(fmtInt(WITHHELD), 'C0003');
export const BAR_WITHHELD_SUB: CopyRecord[] = [
  say('below the disclosure floor', 'apparatus'),
  say('counted, not locatable', 'apparatus'),
];

/** The frame is a different universe and the register line has to say so, or the crowd
    reads as a part of the bar above it. */
export const REGISTER_FRAME = say(
  `The frame · a different universe, not a part of the bar above · ` +
    `${fmtInt(frameMeta('top_metro_relations').rows)} disclosed pairs among the ${N_METROS} metros in this piece · area is people`,
  'top_metro_relations'
);

/** The crowd is the complement. Rigor 13 confirmed the aggregate, so the piece may now say
    it out loud rather than leaving it to area alone — one sentence, the claim's own. */
export const COMPLEMENT = say(C0005.text, 'C0005');

export const LEGEND: CopyRecord[] = [
  say(
    'One mark is one directed pair of metros and its area is people. Hue is where the ' +
      'destination sits, walked west to east; a leader carries its origin’s color into its ' +
      'destination’s and bows right of its own direction of travel.',
    'apparatus'
  ),
  say(
    `${ABSENT_PAIRS} of ${FRAME_PAIRS} directed pairs have no disclosed flow at all, drawn open on an empty leader.`,
    'C0005'
  ),
  say('A missing mark means withheld or absent. It never means zero.', 'apparatus'),
  say(
    'The open mark’s disc is the smallest size this piece draws and its outer hairline is a ' +
      'marker, not an area. No cell is labeled, ranked or called out.',
    'apparatus'
  ),
];

// ── beat ② · no county won ─────────────────────────────────────────────────────
// The better hook, and it still does not lead: it is a county-level negative in a piece
// whose mark is metros, so the hero cannot draw it, and it is one clause away from "the win
// never survived checking" — which would make the piece about our pipeline. It carries no
// quantity at all, and that is its power rather than a gap.

export const BEAT_COUNTY: CopyRecord[] = [
  say('No county won.', 'apparatus'),
  say(
    'This record cannot say which county gained the most people. Not the biggest net gain, ' +
      'not the fastest-growing county, not a ranked top ten. Across the defensible ways to ' +
      'compute a county’s net migration, the leading county changes.',
    'apparatus'
  ),
  say('The instability is the finding. The superlative is not available.', 'apparatus'),
];

// ── beat ③ · no rates ──────────────────────────────────────────────────────────

export const BEAT_RATES: CopyRecord[] = [
  say('No rates.', 'apparatus'),
  say(
    'Nothing here can be expressed as a share of a place’s population. These counts are tax ' +
      'filers and their dependents; a population is residents. Dividing one by the other mixes ' +
      'two universes, and the gap between them is each place’s own share of non-filers. That ' +
      'share is not spread evenly across the places a migration story is usually about.',
    'apparatus'
  ),
];

// ── beat ④ · the pairs with no disclosed flow ──────────────────────────────────

export const BEAT_ABSENT: CopyRecord[] = [
  say(`${ABSENT_PAIRS} of ${FRAME_PAIRS} pairs are not there.`, 'C0005'),
  say(
    `Between every two of these ${N_METROS} metros there is a direction people could travel, and ` +
      `for ${ABSENT_PAIRS} of those directions the record discloses no flow at all.`,
    'C0005'
  ),
  say(
    'They are drawn: open marks, at the smallest size this piece draws, on an empty leader. ' +
      'An absent pair means withheld or absent, never zero.',
    'apparatus'
  ),
];

// ── the explorer ───────────────────────────────────────────────────────────────

export const EXPLORER_TITLE = say('Thirty metros, thirty different records', 'apparatus');
export const EXPLORER_LEAD = say(
  `Each of the ${N_METROS} metros in this piece carries its own share of moves the publisher ` +
    `did not attach to any specific county pair, and they are not alike. Pick one.`,
  'apparatus'
);
export const MAP_HINT = say('Mark area is people moving in and out. Hue is where the metro is.', 'apparatus');
export const MAP_ARIA = say(
  'The 30 metros in this piece, on a U.S. basemap. Tab to a metro, or use the menu above, to select it.',
  'apparatus'
);
export const HERO_ARIA = say(
  'Every disclosed directed pair among these metros, one mark each, at real geography. Mark area is people.',
  'apparatus'
);
export const SELECT_LABEL = say('Choose a metro', 'apparatus');
export const AT_REST = say('No metro selected. The whole crowd is lit.', 'apparatus');
export const RESET = say('Show every metro', 'apparatus');

// ── the metro readout ──────────────────────────────────────────────────────────

export interface MetroCopy {
  cbsa: string;
  slug: string;
  name: CopyRecord;
  state: CopyRecord;
  full: CopyRecord;
  title: CopyRecord;
  desc: CopyRecord;
  ogTitle: CopyRecord;
  labelIn: CopyRecord;
  labelOut: CopyRecord;
  labelNet: CopyRecord;
  figIn: CopyRecord;
  figOut: CopyRecord;
  figNet: CopyRecord;
  unit: CopyRecord;
  restHead: CopyRecord;
  restIn: CopyRecord;
  restOut: CopyRecord;
  supHead: CopyRecord;
  supIn: CopyRecord;
  supOut: CopyRecord;
  supNote: CopyRecord;
  partners: CopyRecord;
  aria: CopyRecord;
  totals: MetroTotals;
  /** DRAWN, never printed: the extent of this metro's unattributable residual against its
      disclosed rest-of-U.S. flow. A share is a ratio of two cells, which makes it a spoken
      aggregate needing its own claim — so the proportion is a mark and its components are
      the counts the package published. */
  supExtent: number;
}

/** Sums are conspicuously absent here, and v1 had two of them: `rest_in` added the direct
    and suppressed columns together, and `rest_sup_total` added the in and out residuals.
    Both are spoken aggregates of frame cells, which `contract.aggregation` says need a
    claim or a figure. Every number below is one cell, printed as itself. */
export function metroCopy(cbsa: string): MetroCopy {
  const m = METRO_BY_CBSA.get(cbsa)!;
  const t = TOTALS_BY_CBSA.get(cbsa)!;
  const F: 'metro_totals' = 'metro_totals';

  const figIn = say(fmtInt(t.total_in), F);
  const figOut = say(fmtInt(t.total_out), F);
  const figNet = say(fmtSigned(t.net), F);
  const supIn = say(fmtInt(t.rest_in_suppressed), F);
  const supOut = say(fmtInt(t.rest_out_suppressed), F);

  return {
    cbsa,
    slug: m.slug,
    name: say(m.short, 'apparatus'),
    state: say(m.state, 'apparatus'),
    full: say(m.full, 'apparatus'),
    title: say(`${m.short} · Where America Moves`, 'apparatus'),
    ogTitle: say(m.short, 'apparatus'),
    // No verdict word anywhere: `not_claimable` (D0019) says which metros are the net
    // destinations is not claimable, so the sign is printed and never named.
    desc: say(
      `${fmtInt(t.total_in)} moved in and ${fmtInt(t.total_out)} moved out of ${m.short}, ` +
        `for a net of ${fmtSigned(t.net)}. Another ${fmtInt(t.rest_in_suppressed)} arriving and ` +
        `${fmtInt(t.rest_out_suppressed)} leaving are in the record and attached to no county pair.`,
      F
    ),
    labelIn: say('Moved in', 'apparatus'),
    labelOut: say('Moved out', 'apparatus'),
    labelNet: say('Net', 'apparatus'),
    figIn,
    figOut,
    figNet,
    unit: say('people · tax filers and their dependents', 'apparatus'),
    restHead: say('Everywhere outside these 30 metros', 'apparatus'),
    restIn: say(fmtInt(t.rest_in_direct), F),
    restOut: say(fmtInt(t.rest_out_direct), F),
    supHead: say('Attached to no county pair', 'apparatus'),
    supIn,
    supOut,
    supNote: say(
      'These are the people the publisher counted in this metro’s totals and could not attribute ' +
        'to any specific pair of counties. They are not a rest-of-U.S. quantity, and the split ' +
        'cannot be recovered from this source.',
      'apparatus'
    ),
    partners: say(
      'Its own crowd, lit. Every disclosed pair this metro is one end of, at the size the ' +
        'publisher disclosed, in no order a reader can read as a ranking.',
      'apparatus'
    ),
    aria: say(`${m.short}, ${m.state}. Select to read its record.`, 'apparatus'),
    totals: t,
    supExtent:
      (t.rest_in_suppressed + t.rest_out_suppressed) /
      (t.rest_in_direct + t.rest_out_direct + t.rest_in_suppressed + t.rest_out_suppressed),
  };
}

// ── the limits block ───────────────────────────────────────────────────────────
// 06 puts the second our-side finding here rather than in the arc, and v1's dead rate mode
// is explained here in full, which serves the full-explainer preference for brand copy
// without putting the pipeline in the spine.

export const LIMITS_TITLE = say('What this piece cannot tell you', 'apparatus');

export const LIMITS: { head: CopyRecord; body: CopyRecord[] }[] = [
  {
    head: say('Nothing here is corroborated', 'apparatus'),
    body: [
      say(
        'The inbound and outbound files are one measurement in two layouts, so their agreement ' +
          'certifies nothing: the check that compares them subtracts a number from itself and ' +
          'cannot fail. “Confirmed against the inbound file” is not a sentence this project can write.',
        'apparatus'
      ),
    ],
  },
  {
    head: say('The per-capita view is gone, and it is not coming back', 'apparatus'),
    body: [
      say(
        'An earlier version of this piece had a toggle that divided every figure by a metro’s ' +
          'resident population. It has been removed, and not because it was hard to maintain.',
        'apparatus'
      ),
      say(
        'The numerator and the denominator were different universes. These counts are tax filers ' +
          'and their dependents, the individuals reported on individual income tax returns. A ' +
          'resident population is everyone. Non-filers appear nowhere in the numerator: the very ' +
          'poor, many elderly people, undocumented residents and some students are absent from ' +
          'every figure here, and nothing in this data reveals how many are missing.',
        'apparatus'
      ),
      say(
        'So every rate ran low, by each place’s own non-filing share. And that share is not ' +
          'spread evenly. It is largest exactly where a migration story usually goes looking. ' +
          'A number wrong in a pattern is worse than a number missing, because the pattern is ' +
          'the thing a reader takes away. The toggle is deleted rather than disabled: a ' +
          'prohibited measure sitting one boolean away from rendering is not a safe thing to keep.',
        'apparatus'
      ),
    ],
  },
  {
    head: say('Which metros are gaining is not claimable', 'apparatus'),
    body: [
      say(C0006.text, 'C0006'),
      say(
        'The count is claimable and the membership is not. Across the three defensible ways to ' +
          'decide a metro’s direction the count barely moves, but three of the thirty change side. ' +
          'So this piece prints every metro’s own net as a number and never calls one a gainer or ' +
          'a loser, and no map here colors a metro by direction.',
        'apparatus'
      ),
    ],
  },
  {
    head: say('The residual is not a rest-of-U.S. quantity', 'apparatus'),
    body: [
      say(
        'Each metro’s unattributable column is every move the publisher did not attach to a ' +
          'specific county pair. That includes moves inside the metro small enough to fall below ' +
          'the disclosure floor, which were therefore never subtracted along with the rest of the ' +
          'internal mass. The split cannot be recovered from this source. It is bounded rather ' +
          'than unknown, since every absent pair is under the floor. But it is not zero, and it ' +
          'is not the same size in every metro.',
        'apparatus'
      ),
    ],
  },
  {
    head: say('These thirty metros are a choice, and it is ours', 'apparatus'),
    body: [
      say(UNIVERSE.selection.rule.replace(/^the/, 'The') + '.', 'apparatus'),
      say(UNIVERSE.selection.measure + '.', 'apparatus'),
      say(
        'Population was chosen over migration volume deliberately: ranking metros by how many ' +
          'people they exchange would rank them on the same rows this piece then aggregates, so ' +
          'the set would be drawn by the numbers it exists to measure. The IRS did not choose ' +
          'these metros. This project did, and a different thirty would be a different set of ' +
          'numbers. It is also not a license to divide by population. Resident population ' +
          'selects the units and appears in no figure.',
        'apparatus'
      ),
      say(UNIVERSE.selection.source + '.', 'apparatus'),
    ],
  },
];

// ── the footer ─────────────────────────────────────────────────────────────────

export const METHOD: CopyRecord[] = [
  say(MANIFEST.source.attribution, 'apparatus'),
  say(
    'Figures are baked once at build from a verified package committed into this repository. ' +
      'Nothing updates live, and nothing is fetched at build.',
    'apparatus'
  ),
  say(
    'A unit is the county of the address on the return, so a move here is a change of filing ' +
      'address between the two years, not a dated relocation event.',
    'apparatus'
  ),
  say(
    `Metros are Core-Based Statistical Areas under the Census delineation of July 2023.`,
    'apparatus'
  ),
  say(MANIFEST.source.disclosure_floor.statement.split('Visible in the raw bytes')[0].trim(), 'apparatus'),
];

export const METHOD_LINK = say('irs.gov/statistics/soi-tax-stats-migration-data', 'apparatus');

/** 04's reader-visible stamp. A correction is a new package, not an edit to an old one —
    which means nothing unless the package identity is on the page. A hash is an identifier
    and not an assertion of quantity, which is why the lint's figure rule excludes hex runs;
    without that refinement the first stamped page would fail its own build. */
export const STAMP = say(`Every figure on this page comes from package ${PACKAGE_STAMP}`, 'apparatus');

export { join };
