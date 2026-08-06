// OG cards — satori (JSX-ish → SVG) → resvg (SVG → PNG), driven from Astro static
// endpoints so PNGs are pre-rendered into dist/ with zero runtime compute.
//
// The cards are closed twice, and both are kept because their failure messages diagnose
// differently.
//
//   PREVENT.  Every text-bearing signature below takes `CopyRecord` and never `string`.
//             Text that did not come through the copy module cannot be placed on a card.
//             A type violation says: you bypassed the module.
//   VERIFY.   The 30 cards leave the build as PNGs and the dist scan cannot see inside a
//             PNG, so a text-bearing SVG of each card is written to .scan/og/<slug>.svg for
//             the lint to read. See `toPng`: it takes a deliberate second satori pass,
//             because the rendered SVG is glyph outlines and readable by nothing.
//             A scan hit says: a number reached a card anyway.
//
// ⚠️ resvg MUST set font.loadSystemFonts:false + fontFiles, and satori needs STATIC font
// instances (its opentype parser rejects variable fonts). Build-only; not served.

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { CopyRecord } from '../copy/record';

// The cards are the surface most often seen out of context, so they carry the page's own
// typeface rather than a stand-in. `archivo-{400,600}.ttf` are woff2-decompressed from
// `public/fonts/archivo-latin-{400,600}-normal.woff2` — the exact files the page serves —
// with only the subsetter's mangled name records normalised, so the card and the page
// cannot show two different Archivos. Change the served woff2 and these must be redone.
const FONT_DIR = join(process.cwd(), 'og-fonts');
const SANS = join(FONT_DIR, 'archivo-400.ttf');
const SANS_SB = join(FONT_DIR, 'archivo-600.ttf');
const MONO = join(FONT_DIR, 'jetbrains-mono-500.ttf');

const FONTS = [
  { name: 'Archivo', data: readFileSync(SANS), weight: 400 as const, style: 'normal' as const },
  { name: 'Archivo', data: readFileSync(SANS_SB), weight: 600 as const, style: 'normal' as const },
  { name: 'JetBrains Mono', data: readFileSync(MONO), weight: 500 as const, style: 'normal' as const },
];
const RESVG_FONT = { loadSystemFonts: false, fontFiles: [SANS, SANS_SB, MONO] };

// The cool ground from 03. The cream is dead: the ruling there was that a dark ground
// renders absence as a substance, and the light ground it settled on is #f4f5f7.
const GROUND = '#f4f5f7';
const INK = '#15181d';
const MUTED = '#5c6068';
const RULE = '#d9dbe1';
const CLAIM_BLUE = '#00729b';

type VNode = { type: string; props: { style: Record<string, unknown>; children?: unknown } };
const el = (type: string, style: Record<string, unknown>, children?: unknown): VNode => ({
  type,
  props: { style, children },
});

const SCAN_DIR = join(process.cwd(), '.scan', 'og');

async function toPng(node: VNode, scanName: string): Promise<Buffer> {
  const svg = await satori(node as never, { width: 1200, height: 630, fonts: FONTS });
  // Satori embeds every glyph as a <path> outline, so the rendered SVG carries no readable
  // text at all — and ⑥ strips `d="…"` as geometry, which left the backstop reading nothing
  // on all 31 cards while claiming to read them. A second pass with `embedFont: false` emits
  // <text> nodes from the same tree, and it is the scan's copy ONLY: the PNG below still
  // rasterises from the embedded-glyph SVG above, so shipped pixels are unchanged.
  const scanSvg = await satori(node as never, {
    width: 1200,
    height: 630,
    fonts: FONTS,
    embedFont: false,
  });
  mkdirSync(SCAN_DIR, { recursive: true });
  writeFileSync(join(SCAN_DIR, `${scanName}.svg`), scanSvg, 'utf8');
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: RESVG_FONT }).render().asPng();
}

/** A proportional rule: the withheld share of the claim, drawn. It states no number, which
    is the point — the card carries the piece's shape, and the page carries its figures. */
