// Number/format content model (07 §5.2, §5.7). The pipeline pre-derives every
// figure; this only formats. Minus is U+2212 everywhere a signed number appears
// (the sole exception, the year tag en-dash, lives in copy, not here).

export const MINUS = '−';

export const fmtInt = (n: number): string => Math.round(n).toLocaleString('en-US');

/** sign + comma; U+2212 for negatives, + for non-negatives */
export const fmtSigned = (n: number): string =>
  (n >= 0 ? '+' : MINUS) + Math.abs(Math.round(n)).toLocaleString('en-US');

/** $ + comma, rounded to nearest $100 (avoids false precision on an aggregate avg) */
export const fmtAgi = (n: number): string => '$' + (Math.round(n / 100) * 100).toLocaleString('en-US');

/** gaining / losing / in balance (net === 0 effectively never with integer people) */
export const gainLose = (net: number): string => (net > 0 ? 'gaining' : net < 0 ? 'losing' : 'in balance');

export const verdictShort = (net: number): string =>
  net > 0 ? 'net destination' : net < 0 ? 'net departure' : 'in balance';

export const verdictArticle = (net: number): string =>
  net > 0 ? 'a net destination' : net < 0 ? 'a net departure' : 'in balance';

/** the national "about" gestalt (07 §5.7) */
export const approxTotal = (n: number): string => {
  if (n >= 1_000_000) return `about ${(n / 1_000_000).toFixed(1)} million`;
  return `about ${(Math.round(n / 10_000) * 10_000).toLocaleString('en-US')}`;
};

/** dumbbell axis ends, padded then rounded to nearest $1,000 (05 dumbbell) */
export const agiAxis = (aIn: number, aOut: number): { min: number; max: number } => {
  const lo = Math.min(aIn, aOut) - 6000;
  const hi = Math.max(aIn, aOut) + 6000;
  return { min: Math.round(lo / 1000) * 1000, max: Math.round(hi / 1000) * 1000 };
};

/** two handles closer than this (% of the axis) hide each other */
const HANDLE_MIN_GAP = 7;

/** below this (% of the axis) the two captions overprint, so they merge into one */
export const CAP_MERGE_GAP = 28;

/** hold two handle positions (0–100) at least HANDLE_MIN_GAP apart, still on the axis */
export const spreadHandles = (a: number, b: number): [number, number] => {
  if (Math.abs(a - b) >= HANDLE_MIN_GAP) return [a, b];
  const half = HANDLE_MIN_GAP / 2;
  const mid = Math.min(100 - half, Math.max(half, (a + b) / 2));
  return a <= b ? [mid - half, mid + half] : [mid + half, mid - half];
};
