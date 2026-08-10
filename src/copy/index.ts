// Every user-visible string in Where America Moves v2.
//
// The spine is Beauty 06: the subject is THE RECORD, not the movement. Four beats —
// ① the withheld quarter · ② no county won · ③ no rates · ④ 7 of 870 pairs with no
// disclosed flow — of which three are facts about the publisher's record and exactly one
// (② ) is a fact about our checking. The second our-side finding, that nothing here is
// corroborated, is in the limits block, which is what keeps this from being a piece about
// our pipeline.
//
// ── 2026-08-10: THE EDIT PASS ────────────────────────────────────────────────────────
// Ruled by Dustin: "far too much, and it reads like a report, not a website." Every record
// below was judged keep / cut / shorten. ~1,150 visible words became ~330 on the page plus
// the limits behind one control. What that pass was allowed to do and what it was not:
//
//   • DUPLICATION was the whole problem. Beat ③ restated the limits' per-thousand section
//     almost verbatim; the method note restated `FLOOR_NOTE`; the keystrip restated
//     `AT_REST`. In every such pair the argument survives ONCE, in the place that owns it.
//   • The self-history records went. A page that keeps minutes of its own previous versions
//     ("this block used to say the view had been deleted") is the pipeline talking.
//   • Nothing a constraint requires was cut. "Never means zero" survives verbatim, D0019's
//     disclosure survives, the objection to the per-thousand view survives at full force,
//     and the two-published-columns rule moved into the limits rather than being deleted.
//   • One record was cut for being FALSE, not long: `HERO_LINES[2]` still called the wide
//     screen "a rough map" after 02c61ba put the clusters at true projected points. Its true
//     half is now `PHONE_NOTE`.
//   • The claim register bar is gone (`REGISTER_CLAIM`, `BAR_*`, `REGISTER_FRAME` with it).
//     `WITHHELD_LINE` and `FLOOR_NOTE` stayed: with the bar gone they are the only place the
//     headline's own figure appears, and `RING_NOTE` describes what replaced it on the mark.
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
  type MetroTotals,
} from '../lib/package';
import { METRO_BY_CBSA } from '../lib/metros';

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
    three words and closes the only route by which the page invited its own forbidden sum.

    2026-08-10: this line and the floor note under it are now the ONLY place the headline's
    own figure appears. The claim register bar is gone, and the dashed ring that replaced it
    on the mark draws each metro's own suppressed mass — the same absence, thirty times over,
    and a different quantity from this one. So the national figure has to carry itself in
    type, which is why the shortening here stopped at the pronoun fix and did not go further. */
export const WITHHELD_LINE = say(
  `${fmtInt(WITHHELD)} of the ${fmtInt(TOTAL_MOVERS)} are inside that total and attached to no pair of counties.`,
  'C0003'
);

export const FLOOR_NOTE = say(
  `The IRS withholds any county-to-county flow below ${MANIFEST.source.disclosure_floor.value} returns.`,
  'apparatus'
);

/** The crowd is the complement. Rigor 13 confirmed the aggregate, so the piece may now say
    it out loud rather than leaving it to area alone — one sentence, the claim's own. It sits
    beside the standfirst now that the register it used to be labelled against is gone;
    `REGISTER_FRAME` went with the bar, since its whole job was telling two registers apart
    and there is only one left. */
export const COMPLEMENT = say(C0005.text, 'C0005');

/** The key that rides with the picture. Three short spans: the unit, the absence, and the
    two things a reader would otherwise be entitled to assume and be wrong about.

    The scale sentence is here because the scale is DERIVED PER VIEW and never printed. A
    single scale across all thirty selections was measured against the real frame and
    rejected: the largest pairwise net in the package is over a hundred times the largest in
    the quietest metro, so one scale draws half the set as a field of single dots. The cost
    is that two selections are not comparable to each other, and a reader is told that
    rather than left to assume otherwise. */
