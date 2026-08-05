// Formatting only. Nothing here derives a quantity — it prints one the package published.
//
// v1's helpers that are gone, each for a stated reason:
//   fmtRate · fmtRateAbs   `not_claimable` forbids every migration rate from this source.
//   fmtAgi · agiAxis · spreadHandles · CAP_MERGE_GAP
//                          v2 carries no income at all (Beauty 10 §7): the subject is the
//                          record, and earnings are a fact about the movement.
//   gainLose · verdictShort · verdictArticle
//                          the category words. `not_claimable` (D0019) says WHICH twelve
//                          metros are the net destinations is not claimable, so no sentence
//                          may call a named metro a gainer or a loser. Its signed net is a
//                          readout of its own cell and survives as a number.
//   approxTotal            "about 1.6 million" was a hedge around an unclaimed aggregate.
//                          C0005 is confirmed, so the piece prints 1,555,397.
//
// There is no percentage formatter, and that is deliberate rather than missing: a share is
// a ratio of two cells, which `contract.aggregation` makes a spoken aggregate needing its
// own claim. Every proportion in this piece is DRAWN — the claim bar, and each metro's own
// withheld extent — and its components are printed as the counts the package published.

export const MINUS = '−';

export const fmtInt = (n: number): string => Math.round(n).toLocaleString('en-US');

/** sign + comma; U+2212 for negatives, + for non-negatives */
export const fmtSigned = (n: number): string =>
  (n >= 0 ? '+' : MINUS) + Math.abs(Math.round(n)).toLocaleString('en-US');
