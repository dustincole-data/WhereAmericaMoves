import type { APIRoute } from 'astro';
import { renderMetroCard } from '../../lib/og';
import { say } from '../../copy/record';
import { metroCopy } from '../../copy';
import { METROS } from '../../lib/metros';
import hues from '../../assets/09-hues.json';

export function getStaticPaths() {
  return METROS.map((m) => ({ params: { slug: m.slug }, props: { cbsa: m.cbsa } }));
}

export const GET: APIRoute = async ({ props }) => {
  const m = metroCopy((props as { cbsa: string }).cbsa);
  return new Response(
    new Uint8Array(
      await renderMetroCard({
        slug: m.slug,
        name: m.name,
        state: m.state,
        labelIn: m.labelIn,
        figIn: m.figIn,
        labelOut: m.labelOut,
        figOut: m.figOut,
        labelNet: m.labelNet,
        figNet: m.figNet,
        supHead: m.supHead,
        supIn: m.supIn,
        supOut: m.supOut,
        footer: say('IRS Statistics of Income · dustincoledata', 'apparatus'),
        hue: (hues.metros as Record<string, { read: string }>)[m.cbsa].read,
        supExtent: m.supExtent,
      })
    ),
    { headers: { 'Content-Type': 'image/png' } }
  );
};

export const prerender = true;