/** A SECOND CUT, EARNED BY THE GLYPHS. `Key.astro` draws each of these beside the thing it is
    about, in the canvas's own ink, so the clause that used to NAME the shape is now redundant
    with the picture next to it: "A dashed empty ring is a direction the record discloses
    nothing for" is a dashed empty ring, drawn, plus what it means. Every sentence here stopped
    describing what the reader can see and kept only what a shape cannot say.

    "Never zero" survives verbatim. It is the one clause in this file a constraint names. */
export const HERO_LINES: CopyRecord[] = [
  say('Too small to fill a dot is still one dot.', 'apparatus'),
  say('Nothing disclosed here: withheld or absent, never zero.', 'apparatus'),
  say('Sizes compare inside one view, not between two.', 'apparatus'),
];

/** Split out of `HERO_LINES[2]`, which used to end "…a rough map on a wide screen and a grid
    on a phone." Half of that sentence went STALE at 02c61ba: the clusters now sit at their
    true projected points on a real coastline, so the wide screen is a map and saying it is a
    rough one is false. The phone half is still true and still owed, so it is its own record,
    shown at the width where it applies rather than on every screen. */
export const PHONE_NOTE = say(
  'On a phone the clusters sit on a grid rather than a map, and where one sits carries no quantity.',
  'apparatus'
);

/** The dashed outer ring, which is where the claim register went. The bar drew ONE national
    proportion in a section of its own; the ring draws each metro's own suppressed mass, at
    that cluster's own scale, thirty times inside the mark the reader is already looking at.
    Dashed because dashed already means "the record discloses nothing here" everywhere else
    on this page — the empty partner ring uses it — so the absence reads without a key. */
export const RING_NOTE = say(
  'The metro’s own withheld mass: inside its totals, attached to no pair of counties.',
  'apparatus'
);

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
      'by the other mixes two universes, so the answer is not the share of a place that moved.',
    'apparatus'
  ),
];

// ── beat ④ · the pairs with no disclosed flow ──────────────────────────────────

export const BEAT_ABSENT: CopyRecord[] = [
  say(`${ABSENT_PAIRS} of ${FRAME_PAIRS} pairs are not there.`, 'C0005'),
  say('Select either end and the ring at the other is drawn empty.', 'apparatus'),
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
  'Each metro is a cluster of dots. Green arrived, red left. Choose one.',
  'apparatus'
);
/** Green and red mean a DIFFERENT thing here than they do at rest — one metro's own two
    columns before a selection, the sign of an exchange after one — so both clauses stay
    however short this gets. Dropping either is how a reader ends up confidently misreading
    the colour. */
export const ON_SELECT = say(
  'Now each metro is its exchange with the one you chose. Green: more came than went. Red: the reverse.',
  'apparatus'
);
export const RESET = say('Show every metro', 'apparatus');

/** The stream, in one sentence. It is the only thing on the page a reader could not work out
    from the still picture: which way the dots run, and that their number is the same quantity
    the cluster is made of rather than a second one. */
