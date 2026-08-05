// A local Astro integration: write the copy ledger at `astro:build:done`, then run the
// caption lint over it and over dist/.
//
// The ledger lives on globalThis because this file is loaded by astro.config.mjs and the
// pages are loaded through Vite's SSR module graph — two module registries, one process.
// Importing src/copy/record.ts here would hand this file a second, empty copy of the array.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

export default function copyLedger() {
  return {
    name: 'wam:copy-ledger',
    hooks: {
      'astro:build:done': async ({ logger }) => {
        const ledger = globalThis.__WAM_COPY_LEDGER__ ?? [];
        const dir = join(process.cwd(), '.scan');
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'copy-ledger.json'), JSON.stringify(ledger, null, 1), 'utf8');
        logger.info(`copy ledger — ${ledger.length} records → .scan/copy-ledger.json`);

        if (ledger.length === 0) {
          // Silence here would be the worst outcome: an empty ledger makes every check pass
          // and the dist scan flag every figure on the site at once.
          throw new Error('copy ledger is empty — no CopyRecord reached the build. The module wiring is broken.');
        }

        // Always run, always print. The lint decides for itself whether to exit non-zero,
        // which it does only under CI / VERCEL.
        const r = spawnSync('npx', ['tsx', 'scripts/lint-copy.ts'], { stdio: 'inherit', shell: true });
        if (r.status !== 0) throw new Error('lint:copy failed');
      },
    },
  };
}
