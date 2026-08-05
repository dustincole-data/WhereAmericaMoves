import type { APIRoute } from 'astro';
import { renderHomeCard } from '../../lib/og';
import { say } from '../../copy/record';
import { HEADLINE, SITE_NAME } from '../../copy';
import { assertPlate } from '../../lib/package';
import claimSvgRaw from '../../assets/09-claim.svg?raw';

// The card's proportion comes from the plate's own emitted cut, not from arithmetic here.
const cut = Number(/data-cut="([\d.]+)"/.exec(assertPlate(claimSvgRaw, '09-claim.svg'))![1]);

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
