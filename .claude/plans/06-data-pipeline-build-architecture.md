# Where America Moves — Data Pipeline & Build Architecture (ticket 06)

> **Plan, don't build.** This is the pipeline + build half of the spec, resolving ticket *Data pipeline + build & repo architecture*. A separate build session scaffolds it; ticket *Assemble spec & build plan* (08) folds this into the single final spec. Nothing here is app code — it is the locked technical shape.
>
> **For the build session:** every path, URL, join key, and schema below is exact and decided. Where a call was genuinely open, it is resolved in **§9 Decisions** with rationale — don't re-litigate.

**Goal:** A free, zero-runtime-compute static explorer at `moves.dustincoledata.com` whose data is IRS SOI county-to-county migration, downloaded once at build, aggregated to 31 metros, and baked into ~1k rows of JSON — data gitignored + CI-generated (Namesake pattern), refreshed only by re-running the build.

**Architecture:** Two decoupled halves in one standalone repo. (1) A **Node/TypeScript pipeline** (`npm run data`) fetches the two IRS CSVs, rolls county flows up to the 31 curated CBSAs via a checked-in crosswalk, buckets the rest, and emits `metro_pairs` / `metro_summary` / `build_meta` JSON. (2) An **Astro static site** (`npm run build`) imports that JSON and pre-renders the explorer + 31 per-metro share routes. Vercel runs `npm run data && npm run build`; no serverless, no cron, no runtime external fetch.

**Tech Stack:** Node 22 · TypeScript via `tsx` · `csv-parse` · Astro (`output: 'static'`) · D3 submodules (`d3-chord`, `d3-shape`, `d3-selection`, `d3-scale`) · `us-atlas` + `topojson-client` (choropleth) · Vercel static hosting.

---

## Global Constraints (verbatim from brief — every task inherits these)

- **FREE. LOW upkeep.** No paid API, no database, no serverless function, no cron. The only maintenance is re-running the build for a newer IRS vintage.
- **Data downloaded once → aggregated → baked static at build.** **No runtime/cron fetch of external data.** IRS raw + generated JSON are **gitignored + CI-generated** (Namesake pattern).
- **Zero runtime compute.** 100% static output (Vercel CDN serves files only) → free.
- **Standalone repo**, its **own Vercel project**, subdomain `moves.dustincoledata.com`, linked from dustincoledata.com with **no main-site proxy/rewrite** (mirror the Namesake decoupling).
- **Metro set = 31**: top-30 CBSAs by population + Louisville (CBSA 31140, hometown add). Locked in ticket 03.
- **Vintage = IRS 2022-2023** (latest published; ~2-yr lag) paired with **Census delineation List 1, July 2023**.
- **Out of scope:** animated flow/particle maps, live data, sub-metro drill-down, multi-year animation.

---

## 1. Repo layout & file responsibilities

```
WhereAmericaMoves/
├─ .gitignore
├─ package.json
├─ tsconfig.json
├─ astro.config.mjs
├─ README.md                     # what it is, how to re-bake, data provenance
├─ scripts/                      # ── the pipeline (checked in) ──
│  ├─ build-data.ts              #   entry point (`npm run data`): fetch → aggregate → write
│  ├─ metros.ts                  #   CURATED 31-metro constant (CBSA, name, pop2023, lat, lon) — checked in
│  ├─ crosswalk.json             #   county FIPS → CBSA, restricted to the 31 metros' counties — checked in
│  └─ gen-crosswalk.ts           #   one-off regen of crosswalk.json from list1_2023.xlsx (manual, ~every several yrs)
├─ data/
│  └─ raw/                       # ── GITIGNORED ── fetched IRS CSVs (download-once cache)
├─ src/
│  ├─ data/                      # ── GITIGNORED, CI-generated ── metro_summary.json · build_meta.json
│  ├─ pages/
│  │  ├─ index.astro             #   the explorer: national 31-arc chord + right rail (composition = ticket 05)
│  │  └─ metro/[slug].astro      #   per-metro share page (getStaticPaths over the 31; focus chord + readout)
│  ├─ components/                #   Header · ChordHero · Choropleth · Panel · Legend · IncomeDumbbell
│  ├─ lib/                       #   client viz (d3 chordDirected build, scales, interaction)
│  └─ styles/tokens.css          #   Warm Atlas tokens, copied from assets/look-tokens.md
└─ public/
   ├─ data/                      # ── GITIGNORED, CI-generated ── metro_pairs.json (client-fetched by the national chord)
   └─ fonts/                     # self-hosted Source Serif 4 / Sans 3 / JetBrains Mono / Caveat (woff2)
```

