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
  RELATIONS,
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
    'An exchange too small to fill a dot is still drawn at one dot, and those are not to scale.',
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

// ── beat ③ · the denominator ───────────────────────────────────────────────────
//
// This beat used to be "No rates," and the page now ships one. Leaving the old words under a
// working per-thousand toggle would have made the piece call its own control a liar, which is
// worse than either position taken on its own. So the beat keeps the objection — it is
// correct, and it is the reason the view is worth a warning — and stops claiming the piece
// avoided it. The rate is drawn and never printed, which is the actual line that held.

export const BEAT_RATES: CopyRecord[] = [
  say('The denominator is a different universe.', 'apparatus'),
  say(
    'These counts are filers and their dependents; a population is residents. Dividing one ' +
      'by the other mixes two universes, and the answer is not the share of a place that ' +
      'moved — non-filers are missing from the top of the fraction and present at the bottom ' +
      'of it, unevenly, and most of all where a migration story looks first.',
    'apparatus'
  ),
  say(
    'The per-thousand view is here anyway, and it is drawn rather than stated: it changes ' +
      'the scale the picture is on, and every number this page prints is still a single ' +
      'published cell. No rate appears as a figure anywhere.',
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

/** The stream, in one sentence. It is the only thing on the page a reader could not work out
    from the still picture: which way the dots run, and that their number is the same quantity
    the cluster is made of rather than a second one. */
export const STREAM_NOTE = say(
  'A stream runs toward the metro that gained and away from the one that lost, and its width ' +
    'is the size of that exchange. One pass sends exactly as many dots as the cluster it ' +
    'comes from is made of.',
  'apparatus'
);

// ── the metric ─────────────────────────────────────────────────────────────────
//
// The per-capita view was deleted in v1 and is BACK, by Dustin's ruling on 2026-08-09 after
// the objection below was raised once and reaffirmed. The limits block used to say it was
// never coming back; it now says what it actually is, which is the only version of this page
// that does not contradict itself.
//
// NO RATE IS EVER PRINTED, in either metric. The toggle changes the scale the mark is drawn
// on — a mark, which `contract.aggregation` licenses — and the readout keeps handing over the
// two published cells. So there is no figure here whose citation would have to be invented:
// a rate is a cell of no frame.

export const METRIC_LABEL = say('Scale the mark by', 'apparatus');
export const METRIC_TOTAL = say('People', 'apparatus');
/** "Per thousand" and not "per 1,000": the numeral would be a figure in an apparatus string,
    and it would be one asserting nothing — the divisor is a unit, not a measurement. */
export const METRIC_RATE = say('Per thousand residents', 'apparatus');

export const SCALE_TOTAL = say(
  'Every dot is the same size, so more dots is more people.',
  'apparatus'
);
export const SCALE_RATE = say(
  'Every dot is still the same size, and here a dot is a fixed rate rather than a fixed ' +
    'number of people: each exchange is divided by the residents of the OTHER metro. The ' +
    'numerator counts filers and their dependents and the denominator counts every resident, ' +
    'so the two are different universes and this is not the share of a place that moved.',
  'apparatus'
);

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

// ── the pair readout ───────────────────────────────────────────────────────────
//
// What a reader gets for hovering a partner: THE TWO PUBLISHED CELLS, one per direction, and
// nothing else. The pairwise net the mark is drawn from is never printed here or anywhere —
// `contract.aggregation` licenses a mark that aggregates the cells it is made of and refuses
// the same aggregate as a figure — so the reader is handed both directions and does the
// comparison the picture already drew.
//
// Keyed by the UNORDERED pair, because the two cells do not change depending on which end
// the reader clicked. Only pairs with both directions disclosed get one: where a direction
// is missing the partner is a dashed empty ring, and a card reading "no flow" would be the
// zero the whole piece refuses to write.

export interface PairRow {
  label: CopyRecord;
  fig: CopyRecord;
  /** the larger of the two published cells, marked so the mark's own colour is echoed rather
      than restated in words. No metro is named a gainer or a loser (D0019); two cells are
      shown, and which is bigger is a fact about the two cells. */
  more: boolean;
}
export interface PairCopy {
  key: string;
  rows: PairRow[];
}

const PAIR_UNIT = say('people, each way', 'apparatus');
export { PAIR_UNIT };

export function pairCopy(): PairCopy[] {
  const flow = new Map<string, number>();
  for (const r of RELATIONS) flow.set(`${r.origin}>${r.dest}`, r.people);

  const out: PairCopy[] = [];
  const codes = METRO_BY_CBSA;
  const list = [...codes.keys()];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const [a, b] = list[i] < list[j] ? [list[i], list[j]] : [list[j], list[i]];
      const ab = flow.get(`${a}>${b}`);
      const ba = flow.get(`${b}>${a}`);
      if (ab === undefined || ba === undefined) continue;
      const na = codes.get(a)!.short;
      const nb = codes.get(b)!.short;
      out.push({
        key: `${a}|${b}`,
        rows: [
          { label: say(`${na} → ${nb}`, 'apparatus'), fig: say(fmtInt(ab), 'top_metro_relations'), more: ab > ba },
          { label: say(`${nb} → ${na}`, 'apparatus'), fig: say(fmtInt(ba), 'top_metro_relations'), more: ba > ab },
        ],
      });
    }
  }
  return out;
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
    head: say('The per-thousand view is back, and here is what is wrong with it', 'apparatus'),
    body: [
      say(
        'An earlier version divided every figure by a metro’s resident population, and this ' +
          'block used to say the view had been deleted and would not return. It has returned, ' +
          'and saying otherwise while a working toggle sits above would be the page ' +
          'contradicting itself rather than qualifying itself.',
        'apparatus'
      ),
      say(
        'The objection that removed it is unchanged and unanswered. These counts are tax ' +
          'filers and their dependents, not residents, so non-filers — the very poor, many ' +
          'elderly people, undocumented residents, some students — are absent from the top of ' +
          'the fraction and present at the bottom of it. They are absent unevenly, and by most ' +
          'exactly where a migration story looks first. A ratio of two universes is not a rate ' +
          'of either one.',
        'apparatus'
      ),
      say(
        'What changed is where the line sits. The view divides an exchange by the residents of ' +
          'the OTHER metro and spends the result on how many dots to draw — dividing by the ' +
          'metro you selected would put one denominator under all twenty-nine and redraw the ' +
          'first view at another size. No quotient is printed, spoken or carried anywhere on ' +
          'this page as a figure: it is a scale for a drawing, and the numbers beside the ' +
          'drawing are the cells the publisher published.',
        'apparatus'
      ),
      say(
        'The resident estimates are the Census Bureau’s, for the same July the metro set was ' +
          'drawn from. They come from a different source than everything else here, and they ' +
          'are the only quantity on this page that is not from the verified package.',
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
          'did. Population selects the units, and in the per-thousand view it also scales the ' +
          'drawing — in neither job does it appear as a figure.',
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
