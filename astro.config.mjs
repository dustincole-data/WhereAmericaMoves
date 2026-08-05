// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import copyLedger from './scripts/copy-ledger-integration.mjs';

// Where America Moves — pure static, subdomain root, no adapter.
export default defineConfig({
  site: 'https://moves.dustincoledata.com',
  base: '/',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap(), copyLedger()],
  build: {
    // Keep OG endpoints and pages side by side under dist/ (Namesake nested-outDir note: dev-verify, not preview).
    format: 'directory',
  },
  devToolbar: { enabled: false },
});
