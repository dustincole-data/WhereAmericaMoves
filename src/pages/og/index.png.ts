// Home OG card → /og/index.png (static, build-time).
import type { APIRoute } from 'astro';
import { renderHomeCard } from '../../lib/og';

export const GET: APIRoute = async () => {
  const png = await renderHomeCard();
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
