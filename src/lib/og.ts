// OG card generation (08 §8.4) — satori (JSX-ish → SVG) → resvg (SVG → PNG),
// driven from Astro static endpoints so PNGs are pre-rendered into dist/ (zero
// runtime compute). Type-forward "Warm Atlas" cards; no live chart.
//
// ⚠️ Namesake gotcha: resvg MUST set font.loadSystemFonts:false + fontFiles, and
// satori needs STATIC font instances (its opentype parser rejects variable fonts).
// The OG fonts live in /og-fonts (build-only; not served).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { fmtSigned, fmtInt, fmtAgi, gainLose } from './format';
import { HEADLINE } from './copy';
import { META } from './data';
import type { MetroView } from './data';

const FONT_DIR = join(process.cwd(), 'og-fonts');
const SERIF = join(FONT_DIR, 'source-serif-4-600.otf');
const SANS = join(FONT_DIR, 'source-sans-3-400.otf');
const SANS_SB = join(FONT_DIR, 'source-sans-3-600.otf');
const MONO = join(FONT_DIR, 'jetbrains-mono-500.ttf');

const serif = readFileSync(SERIF);
const sans = readFileSync(SANS);
const sansSb = readFileSync(SANS_SB);
const mono = readFileSync(MONO);

const FONTS = [
  { name: 'Source Serif 4', data: serif, weight: 600 as const, style: 'normal' as const },
  { name: 'Source Sans 3', data: sans, weight: 400 as const, style: 'normal' as const },
  { name: 'Source Sans 3', data: sansSb, weight: 600 as const, style: 'normal' as const },
  { name: 'JetBrains Mono', data: mono, weight: 500 as const, style: 'normal' as const },
];
const RESVG_FONT = { loadSystemFonts: false, fontFiles: [SERIF, SANS, SANS_SB, MONO] };

const GROUND = '#F5EFE4';
const INK = '#2A2521';
const INK2 = '#5E5445';
const MUTED = '#978D7C';
const IN_CORE = '#1A6E9E';
const OUT_CORE = '#BC4E37';
const YR = META.year_pair.replace('-', '–');
const FOOTER = `Where America Moves · dustincoledata · ${YR} IRS`;

type VNode = { type: string; props: { style: Record<string, any>; children?: any } };
const el = (type: string, style: Record<string, any>, children?: any): VNode => ({ type, props: { style, children } });

const spectralBar = () =>
  el(
    'div',
    { display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden' },
    ['#20507F', '#2E93B4', '#EAE2D4', '#D3823C', '#A8442E'].map((c) => el('div', { flex: 1, background: c }))
  );

const footerRow = () =>
  el('div', { fontFamily: 'Source Sans 3', fontSize: 26, color: MUTED, marginTop: 18 }, FOOTER);

async function toPng(node: VNode): Promise<Buffer> {
  const svg = await satori(node, { width: 1200, height: 630, fonts: FONTS });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: RESVG_FONT });
  return resvg.render().asPng();
}

export async function renderMetroCard(m: MetroView): Promise<Buffer> {
  const gaining = m.net >= 0;
  const color = gaining ? IN_CORE : OUT_CORE;
  const agiStrip =
    m.agi_in == null || m.agi_out == null
      ? `${fmtInt(m.total_in)} in · ${fmtInt(m.total_out)} out`
      : `${fmtInt(m.total_in)} in · ${fmtInt(m.total_out)} out · ${fmtAgi(m.agi_in)} / ${fmtAgi(m.agi_out)} avg AGI`;

  const card = el(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 72px',
      background: GROUND,
      color: INK,
      fontFamily: 'Source Sans 3',
    },
    [
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el('div', { fontFamily: 'Source Serif 4', fontSize: 70, fontWeight: 600, letterSpacing: '-0.01em' }, m.name),
        el(
          'div',
          { fontFamily: 'Source Sans 3', fontSize: 25, color: MUTED, marginTop: 8, letterSpacing: '0.16em' },
          `${m.st.toUpperCase()} · WHERE AMERICA MOVES`
        ),
      ]),
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el('div', { display: 'flex', alignItems: 'baseline' }, [
          el('div', { fontFamily: 'JetBrains Mono', fontSize: 132, fontWeight: 500, color }, fmtSigned(m.net)),
          el(
            'div',
            { fontFamily: 'Source Serif 4', fontSize: 40, fontWeight: 600, color, marginLeft: 26 },
            `net · ${gainLose(m.net)} people`
          ),
        ]),
        el('div', { fontFamily: 'JetBrains Mono', fontSize: 29, color: INK2, marginTop: 14 }, agiStrip),
      ]),
      el('div', { display: 'flex', flexDirection: 'column' }, [spectralBar(), footerRow()]),
    ]
  );
  return toPng(card);
}

export async function renderHomeCard(): Promise<Buffer> {
  const card = el(
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
      fontFamily: 'Source Sans 3',
      position: 'relative',
    },
    [
      // faint ring motif
      el('div', {
        position: 'absolute',
        top: -140,
        right: -120,
        width: 460,
        height: 460,
        borderRadius: 460,
        border: '2px solid #E3D8C7',
        display: 'flex',
      }),
      el(
        'div',
        { fontFamily: 'Source Sans 3', fontSize: 25, color: MUTED, letterSpacing: '0.16em' },
        'WHERE AMERICA MOVES · DUSTINCOLEDATA'
      ),
      el(
        'div',
        {
          fontFamily: 'Source Serif 4',
          fontSize: 82,
          fontWeight: 600,
          letterSpacing: '-0.015em',
          lineHeight: 1.05,
          maxWidth: 900,
        },
        HEADLINE
      ),
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el('div', { fontFamily: 'JetBrains Mono', fontSize: 30, color: INK2, marginBottom: 20 }, '31 metros · one year · IRS SOI'),
        spectralBar(),
        footerRow(),
      ]),
    ]
  );
  return toPng(card);
}
