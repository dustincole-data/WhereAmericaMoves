// The carrier. Every user-visible string in this site is a CopyRecord, and there is no
// way to author one without deciding its citation — so an uncited figure is a TYPE ERROR
// before any lint runs, rather than a lint failure after.
//
// One field does both jobs. `apparatus` is a value of `cite`, not a second flag, which
// makes "cited AND exempt" unrepresentable and turns "an apparatus string containing a
// figure is itself a failure" into one comparison rather than a rule about a combination.
//
// Why a ledger rather than `data-cite` spans: nothing connects a `${}` in source to a
// digit string in dist. Spans would wrap nearly every sentence in the piece and still do
// nothing for the two surfaces that most need a backstop — the OG cards leave as PNGs with
// no DOM, and `<meta content>` has nowhere to hang an attribute. So text is resolved at
// construction, the ledger is every record ever built, and the lint runs both directions:
// ledger→verdict, and dist→ledger, where a figure in dist that is in no ledger entry is
// exactly the leak the backstop exists to catch.

import type { ClaimId, FrameId } from '../lib/package';

export type { ClaimId, FrameId };
export type Cite = ClaimId | FrameId | 'apparatus';

export interface CopyRecord {
  readonly text: string;
  readonly cite: Cite;
}

/** The ledger lives on globalThis on purpose. The Astro integration that writes it out at
    `astro:build:done` is loaded by astro.config.mjs and the pages are loaded through Vite's
    SSR graph — two module registries, one process. A module-scoped array would give the
    integration a second, empty copy of it. */
const KEY = '__WAM_COPY_LEDGER__';
const g = globalThis as unknown as Record<string, CopyRecord[] | undefined>;
if (!g[KEY]) g[KEY] = [];
const LEDGER = g[KEY]!;

/** The only constructor. Every call appends. */
export function say(text: string, cite: Cite): CopyRecord {
  const rec: CopyRecord = { text, cite };
  LEDGER.push(rec);
  return rec;
}

/** Records built but never rendered still get linted. Harmless, and dead copy being
    checked is a small bonus. */
export const ledger = (): readonly CopyRecord[] => LEDGER;

/** For the two places a record's text is interpolated into surrounding markup. Keeps the
    record the unit of authorship even where the sentence is assembled from parts. */
export const join = (parts: CopyRecord[], sep = ' '): string => parts.map((p) => p.text).join(sep);