**Checked in vs generated — the boundary that satisfies "data gitignored + CI-generated":**
- **Checked in (small, static config, not "the data"):** `scripts/metros.ts` (the curated 31), `scripts/crosswalk.json` (geographic lookup — changes only when OMB re-delineates, ~every several years), styles, app source, fonts.
- **Gitignored, regenerated every build:** `data/raw/*.csv` (the 9 MB IRS download), `src/data/*.json` and `public/data/*.json` (the aggregated output).

`.gitignore`:
```
node_modules/
dist/
.astro/
.vercel/
data/raw/
src/data/
public/data/
.scratch/                # the wayfinder tracker — never ship
.claude/settings.local.json
```
(Commit `.claude/plans/` — these specs are durable. `.scratch/` is the local-markdown tracker, gitignored per map.)

---

## 2. Data contract (the interface the app consumes — locked in ticket 03)

The pipeline's only job is to emit these three files. The build session codes the app **against this contract**; the app never sees a CSV.

### `public/data/metro_pairs.json` — array, one row per directed origin→dest relationship
Client-fetched once by the national chord. `~1k rows` (≤ 31×30 metro↔metro + rest-of-US rows; zero-flow pairs omitted).

| field | type | notes |
|---|---|---|
| `origin_cbsa` | string | 5-digit CBSA code |
| `origin_name` | string | e.g. `"New York-Newark-Jersey City, NY-NJ"` |
| `dest_cbsa` | string | 5-digit CBSA code, or sentinel `"REST_US"` |
| `dest_name` | string | metro name, or `"Rest of US"` |
| `bucket` | enum | `"metro"` \| `"rest_us_direct"` \| `"rest_us_suppressed"` |
| `people` | int | Σ N2 (individuals) — primary "who moved" count |
| `returns` | int | Σ N1 (returns/households) — secondary |
| `agi_total_thousands` | int \| null | Σ AGI (thousands $, year-2, may include deficits); null only if every contributing cell suppressed |
| `agi_avg_dollars` | number \| null | precomputed `agi_total_thousands * 1000 / people` — app never divides |
| `year_pair` | string | `"2022-2023"` |