const claimRule = (cutFraction: number) =>
  el('div', { display: 'flex', height: 12, width: '100%', marginTop: 26 }, [
    el('div', { width: `${(cutFraction * 100).toFixed(3)}%`, background: CLAIM_BLUE, display: 'flex' }),
    el('div', {
      flexGrow: 1,
      border: `1px dashed ${RULE}`,
      borderLeft: `3px solid ${INK}`,
      display: 'flex',
    }),
  ]);

const footerRow = (line: CopyRecord) =>
  el('div', { fontFamily: 'Archivo', fontSize: 24, color: MUTED, marginTop: 18 }, line.text);

export interface HomeCard {
  eyebrow: CopyRecord;
  headline: CopyRecord;
  footer: CopyRecord;
  cutFraction: number;
}

export async function renderHomeCard(c: HomeCard): Promise<Buffer> {
  return toPng(
    el(
      'div',
      {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '68px 72px',
        background: GROUND,
        color: INK,
        fontFamily: 'Archivo',
      },
      [
        el(
          'div',
          { fontFamily: 'Archivo', fontSize: 24, color: MUTED, letterSpacing: '0.16em' },
          c.eyebrow.text.toUpperCase()
        ),
        el(
          'div',
          { fontSize: 76, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.08, maxWidth: 980 },
          c.headline.text
        ),
        el('div', { display: 'flex', flexDirection: 'column' }, [claimRule(c.cutFraction), footerRow(c.footer)]),
      ]
    ),
    'index'
  );
}

export interface MetroCard {
  slug: string;
  name: CopyRecord;
  state: CopyRecord;
  labelIn: CopyRecord;
  figIn: CopyRecord;
  labelOut: CopyRecord;
  figOut: CopyRecord;
  labelNet: CopyRecord;
  figNet: CopyRecord;
  supHead: CopyRecord;
  supIn: CopyRecord;
  supOut: CopyRecord;
  footer: CopyRecord;
  hue: string;
  supExtent: number;
}

/** No verdict word and no direction colour: which metros are the net destinations is not
    claimable, so the sign is a number here and never a category. The hue is the metro's own
    position hue, taken from the hero's emitted table — it says where, not how much. */
export async function renderMetroCard(c: MetroCard): Promise<Buffer> {
  const cell = (label: CopyRecord, fig: CopyRecord) =>
    el('div', { display: 'flex', flexDirection: 'column', marginRight: 64 }, [
      el('div', { fontSize: 22, color: MUTED, letterSpacing: '0.1em' }, label.text.toUpperCase()),
      el('div', { fontFamily: 'JetBrains Mono', fontSize: 62, fontWeight: 500, marginTop: 6 }, fig.text),
    ]);

  return toPng(
    el(
      'div',
      {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '62px 72px',
        background: GROUND,
        color: INK,
        fontFamily: 'Archivo',
      },
      [
        el('div', { display: 'flex', flexDirection: 'column' }, [
          el('div', { display: 'flex', alignItems: 'center' }, [
            el('div', { width: 26, height: 26, borderRadius: 26, background: c.hue, display: 'flex' }),
            el('div', { fontSize: 66, fontWeight: 600, letterSpacing: '-0.015em', marginLeft: 18 }, c.name.text),
          ]),
          el(
            'div',
            { fontSize: 23, color: MUTED, marginTop: 8, letterSpacing: '0.16em' },
            `${c.state.text.toUpperCase()} · WHERE AMERICA MOVES`
          ),
        ]),
        el('div', { display: 'flex' }, [
          cell(c.labelIn, c.figIn),
          cell(c.labelOut, c.figOut),
          cell(c.labelNet, c.figNet),
        ]),
        el('div', { display: 'flex', flexDirection: 'column' }, [
          el('div', { fontSize: 22, color: MUTED, letterSpacing: '0.1em' }, c.supHead.text.toUpperCase()),
          el(
            'div',
            { fontFamily: 'JetBrains Mono', fontSize: 30, color: INK, marginTop: 6 },
            `${c.supIn.text} · ${c.supOut.text}`
          ),
          claimRule(1 - c.supExtent),
          footerRow(c.footer),
        ]),
      ]
    ),
    c.slug
  );
}
