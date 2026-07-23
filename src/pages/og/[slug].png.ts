// Per-metro OG cards → /og/<slug>.png (static, one per metro).
import type { APIRoute } from 'astro';
import { VIEWS } from '../../lib/data';
import type { MetroView } from '../../lib/data';
import { renderMetroCard } from '../../lib/og';

export function getStaticPaths() {
  return VIEWS.map((m) => ({ params: { slug: m.slug }, props: { m } }));
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderMetroCard((props as { m: MetroView }).m);
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
