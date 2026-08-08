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
  TOTAL_MOVERS,
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

/** Two records, where the built page had four. The gate's first objection was volume, and
    the two that went were not cut for length: both were saying at the top of the page what
    the drawing says lower down. The withheld figure is the claim register's own caption, and
    the floor is the note under it. Nothing is lost; it stops being said twice. */
export const STANDFIRST: CopyRecord[] = [
  say(C0003.text, 'C0003'),
  say('They are tax filers and their dependents, not residents.', 'apparatus'),
];

/** The noun, not a pronoun. "them" and "that total" both reached back to a number the reader
    last saw a full screen above, and the NEAREST total on the way down is the crowd's
    1,555,397 — a different universe the piece exists to keep separate. Naming both figures is
    three words and closes the only route by which the page invited its own forbidden sum. */
export const WITHHELD_LINE = say(
  `${fmtInt(WITHHELD)} of the ${fmtInt(TOTAL_MOVERS)} are inside that total and outside every map of it: counted, and attributable to no pair of counties.`,
  'C0003'
);

export const FLOOR_NOTE = say(
  `The IRS withholds any county-to-county flow below ${MANIFEST.source.disclosure_floor.value} returns.`,
  'apparatus'
);

export const REGISTER_CLAIM = say('The claim · one row · gate-confirmed · C0003', 'apparatus');
export const BAR_DISCLOSED = say('attributable to a specific pair of counties', 'apparatus');
export const BAR_WITHHELD = say(fmtInt(WITHHELD), 'C0003');
export const BAR_WITHHELD_SUB: CopyRecord[] = [
  say('below the disclosure floor', 'apparatus'),
  say('counted, not locatable', 'apparatus'),
];

/** The frame is a different universe and the register line has to say so, or the crowd
    reads as a part of the bar. The crowd now comes first, so the bar it is not a part of is
    below it rather than above — C's two-labelled-registers rule is about the labelling, not
    about which one is on top. */
export const REGISTER_FRAME = say(
  `The frame · ${fmtInt(frameMeta('top_metro_relations').rows)} disclosed pairs among these ${N_METROS} metros · ` +
    `a different universe from the bar below`,
  'top_metro_relations'
);

/** The crowd is the complement. Rigor 13 confirmed the aggregate, so the piece may now say
    it out loud rather than leaving it to area alone — one sentence, the claim's own. */
export const COMPLEMENT = say(C0005.text, 'C0005');

/** Cut hard 2026-08-08 — Dustin: "way too much text," this said four times what the
    panel above the mark, the on-chart key and the beat below it already say once
    each. One record left: the one fact those three places do not carry, and it is
    load-bearing. `not_claimable` forbids "a map that colours a metro by direction as
    a claimed fact", so the resting cluster carries its two published columns as two
    parts rather than a verdict as one colour — this is the sentence that stops a
    reader decoding the cut as the thing the package refused to claim. */
export const LEGEND: CopyRecord[] = [
  say(
    'A resting cluster is cut into two published columns — arrived and left — never ' +
      'coloured by which way the metro’s total went.',
    'apparatus'
  ),
];

/** The key that rides with the picture. Three short spans: the unit, the absence, and the
    two things a reader would otherwise be entitled to assume and be wrong about.

    The scale sentence is here because the scale is DERIVED PER VIEW and never printed. A
    single scale across all thirty selections was measured against the real frame and
    rejected: the largest pairwise net in the package is over a hundred times the largest in
    the quietest metro, so one scale draws half the set as a field of single dots. The cost
    is that two selections are not comparable to each other, and a reader is told that
    rather than left to assume otherwise. */
export const HERO_LINES: CopyRecord[] = [
  say(
    'Every dot is the same size, so more dots is more people. An exchange too small to fill ' +
      'a dot is still drawn at one dot, and those are not to scale.',
    'apparatus'
  ),
  say(
    'A dashed empty ring is a direction the record discloses nothing for. It means withheld ' +
      'or absent. It never means zero.',
    'apparatus'
  ),
  say(
    'Sizes compare inside one view rather than between two. Where a cluster sits is a rough ' +
      'map on a wide screen and a grid on a phone, and carries no quantity either way.',
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
    'Across the defensible ways to compute a county’s net migration, the county in front ' +
      'changes. The instability is the finding.',
    'apparatus'
  ),
];

// ── beat ③ · no rates ──────────────────────────────────────────────────────────