export const STREAM_NOTE = say(
  'Runs toward the metro that gained. Width is the size of the exchange.',
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
  'Divided by the residents of the OTHER metro. Filers over residents is two universes, not a share.',
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
      'Counted in this metro’s totals and attached to no county pair. Not a rest-of-U.S. ' +
        'quantity, and the split cannot be recovered from this source.',
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

/** Six sections behind ONE control, where there used to be five open on the page at 726
    words. Two things happened here on 2026-08-10 and they are different acts:
      • CUT. The self-history record ("an earlier version divided every figure by a metro's
        resident population, and this block used to say…") is gone. It was the page keeping
        minutes of its own edit history, which is the pipeline talking, and no reader is owed
        it. Every other record was shortened, not dropped: the objections are the point.
      • MOVED. `LEGEND[0]` — the two-published-columns rule — was a line under the mark
        restating a rule nothing else on the page states. It is a limit, so it lives here now,
        as its own section.
    The collapse itself changes nothing about disclosure: every string is still server-rendered
    into dist, so the scan reads it, a screen reader reaches it, and Ctrl-F finds it. What
    changed is that the page no longer opens on nine hundred words of qualification. */
export const LIMITS: { head: CopyRecord; body: CopyRecord[] }[] = [
  {
    head: say('Nothing here is corroborated', 'apparatus'),
    body: [
      say(
        'The inbound and outbound files are one measurement in two layouts, so their agreement ' +
          'certifies nothing: the check that compares them subtracts a number from itself and ' +
          'cannot fail.',
        'apparatus'
      ),
    ],
  },
  {
    head: say('A cluster is two columns, not a verdict', 'apparatus'),
    body: [
      say(
        'A resting cluster is cut into two published columns — arrived and left — never ' +
          'coloured by which way the metro’s total went.',
        'apparatus'
      ),
    ],
  },
  {
    head: say('The per-thousand view, and what is wrong with it', 'apparatus'),
    body: [
      say(
        'These counts are tax filers and their dependents, not residents. Non-filers — the very ' +
          'poor, many elderly people, undocumented residents — are missing from the top of the ' +
          'fraction and present at the bottom of it, unevenly, and above all where a migration ' +
          'story looks first. A ratio of two universes is not a rate of either one.',
        'apparatus'
      ),
      say(
        'The view divides an exchange by the residents of the OTHER metro and spends the result ' +
          'on how many dots to draw. No rate is printed anywhere on this page.',
        'apparatus'
      ),
      say(
        'The resident estimates are the Census Bureau’s, and they are the only quantity here ' +
          'that is not from the verified package.',
        'apparatus'
      ),
    ],
  },
  {
    head: say('Which metros are gaining is not claimable', 'apparatus'),
    body: [
      say(C0006.text, 'C0006'),
      say(
        'The count is claimable; the membership is not. Across three defensible ways to decide a ' +
          'metro’s direction the count barely moves, but three of the thirty change side. So this ' +
          'page prints every metro’s own net and names no gainer and no loser.',
        'apparatus'
      ),
    ],
  },
  {
    head: say('The residual is not a rest-of-U.S. quantity', 'apparatus'),
    body: [
      say(
        'Each metro’s unattributable column is every move the publisher did not attach to a ' +
          'specific county pair, including moves inside the metro that fall below the disclosure ' +
          'floor. The split cannot be recovered from this source, and it is not zero.',
        'apparatus'
      ),
    ],
  },
  {
    head: say('These thirty metros are a choice, and it is ours', 'apparatus'),
    body: [
      say(UNIVERSE.selection.rule.replace(/^the/, 'The') + '.', 'apparatus'),
      say(
        'Population was chosen over migration volume deliberately, so the set is not drawn by ' +
          'the numbers it exists to measure. The IRS did not choose these metros; this project did.',
        'apparatus'
      ),
      say(UNIVERSE.selection.source + '.', 'apparatus'),
    ],
  },
];

// ── the footer ─────────────────────────────────────────────────────────────────

/** Three records where there were five. Both cuts were duplicates rather than trims: the
    "baked once at build … nothing is fetched at build" line is the pipeline describing itself
    to a reader who did not ask, and the floor statement is `FLOOR_NOTE` a second time, in
    longer words, on the same page. */
export const METHOD: CopyRecord[] = [
  say(MANIFEST.source.attribution, 'apparatus'),
  say(
    'A unit is the county of the address on the return, so a move here is a change of filing ' +
      'address, not a dated relocation.',
    'apparatus'
  ),
  say(`Metros are Core-Based Statistical Areas, July 2023 delineation.`, 'apparatus'),
];

export const METHOD_LINK = say('irs.gov/statistics/soi-tax-stats-migration-data', 'apparatus');

/** 04's reader-visible stamp. A correction is a new package, not an edit to an old one —
    which means nothing unless the package identity is on the page. A hash is an identifier
    and not an assertion of quantity, which is why the lint's figure rule excludes hex runs;
    without that refinement the first stamped page would fail its own build. */
export const STAMP = say(`Every figure on this page comes from package ${PACKAGE_STAMP}`, 'apparatus');

export { join };
