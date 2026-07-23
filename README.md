# Where America Moves

A free, static explorer of U.S. internal migration: click one of the **31 largest metros** and see who moves in, who moves out, the net flow, and what those movers earn — a dense directed **chord** hero with a choropleth selector, in a light "Warm Atlas" look.

**Live:** [moves.dustincoledata.com](https://moves.dustincoledata.com) · part of [dustincoledata.com](https://dustincoledata.com)

## What it is

- **Data:** IRS Statistics of Income (SOI) county-to-county migration, tax years **2022–2023** (the latest published). Rolled up to 31 metros via the Census July-2023 CBSA delineation.
- **100% static.** The data is **downloaded once at build, aggregated, and baked into ~1k rows of JSON** — no database, no serverless, no cron, no runtime fetch. Vercel serves files only.
- **Free / low-upkeep.** The only maintenance is re-running the build when a newer IRS vintage publishes.

## Develop

```bash
npm ci
npm run data     # download IRS CSVs → aggregate → write src/data/*.json + public/data/*.json
npm run dev      # Astro dev server (verify here — NOT `astro preview`, which is broken with a nested outDir)
npm run build    # static build → dist/  (also runs the site build; run `npm run data` first)
```

The production build command (Vercel) is `npm run data && npm run build`.

> Local dev note: `astro dev` can inherit agent/tooling env vars that break it — launch a clean shell if the dev server misbehaves.

## Refreshing the data (one action)

When the IRS publishes a newer vintage (≈ yearly, ~2-yr lag):

1. In `scripts/build-data.ts`, bump the two IRS CSV URLs (`2223` → `2324`) and `YEAR_PAIR`.
2. Re-deploy. Vercel re-runs the pipeline and rebuilds.

The county→CBSA crosswalk (`scripts/crosswalk.json`) and the metro list (`scripts/metros.ts`) change only when OMB re-delineates CBSAs (every several years) — regenerate the crosswalk with `npm run gen:crosswalk` (see that script's header for the one dev dependency it needs) and hand-reconcile the metro list.

## Data provenance

- IRS SOI county-to-county migration 2022–2023 — U.S. Government public domain (17 U.S.C. §105).
  <https://www.irs.gov/statistics/soi-tax-stats-migration-data-2022-2023>
- Census "List 1" CBSA delineation, July 2023 (OMB Bulletin 23-01).
- Census Population Estimates (metro ranking, context only).

## What's checked in vs generated

- **Checked in:** app source, styles, self-hosted fonts, the curated `scripts/metros.ts` (the 31) and `scripts/crosswalk.json` (geographic lookup), the specs in `.claude/plans/`.
- **Gitignored + CI-generated:** the IRS download (`data/raw/`), all aggregated JSON (`src/data/`, `public/data/`), and the OG card PNGs (`public/og/`).