### `src/data/metro_summary.json` — array, one row per metro (N=31)
Imported at build (feeds `getStaticPaths`, the rail national-summary, and each share page's readout).

| field | type | notes |
|---|---|---|
| `cbsa` | string | 5-digit code |
| `slug` | string | URL slug for `/metro/<slug>` (e.g. `"new-york"`) — **the pipeline mints it** so routes & data agree |
| `name` | string | |
| `population` | int | from `metros.ts` snapshot — context only, never derived from migration data |
| `total_in` / `total_out` | int | Σ N2 across all inbound / outbound rows (metro partners + both rest-of-US buckets) |
| `net` | int | `total_in - total_out` |
| `rest_of_us_in_direct` / `rest_of_us_in_suppressed` | int | disambiguated components; same two `_out` fields |
| `top_partners_in` | `{cbsa, name, slug, people}[]` | precomputed top 10 inbound partner metros, desc |
| `top_partners_out` | same | outbound |
| `agi_avg_in_dollars` / `agi_avg_out_dollars` | number | aggregate avg AGI of in- / out-movers (Σ AGI ÷ Σ N2) |

### `src/data/build_meta.json` — object, provenance + QA for the methodology/footer
```jsonc
{
  "year_pair": "2022-2023",
  "generated_utc": "<ISO timestamp>",
  "irs_source": "https://www.irs.gov/statistics/soi-tax-stats-migration-data-2022-2023",
  "crosswalk_source": "Census List 1, July 2023 (OMB Bulletin 23-01)",
  "metro_count": 31,
  "pair_rows": 0,                          // filled at build
  "suppressed_top_metro_pairs": 0,         // QA: how many top-31↔top-31 pairs fell into IRS 'Other flows' (expected ~0)
  "inflow_outflow_discrepancies": 0        // QA: pairs non-suppressed in both files whose totals disagree (logged, not shown)
}
```

**Deliberately excluded** (per ticket 01 limits): county-level detail, any AGI-band/histogram field, multi-year series, Foreign/immigration rows.

---

## 3. Pipeline — `npm run data` (`scripts/build-data.ts`)

Sequential, deterministic, idempotent. Node 22 global `fetch`; parse with `csv-parse`.

**Inputs (exact URLs — all confirmed live 2026-07-23, ticket 01):**
- County outflow CSV → `https://www.irs.gov/pub/irs-soi/countyoutflow2223.csv` (~4.58 MB)
- County inflow CSV → `https://www.irs.gov/pub/irs-soi/countyinflow2223.csv` (~4.57 MB)
- Checked-in `scripts/crosswalk.json` (county FIPS → CBSA, 31 metros only)
- Checked-in `scripts/metros.ts` (31 CBSAs + names + pop2023 + centroid lat/lon)

**Step A — fetch (download-once).** For each IRS CSV: if `data/raw/<file>` exists, use it (local dev cache); else `fetch` → write to `data/raw/`. CI has an empty `data/raw/`, so CI always downloads fresh. No auth, public-domain (17 U.S.C. §105).

**Step B — build the lookup.** Load `crosswalk.json` into a `Map<countyFips5, cbsaCode>`. Load `metros.ts` into `Set<cbsaCode>` (the 31) + name/slug maps. Any county FIPS not in the crosswalk → not in a top-31 metro (feeds rest-of-US).

**Step C — classify + aggregate, one file per direction (single source of truth — ticket 03 §5).**
Parse each row; the join key is the IRS `Y1_STATEFIPS`+`Y1_COUNTYFIPS` / `Y2_*` fields concatenated to a **5-digit FIPS**, matching the crosswalk directly (no fuzzy matching). Suppressed cells are `-1` in N1/N2/AGI — treat as "no data," never as a number.

- **Drop entirely** (do not sum — they'd double-count): IRS reserved-FIPS aggregate rows (`Total–US and Foreign` 96/000, `Total–US` 97/000, `Same/Different State` 97/001·003, `Non-migrants`), and **all Foreign rows** (98/000, FR/57/*). This is a **domestic-only** explorer.
- **`countyoutflow2223.csv` is authoritative for all OUTbound totals; `countyinflow2223.csv` for all INbound totals.** Never sum the two files for the same directional total.
- Classify each end as `TOP31` (CBSA ∈ the 31) / other (metro-not-in-31, micropolitan, or rural → rest-of-US) / suppressed-residual (`Other flows – Same State / Different State / NE / MW / S / W` rows: a real top-31 county on one end, only a region label on the other).
- **Aggregate:**
  - `origin=TOP31, dest=TOP31` → sum N1/N2/AGI by `(origin_cbsa, dest_cbsa)` → `bucket:"metro"` pairs.
  - `origin=TOP31, dest=other` → sum into `rest_us_direct` per origin metro (and the inbound mirror).
  - suppressed-residual rows attributed to a top-31 county → **100% into `rest_us_suppressed`; never re-attribute to a specific partner metro** (would fabricate precision).

**Step D — derive.** Per pair: `agi_avg_dollars = agi_total_thousands*1000/people`. Per metro: `total_in/out`, `net`, the two ×2 rest-of-US components, `agi_avg_in/out_dollars`, and `top_partners_in/out` (sort metro pairs desc by `people`, take 10). Mint each metro's `slug`.

**Step E — QA (write to `build_meta.json`, log to console; assert, don't silently pass).**
- `suppressed_top_metro_pairs`: count top-31↔top-31 pairs that appear only via suppressed residuals / are absent — quantifies the ticket-01 under-count. **Expected ~0** (top-31 pairs are the highest-volume in the dataset); if it's large, the build session investigates before shipping.
- `inflow_outflow_discrepancies`: for pairs non-suppressed in both files, log magnitude of disagreement (QA only — not surfaced to users).
- Sanity asserts: every `bucket:"metro"` row has non-null `agi_total_thousands`; `metro_count === 31`; `total_in/out > 0` for every metro.

**Step F — write.** `public/data/metro_pairs.json`, `src/data/metro_summary.json`, `src/data/build_meta.json`. Stable key order + sorted rows so re-bakes diff cleanly.

---

## 4. App stack — `npm run build` (Astro static)

- **`astro.config.mjs`:** `output: 'static'`, `base: '/'` (subdomain root — Namesake), `site: 'https://moves.dustincoledata.com'`. No adapter (pure static; **no serverless**).
- **`src/pages/index.astro`** — the explorer. Renders the Warm Atlas frame + right rail server-side; the national **31-arc directed chord** (`d3.chordDirected` + `ribbonArrow`) and the choropleth are client-hydrated islands (D3 needs the DOM). The client chord `fetch`es `/data/metro_pairs.json` once on mount (a static CDN asset — still 100% static, no compute). `metro_summary.json` is imported at build and inlined for the rail's national summary + `<select>`. Composition/interaction/mobile/a11y = **ticket 05, verbatim** (chord-dominant + 372px rail; overview-first `selected=null`; highlight-in-place; mobile ≤640 swaps to the focus-chord = ticket-04 A form; keyboard/aria/reduced-motion locked).
- **`src/pages/metro/[slug].astro`** — `getStaticPaths` maps over `metro_summary.json` → 31 pre-rendered routes. Each page inlines its own metro's summary + partner slice at build (**no client fetch** — better for share/OG/SEO). Content = the metro-detail panel (readout + income dumbbell + Rest-of-US split) + the focus chord (the mobile hero form). OG card image is **deferred to ticket 08** (note the Namesake resvg gotcha there: `loadSystemFonts:false`).
- **Encodings/look:** hero geometry = ticket 04; palette/type/motion = `assets/look-tokens.md` → `src/styles/tokens.css`. Fonts self-hosted in `public/fonts/` (woff2) — no external font CDN (keeps it free + offline-buildable + fast).
- **Choropleth:** `us-atlas` states TopoJSON + `topojson-client`; 31 metro dots placed by `metros.ts` centroid lat/lon (fill=net, size=total churn); dots are the constant selector (click→select, hover→link).

---

## 5. Deploy — Vercel (own project, Namesake decoupling)

- **Repo:** `dustincole-data/WhereAmericaMoves` (public), confirm org at repo init.
- **Vercel project:** import the repo as its **own** project. **Node 22.** Framework preset: Astro (autodetected). **Build command:** `npm run data && npm run build` (pipeline first — CI regenerates the gitignored JSON, then Astro builds). **Install:** `npm ci`. **Output dir:** `dist`.
- **Domain:** add `moves.dustincoledata.com` to this Vercel project; create a **CNAME** `moves → cname.vercel-dns.com` at the dustincoledata.com DNS host. **No rewrite/proxy on the main site** (independent origin, like Namesake).
- **Link from dustincoledata.com:** a one-line card/link to `https://moves.dustincoledata.com` — a trivial edit in the *main* repo, **out of scope for this repo**; flag it in the ticket-08 handoff.

---

## 6. Upkeep

**One action to refresh:** when a newer IRS vintage publishes (~yearly, ~2-yr lag), edit the two IRS URLs (`2223`→`2324`) in `build-data.ts`, bump `year_pair`, re-deploy → Vercel re-runs the pipeline and rebuilds. **No cron, no DB, no serverless.** The crosswalk (`crosswalk.json`) and metro list (`metros.ts`) change only when OMB re-delineates CBSAs (every several years) — regenerate via `npm run gen:crosswalk` then hand-reconcile the 31-metro list at that point.

---

## 7. Namesake learnings applied

- **Data gitignored + CI-generated** → §1 boundary (`data/raw/`, `src/data/`, `public/data/` all ignored; regenerated by `npm run data`).
- **`base:'/'`** (subdomain root, not a sub-path) → §4.
- **`astro preview` is broken with a nested `outDir`** → verify locally with **`npm run dev`**, not `astro preview` (per `brand-site-dev-verification`).
- **`astro dev` inherits agent env vars that break it** → strip them when launching dev for local checks (per `brand-site-dev-verification`).
- **resvg `loadSystemFonts:false`** → relevant only when OG generation lands (ticket 08), noted so it isn't rediscovered.
- **Lighthouse:** local mobile baseline ~91 is expected; the **real gate is the Vercel preview** Lighthouse, not local. Protected Vercel preview URLs can fake a 200 — check the actual render.

---

## 8. Build-session acceptance checks (plan-don't-build → this is how the build proves done)

1. `npm run data` on a clean `data/raw/` downloads both CSVs and writes all three JSON; console prints the QA summary; `metro_count === 31`, `suppressed_top_metro_pairs ≈ 0`.
2. Spot-check: NY (35620) and Louisville (31140) each have plausible `top_partners_in/out`, non-null AGI, `net = in − out`.
3. `npm run build` succeeds with the generated JSON; `dist/` contains `index.html` + 31 `metro/<slug>/index.html`.
4. `npm run dev` renders: overview-first landing, select-a-metro highlight-in-place, Rest-of-US split, income dumbbell, Esc reset, mobile focus-chord (per ticket 05). Keyboard + aria-live verified (`playwright-core` + msedge).
5. Vercel preview deploys from `npm run data && npm run build`; Lighthouse gate on the preview; subdomain resolves.

---

## 9. Decisions (genuinely open sub-calls, resolved — with rationale)

1. **Metro set: curated constant, checked in — not re-derived at build.** Ticket 03 floated re-fetching Census population each bake, but the set is **30-by-pop + Louisville (#45, a deliberate hometown add)** — a pure population re-derive would silently drop Louisville and Kansas City. So the set *must* be curated. `scripts/metros.ts` holds it (CBSA, name, pop2023 snapshot, centroid). Trade-off: a future re-bake must hand-revisit the list — acceptable given the ~2-yr data cadence and LOW-upkeep mandate. `population` is context-only, so a stale snapshot never corrupts migration numbers.
2. **Crosswalk: vendored as checked-in `crosswalk.json`, not fetched/parsed each build.** The delineation is a single static vintage (July 2023, no successor) that changes every several years — reference config, not "the data." Vendoring it keeps `xlsx`/SheetJS parsing (and a census.gov network dependency) **out of the recurring CI path**; the only recurring fetch is the two IRS CSVs → more robust, lower-upkeep. `gen-crosswalk.ts` regenerates it from `list1_2023.xlsx` (`https://www2.census.gov/programs-surveys/metro-micro/geographies/reference-files/2023/delineation-files/list1_2023.xlsx`, filter `Metropolitan Statistical Area`, restrict to the 31 metros' counties) — run manually when OMB re-delineates.
3. **Single source of truth per direction** (ticket 03 §5): outbound totals from `countyoutflow`, inbound from `countyinflow`; never summed together for one directional total.
4. **Foreign rows dropped** (immigration ≠ domestic relocation); IRS reserved aggregate rows dropped (would double-count). A Foreign bucket, if ever wanted, is a new explicit category — not a fold-in.
5. **Suppression under-count is measured, not ignored** — `build_meta.json` records how many top-31 pairs the 20-return floor blanks (§3 Step E), feeding methodology copy.
6. **Chord is 31 arcs.** The design docs say "30×30"; with Louisville, N=31. Same form, one more arc — no design change.
7. **Data-load model:** national chord client-fetches `public/data/metro_pairs.json` (one static request, ~200 KB); share pages inline their slice at build (no fetch). Both are 100% static. The build session may inline the index data instead if it prefers a leaner request graph — either satisfies the constraints.

---

## 10. Self-review — coverage of the ticket's Resolve list

- **Pipeline** (steps, tooling, raw+built locations, gitignored+CI-gen) → §1, §3. ✓
- **App stack** (static generator, zero runtime compute) → §4 (`output:'static'`, no adapter, CDN-only). ✓
- **Repo & deploy** (standalone repo, own Vercel, Node 22, CI build command, subdomain CNAME, one-line main-site link) → §5. ✓
- **Upkeep** (re-run build to refresh, no cron) → §6. ✓
- **Reuse Namesake** → §7. ✓
- **Feeds** ticket 07 (copy/states live in the §4 frame+panel) and ticket 08 (assemble final spec; OG cards + per-metro share routing already scaffolded in §4). ✓
