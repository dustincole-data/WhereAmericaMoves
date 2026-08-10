import type { APIRoute } from 'astro';
import { renderHomeCard } from '../../lib/og';
import { say } from '../../copy/record';
import { HEADLINE, SITE_NAME } from '../../copy';
import { WITHHELD, TOTAL_MOVERS } from '../../lib/package';

// The card's proportion used to be read out of `09-claim.svg`'s emitted `data-cut`. That
// plate was the page's claim register, the register is gone, and keeping a baked SVG on disk
// as a constant store for one number would be the tail wagging the dog. So the card derives
// the proportion from the two published cells it has always been about.
//
// This is a ratio of two cells, which the contract does not let the page SPEAK. It is not
// spoken: `cutFraction` is a width, and the card prints `HEADLINE` and nothing else. Same
// licence `MetroCopy.supExtent` and the per-thousand scale already run on — a proportion may
// be drawn, and may never appear as a figure.
const cut = 1 - WITHHELD / TOTAL_MOVERS;

export const GET: APIRoute = async () =>
  new Response(
    new Uint8Array(
      await renderHomeCard({
        eyebrow: SITE_NAME,
        headline: HEADLINE,
        footer: say('IRS Statistics of Income · dustincoledata', 'apparatus'),
        cutFraction: cut,
      })
    ),
    { headers: { 'Content-Type': 'image/png' } }
  );

export const prerender = true;