export const BEAT_RATES: CopyRecord[] = [
  say('No rates.', 'apparatus'),
  say(
    'Nothing here can be a share of a place’s population. These counts are filers; a ' +
      'population is residents. Dividing one by the other mixes two universes.',
    'apparatus'
  ),
];

// ── beat ④ · the pairs with no disclosed flow ──────────────────────────────────

export const BEAT_ABSENT: CopyRecord[] = [
  say(`${ABSENT_PAIRS} of ${FRAME_PAIRS} pairs are not there.`, 'C0005'),
  say(
    `Between every two of these ${N_METROS} metros there is a direction people could travel, and ` +
      `for ${ABSENT_PAIRS} of those directions the record discloses no flow at all. Select either ` +
      `end and the ring at the other is drawn empty.`,
    'C0005'
  ),
];

// ── the hero's own controls ────────────────────────────────────────────────────
// There is no explorer section any more. The crowd is the selector: the reader picks a
// landmark inside the picture rather than scrolling past four beats to a second chart of
// the same country. `EXPLORER_TITLE`, `EXPLORER_LEAD`, `MAP_HINT` and `MAP_ARIA` are gone
// with the section they titled.

export const HERO_ARIA = say(
  'Thirty metros, each a cluster of dots sized by how many people it moved, divided into ' +
    'who arrived and who left. Tab to a metro to redraw every other one as its exchange ' +
    'with that metro.',
  'apparatus'
);
export const SELECT_LABEL = say('Choose a metro', 'apparatus');

/** Two invitations, one on screen at a time, and both server-rendered — the client swaps
    which is hidden and writes no text of its own. */
export const AT_REST = say(
  'Each metro is a cluster of dots. Green is who arrived, red is who left, and the dashed ' +
    'line across it is where the two would be even. Choose one to see how it trades with ' +
    'the rest.',
  'apparatus'
);
export const ON_SELECT = say(
  'Every other metro is now its exchange with the one you chose. Green means more people ' +
    'came than went. Red means more went than came.',
  'apparatus'
);
export const RESET = say('Show every metro', 'apparatus');

/** The label on the selected metro's own ring. It is drawn at a fixed size because it is
    what the others are measured from, so the word has to say that the ring is an origin
    rather than a quantity. */
export const SOURCE_TAG = say('from here', 'apparatus');

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
  /** The on-chart key, named to whichever metro is selected. Dustin asked for a label
      ON the mark rather than another sentence below it — thirty pre-rendered pairs,
      swapped by visibility like every other string here, so the client still
      constructs no copy. */
  keyLoss: CopyRecord;
  keyGain: CopyRecord;
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
/** Memoised, and it is the ledger that needs it rather than the clock. Every `say` appends,
    so building one metro's copy twice writes every one of its records twice — and the thirty
    share pages each name all thirty metros in the mark's overlay. Unmemoised that is thirty
    thousand duplicate records for the lint to re-check, all of them the same sentence. */
const METRO_COPY = new Map<string, MetroCopy>();

export function metroCopy(cbsa: string): MetroCopy {
  const memo = METRO_COPY.get(cbsa);
  if (memo) return memo;
  const built = buildMetroCopy(cbsa);
  METRO_COPY.set(cbsa, built);
  return built;
}

function buildMetroCopy(cbsa: string): MetroCopy {
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
      'Every other metro, redrawn as its exchange with this one. Green where more people ' +
        'came here than went there, red where more went than came, and a dashed empty ring ' +
        'where the record discloses nothing in one of the two directions.',
      'apparatus'
    ),
    aria: say(`${m.short}, ${m.state}. Select to read its record.`, 'apparatus'),
    keyLoss: say(`Red — left ${m.short}`, 'apparatus'),
    keyGain: say(`Green — moved in to ${m.short}`, 'apparatus'),
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
        'An earlier version divided every figure by a metro’s resident population. It is gone: ' +
          'these counts are tax filers and their dependents, not residents, so non-filers — the ' +
          'very poor, many elderly people, undocumented residents, some students — are absent ' +
          'from every figure here, unevenly, and largest exactly where a migration story looks ' +
          'first. The toggle was deleted rather than disabled, because a prohibited measure one ' +
          'boolean away from rendering is not safe to keep.',
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
        'Population was chosen over migration volume deliberately, so the set is not drawn by ' +
          'the numbers it exists to measure. The IRS did not choose these metros; this project ' +
          'did, and it is not a license to divide by population, which selects the units and ' +
          'appears in no figure.',
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
