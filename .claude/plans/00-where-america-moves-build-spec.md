# Where America Moves — Build-Ready Spec (master)

> **Plan, don't build.** This is the single **front-door** spec: every locked decision from wayfinder tickets 01–07, assembled for a separate build session. Nothing here is app code — it is the locked shape to build against. Ticket 08 (this doc) is assembly, not new design, except **§8 (share routing + OG cards)** and **§9 (main-site link)**, which were graduated-fog and are specced here in full.
>
> **How the docs in this folder relate:**
> - **This doc (00)** = the complete build spec. §1–§5 + §7 are *fully self-contained here* (their source tickets 01–05 + look tokens live only in `.scratch/`, which is **gitignored / never shipped** — so their decisions are captured here to survive).
> - **[06 — Data Pipeline & Build Architecture](06-data-pipeline-build-architecture.md)** = the authoritative, exhaustive pipeline/schema/deploy detail. §6 here summarizes it; **the build codes the pipeline against 06, not this summary.**
> - **[07 — Narrative Frame, Copy & States](07-narrative-frame-copy-states.md)** = the authoritative, verbatim copy deck + data-binding table. §7 here gives voice + frame + state map; **the build takes every user-facing string from 07, verbatim.**
> - Both 06 and 07 are committed alongside this doc. The `.scratch/where-america-moves/` tickets + prototypes are **local-only build references** (gitignored, correctly unshipped) — the build session, running on the same machine, reads the prototypes as the pixel-level reference; they are never deployed.
>
> **For the build session:** where a call was genuinely open it is resolved in a `Decisions` block with rationale — don't re-litigate. Open **veto flags** (Dustin's call, non-blocking) are consolidated in **§12**.

---

## 0. At a glance

| | |
|---|---|
| **What** | Free, static, standalone explorer: click one of **31 top metros**, see who moves in/out, net flow, and what movers earn — a dense directed **chord** hero + choropleth selector, in a light "Warm Atlas" look. |
| **Name / URL** | *Where America Moves* · **`moves.dustincoledata.com`** (Namesake-pattern subdomain). |
| **Repo** | `C:\Users\dusti\Projects\WhereAmericaMoves` → public `dustincole-data/WhereAmericaMoves` (confirm org at init). |
| **Data** | IRS SOI county-to-county migration, tax years **2022–2023** (latest). Downloaded once → aggregated to 31 metros → baked to ~1k rows of JSON. **Gitignored + CI-generated.** No cron, no runtime fetch. |
| **Stack** | Node 22 · TS (`tsx`) · `csv-parse` · Astro (`output:'static'`) · D3 submodules · `us-atlas`+`topojson-client` · **satori + @resvg/resvg-js** (OG) · Vercel static. |
| **Build** | `npm run data && npm run build` on Vercel (own project, Node 22). Subdomain via CNAME; **no main-site rewrite**. |
| **Done when** | §11 acceptance checks pass on the Vercel preview. |

**Hard constraints (verbatim, never violate):** **FREE** · **LOW upkeep** · data **baked static at build** (no cron/runtime fetch) · **~top-30 metros** (locked at **31** = top-30 by pop + Louisville) · **no animated flow / particle maps** · standalone static repo on **Vercel**, linked from dustincoledata.com.

---

## 1. Concept & framing

- **The piece:** an **explorer with a light narrative frame** — it opens on one framed headline finding, then hands the reader a fully explorable map + chord. POV is expressed by **curation** (which 31 metros, net direction, what movers earn); the tool itself stays neutral. No editorial verdicts printed on the instrument.
- **The hero is the data-viz**, not the typography. Premium **data-native**, light/sober, **near-zero-motion**. Lane: Moritz Stefaner / *Truth & Beauty*.
- **Standalone, like Namesake:** its own repo, own Vercel project, own subdomain; linked from dustincoledata.com with no proxy.

**Out of scope (ruled beyond this destination — never graduates):**
- Animated flow / particle migration maps (perf + geo-accuracy risk). Static, crisp encodings only.
- Live / cron-updated data (violates LOW-upkeep; refreshed only by re-running the build).
- Sub-metro / county-level drill-down; multi-year time animation. (Candidates for a future v2.)

---

## 2. Data foundation  *(tickets 01 + 03 — full facts in `.scratch/assets/01-…` & `03-…`)*

### 2.1 What IRS SOI supports
- **Files:** separate `countyinflow2223.csv` / `countyoutflow2223.csv`; each row = an origin↔dest **county pair** (State+County FIPS at both ends). **Bake 2022–2023** (latest published; ~2-yr lag).
- **People proxy = `N2`** ("number of individuals," 2019-20 vintage onward). `N1` = returns/households (secondary).
- **Income — pivotal limit:** an `AGI` column (thousands $, year-2, may include deficits) rides on **every** county-pair row → per-metro & metro-pair **total / average AGI = YES**. **AGI income-*band* breakdowns are STATE-level only** → a per-metro income **histogram is NOT possible**. Income can only be an **aggregate average dollar** → drives the readout-dumbbell encoding (§4).
- **Suppression:** county-pair cells **< 20 returns are blanked** (`-1`) and folded into IRS "Other flows" residuals → the natural **Rest-of-U.S. (suppressed)** feed. Top-metro↔top-metro dominant pairs survive.
- **Format/license:** CSV, ~9.16 MB/yr, **free / U.S.-gov public domain** (17 U.S.C. §105). Fits FREE + download-once + bake-static.

### 2.2 The metro set & rollup
- **Set = 31 = top-30 CBSAs by population + Louisville** (CBSA **31140**, a deliberate *hometown addition* — an addition, not a rank change; strict pop cutoff = Kansas City at #31 is unchanged; brief's "~top 30" covers it).
- **Metric = population** (Census Population Estimates), **not** gross migration volume (volume ranking is circular; population is citable/stable). List: NY (35620) → Cincinnati (17140, #30) + Louisville.
- **Crosswalk = Census "List 1" delineation, July 2023** (OMB Bulletin 23-01). 5-digit FIPS (State+County) is the direct join key to IRS `Y1_/Y2_*` — no fuzzy matching. Only vintage available; correct pairing for 2022–2023 IRS.
- **Bucketing:** metro↔metro among the 31 sums by `(origin_cbsa, dest_cbsa)`. Everything else splits into **two separate, never-merged** fields: `rest_of_us_direct` (identifiable non-metro counties) vs `rest_of_us_suppressed` (IRS privacy residuals). **Foreign rows dropped** (immigration ≠ domestic relocation). Suppressed residuals are **never re-attributed** to a specific partner (would fabricate precision).
- **Output:** two small JSON tables (`metro_pairs`, `metro_summary`) + `build_meta`, ~1,000 rows — trivial static bake. Exact schema = §6.2 / 06 §2.

---

## 3. Look — "Warm Atlas" (Light)  *(ticket 02 — tokens captured here; full study `.scratch/assets/look-reference.html`)*

Locked light stage. Dark-Hero stage **rejected** (too luminous for the light dustincoledata register). Establishes the *look*; the hero geometry (§4) is built **inside** it.

**Borrow-recipe (standing DNA — apply to every viz/composition call):** **Stefaner** = editorial rigour + credibility (the *frame*: real headline, tabular figures, sourced line, restraint — leads the register) · **Bremer**/Visual Cinnamon = spectral colour + radial glow (the *hero mark*: spectral-within-pole, soft halo, whispered on light) · **Lupi** = hand-feel + legend-as-art (the *key*: Caveat hand-lettering sparingly, annotated key, paper grain).

**Palette (hex):**
- Ground/surfaces: `--ground:#F5EFE4` (warm atlas paper + faint SVG-grain ~5% mono, multiply) · `--surface:#FBF7EF` · `--rule:#E3D8C7` (hairline)
- Ink: `--ink:#2A2521` (warm graphite) · `--ink-2:#5E5445` · `--muted:#978D7C`
- **Net-flow encoding — CVD-validated, reserved for data only** (cool = arriving/net-in, warm = leaving/net-out):
  - IN core `#1A6E9E`; spectral-within-pole `#20507F → #2E93B4`
  - OUT core `#BC4E37`; spectral-within-pole `#A8442E → #D3823C`
  - net-mid neutral `#EAE2D4`
  - glow → **soft halo**: radial `#1A6E9E` ~12%→0 behind hub; arc bloom = 4px-blur copy @ ~30%
  - Direction is **always** also carried by **sign (+/−) + word labels** — never colour-alone.

**Type (self-hosted woff2 — no font CDN):** Display/editorial **Source Serif 4** (400/500/600; italic for character) · UI/labels **Source Sans 3** (400/500/600) · Figures **JetBrains Mono** (`font-variant-numeric:tabular-nums`) · Hand accent **Caveat** — legend-as-art headings/annotations **only**, sparingly.

**Marks:** arcs 3–8px by flow, round caps, spectral-within-pole stroke, soft halo · nodes 3.2px ink dots; focus hub 8px ground-fill + 2px ink ring · 2px surface gap on overlap · recessive labels in `--ink-2`.

**Spacing/motion:** light, airy, hairline rules, generous gutters. **Motion budget near-zero** — static halo; only a **120ms "isolate on hover"** (dim siblings, highlight hovered arc); full `prefers-reduced-motion` fallback (no transition, no dim).

Copied into `src/styles/tokens.css` at build.

---

## 4. Hero viz form  *(ticket 04 — LOCKED; prototype `.scratch/assets/04-hero-viz-form.html`)*

Dustin picked **B — dense inter-metro chord** as an **always-visible national-overview hero**. (A focus-radial-chord & C arc-diagram shelved; A survives as the **mobile** hero + the deferred per-metro deep-view form.)

- **Form:** a directed circular **chord of all 31 metros** (`d3.chordDirected` + `ribbonArrow`); one group arc per metro on the ring, ribbons = directed metro↔metro flows. (Design docs say "30×30"; with Louisville it is **31 arcs** — same form, one more arc.)
- **On-select = highlight-in-place** (no view transition): selecting a metro (map dot / ring arc / menu) lights its ribbons to full colour and **hard-dims all others (~0.035)**; the rail readout carries the precise in/out/net + avg AGI. Hard-dim makes one metro legible out of the 31-way density (validated in prototype).
- **Magnitude:** ribbon width = **people exchanged**.
- **Net direction:** colour cool = gaining / warm = leaving, **spectral-within-pole** for magnitude; **always reinforced by sign + labels**. Group arc coloured by the metro's own net.
- **Income:** a **readout dumbbell** — aggregate avg AGI of in- vs out-movers, as paired figures + a dumbbell **beside** the chord, **not on the mark** (colour is reserved for net-direction; a dense chord has no capacity for a second encoding). *(This is what graduated the movers'-income fog → aggregate avg AGI, per 01's limit.)*
- **Rest-of-U.S.:** **not a ring group** (it is the majority of every metro's flow and would swamp the ribbons) — surfaced in the **readout + tooltip**, with the `direct` vs `suppressed` split disambiguated in copy.
- **Choropleth = constant selector** beside the chord: dot fill = net, dot size = total churn; **click → select** (lights ribbons + updates readout), **hover → linked highlight** (map ↔ chord). Same map regardless of state.
- **Constraint check:** static SVG/vector, light/sober, near-zero-motion, CVD-safe, readable at 31-way density. ✓

---

## 5. Composition, interaction, mobile, a11y  *(ticket 05 — LOCKED; prototype `.scratch/assets/05-composition-interaction.html`)*

### 5.1 Composition — chord-dominant + right rail
- **Frame (top):** Stefaner header — kicker + fixed-year tag (`2022–2023 IRS`), serif headline, dek. Source line in the footer.
- **Desktop (≥981px):** CSS grid, two columns — **left = hero chord card** (dominant, `minmax(520px,1fr)`, spans full rail height); **right rail = 372px** stacking **map selector card → panel → legend-as-art**.
- **Tablet (641–980px):** dense chord full-width on top; map + panel side-by-side beneath; legend full-width.
- **Mobile (≤640px):** single column — **map selector → hero (focus chord) → panel → legend** (see §5.3).
- **The panel is one region that swaps content by state** (below) — metro-detail and national-summary never fight for space.

### 5.2 Interaction — overview-first, highlight-in-place, one selection state
- **Landing = national (`selected = null`).** Chord shows *all* ribbons at ~0.14 (national gestalt); group arcs full net-colour. Panel = **national summary** (# net destinations / # departures, ~total exchanged, biggest gain + biggest loss, click-cue); income hidden; ring-centre carries the Caveat annotation "31 metros, one year".
- **On-select = highlight-in-place** (no view transition): selected ribbons → 0.92, others hard-dim → 0.035; its group arc → full, others → 0.42. Panel swaps to the **metro readout** — Moved in / out / Net (each with avg-AGI sub), the **Rest-of-U.S. line** (direct + suppressed split), and the **income dumbbell**. Ring-centre becomes a **"↺ national view"** reset; scope header + italic verdict update.
- **Select via:** click map dot · click chord group arc/label · `<select>` menu. Clicking the already-selected ring metro toggles back to national.
- **Deselect/reset via:** ring-centre "↺ national view" · panel "National view" chip · menu option · **Esc**.
- **Linked highlight:** hover/focus a map dot isolates that metro's ribbons (and emphasises the dot) — map ↔ chord as one coordinated pair.
- **Secondary controls: none beyond selection.** Year is a **fixed single snapshot** (shown in kicker) — no year control. **No in/out/net toggle** (direction already on colour + sign + readout; a dense chord can't re-weight; fights near-zero-motion/YAGNI). *(Veto flag §12.)*

### 5.3 Mobile — focus-chord on tap (the banked A form)
- **≤640px drops the dense 31-way chord** (illegible at phone width). Hero becomes the **focus radial chord**: tapped metro at the hub, its top ~10 partner metros ringing it (arc colour = net *with that partner*, sorted cool→warm), Rest-of-U.S. as one muted base spoke.
- **At rest on mobile:** national summary in the panel + a hero placeholder ("Tap a metro on the map above…").
- This ships **B as the desktop hero, A as the mobile per-metro view** — and the same focus-chord content is exactly what the **`/metro/<slug>` share page** renders (§8).

### 5.4 Accessibility (@vigil — LOCKED)
- **Non-colour encoding:** net is *always* reinforced by **sign (+/−) + word labels** ("gaining/losing", "net destination/departure") — never colour-alone.
- **Keyboard:** full select/traverse without a mouse — map dots focusable (`tabindex`, `role=button`, net-bearing `aria-label`), Enter/Space select, **←/→ step** through metros, **Esc** → national; a native `<select>` mirrors selection (robust programmatic path). Visible `:focus-visible` ring.
- **Screen reader:** an `aria-live="polite"` region announces the selected metro's in/out/net/AGI on every change; hero + map SVGs are `role="img"` with `aria-label` (strings in 07 §6).
- **Contrast:** `--ink`/`--ink-2` on warm paper (AA); `--muted` reserved for large/decorative type; encoding hues CVD-validated and always carried on large marks with text backup.
- **Reduced motion:** `prefers-reduced-motion` disables all transitions (near-zero-motion baseline regardless).

---

## 6. Build architecture  *(ticket 06 — summary; **build against [06](06-data-pipeline-build-architecture.md) verbatim**)*

Two decoupled halves in one standalone repo. (1) A **Node/TS pipeline** (`npm run data`) fetches the two IRS CSVs, rolls county flows up to the 31 CBSAs via a checked-in crosswalk, buckets the rest, and emits the JSON. (2) An **Astro static site** (`npm run build`) imports that JSON and pre-renders the explorer + 31 share routes + OG images. Vercel runs `npm run data && npm run build` — **no serverless, no cron, no runtime fetch**.

### 6.1 Repo layout (essentials — full tree in 06 §1)
```
scripts/       build-data.ts (npm run data) · metros.ts (curated 31, CHECKED IN) ·
               crosswalk.json (county→CBSA, CHECKED IN) · gen-crosswalk.ts (manual regen)
data/raw/      GITIGNORED — fetched IRS CSVs (download-once cache)
src/data/      GITIGNORED, CI-gen — metro_summary.json · build_meta.json
src/pages/     index.astro (explorer) · metro/[slug].astro (share pages) · og/[slug].png.ts (§8)
src/components/ Header · ChordHero · Choropleth · Panel · Legend · IncomeDumbbell
src/lib/       client viz (d3 chordDirected, scales, interaction)
src/styles/tokens.css   Warm Atlas tokens (§3)
public/data/   GITIGNORED, CI-gen — metro_pairs.json (client-fetched by national chord)
public/fonts/  self-hosted woff2 (Source Serif 4 / Sans 3 / JetBrains Mono / Caveat)
```
**Checked-in vs generated (satisfies "data gitignored + CI-generated"):** curated config (`metros.ts`, `crosswalk.json`), app source, styles, fonts are checked in; the 9 MB IRS download + all aggregated JSON are gitignored and regenerated every build. `.gitignore` includes `data/raw/`, `src/data/`, `public/data/`, `.scratch/`, `.vercel/`, `dist/`, `.astro/`. **Commit `.claude/plans/`** — these specs are durable.

### 6.2 Data contract (the interface — full field tables in 06 §2)
The pipeline's only job is three files; the app is coded **against this contract** and never sees a CSV.
- **`public/data/metro_pairs.json`** — one row per directed origin→dest relationship (~1k rows). Key fields: `origin_cbsa/name`, `dest_cbsa/name` (or sentinel `"REST_US"`/`"Rest of US"`), `bucket` ∈ `metro|rest_us_direct|rest_us_suppressed`, `people` (ΣN2), `returns` (ΣN1), `agi_total_thousands`, **`agi_avg_dollars`** (precomputed — app never divides), `year_pair`.
- **`src/data/metro_summary.json`** — one row per metro (N=31). Key fields: `cbsa`, **`slug`** (the pipeline mints it → routes & data agree), `name`, `population` (context only), `total_in/total_out/net`, `rest_of_us_{in,out}_{direct,suppressed}`, `top_partners_in/out` (`{cbsa,name,slug,people}[]`, top 10 desc), `agi_avg_in_dollars/agi_avg_out_dollars`.
- **`src/data/build_meta.json`** — provenance + QA (`year_pair`, `generated_utc`, `irs_source`, `crosswalk_source`, `metro_count`, `pair_rows`, `suppressed_top_metro_pairs`, `inflow_outflow_discrepancies`).
- **Excluded** (per 01 limits): county detail, any AGI-band/histogram field, multi-year series, Foreign rows.

### 6.3 Pipeline shape (full algorithm in 06 §3)
Sequential, deterministic, idempotent (Node 22 global `fetch`, `csv-parse`): **A** fetch (download-once; CI always fresh) → **B** build county→CBSA `Map` + 31-CBSA `Set` → **C** classify + aggregate, **outflow file authoritative for OUT totals, inflow for IN totals** (never summed); drop IRS reserved-aggregate + all Foreign rows; suppressed residuals → 100% `rest_us_suppressed`, never re-attributed → **D** derive per-pair `agi_avg`, per-metro totals/net/top-partners/slug → **E** QA asserts (`metro_count===31`, `suppressed_top_metro_pairs≈0`, non-null AGI on every `metro` row) → **F** write stable-sorted JSON.

### 6.4 App + deploy (full in 06 §4–§6)
- **Astro `output:'static'`**, `base:'/'`, `site:'https://moves.dustincoledata.com'`, **no adapter** (pure static, CDN-only, free).
- **`index.astro`** renders the Warm Atlas frame + rail server-side; the national **31-arc directed chord** + choropleth are client-hydrated islands (D3 needs the DOM). The chord `fetch`es `/data/metro_pairs.json` once on mount (static CDN asset); `metro_summary.json` is imported at build for the rail summary + `<select>`. Composition/interaction/mobile/a11y = §5 verbatim.
- **Choropleth:** `us-atlas` states TopoJSON + `topojson-client`; 31 dots placed by `metros.ts` centroid lat/lon.
- **Deploy:** own Vercel project, **Node 22**, build `npm run data && npm run build`, install `npm ci`, output `dist`. Domain `moves.dustincoledata.com` via **CNAME** `moves → cname.vercel-dns.com`; **no rewrite/proxy on the main site** (Namesake decoupling).
- **Upkeep = one action:** when a newer IRS vintage publishes, bump the two IRS URLs (`2223`→`2324`) + `year_pair`, re-deploy. Crosswalk/metro list change only on OMB re-delineation (every several years).

### 6.5 Namesake learnings baked in
Data gitignored + CI-gen (§6.1) · `base:'/'` subdomain root · **`astro preview` is broken with a nested `outDir` → verify with `npm run dev`, not preview** · `astro dev` inherits agent env vars that break it → **strip them** when launching dev · **resvg `loadSystemFonts:false`** (see §8) · Lighthouse: local mobile ~91 is expected, the **real gate is the Vercel preview** (protected preview URLs can fake a 200 — check the actual render).

---

## 7. Narrative frame & copy  *(ticket 07 — voice + frame here; **every string verbatim from [07](07-narrative-frame-copy-states.md)**)*

**Voice — Stefaner editorial:** quiet, exact, credible; the numbers carry the argument, prose gets out of the way; POV via **what we chose to show**, never adjectives. Sentence case for headline/dek/verdicts/body; kicker + panel titles styled caps (source string in normal case). **"U.S."** with periods in body. Minus sign is **U+2212 (`−`)** everywhere a signed number appears (the one exception: the year tag `2022–2023` uses an en-dash). Figures are mono/tabular; prose is serif.

**Locked frame:**
- **Kicker:** `Where America Moves · dustincoledata · 2022–2023 IRS` (`2022–2023 IRS` bound to `build_meta.year_pair`).
- **Headline (h1) — LOCKED recommendation A:** `America keeps moving south and west.` — a real, documented 2022–2023 pattern, stated flat. **Verification gate (build session, after the first real bake, non-negotiable):** confirm the baked `metro_summary` supports it (net-positive metros skew South/West; largest net losses are big coastal/Northern metros — expect NY, LA, SF, Chicago). If the data contradicts it, **do not print a false headline** — switch to fallback **B** `Where America moved in 2022–2023.` and flag Dustin. (Alt finding **C** banked: `The big coastal metros are still losing people.`) *(Veto flag §12.)*
- **Dek:** carries the IRS mechanism **once** + the "30 largest + Louisville" hook + the click-cue (verbatim string in 07 §3).

**States** (the panel swaps content by state — full copy + every `{token}` in 07 §4–§9): national-at-rest, metro-selected (desktop), metro-selected (mobile focus chord), mobile-at-rest placeholder, loading, and the edge/error inventory (fetch-fail, TopoJSON-fail, AGI-null guard, `rest_sup === 0`, exact-tie). **Principle: no state ever shows a bare empty box, raw null/NaN, or an error code** — every failure names what happened and what still works.

**Rest-of-U.S. honesty (load-bearing):** the metro↔metro ring is only part of a metro's churn; the Rest-of-U.S. line quantifies the rest and **keeps the IRS-suppressed sliver visible-but-separate** ("…small flows the IRS suppressed and we keep separate") — never silently mixed into partner numbers. Wording is "outside the **31** metros."

**Methodology/footer (07 §7, verbatim):** IRS SOI 2022–2023, baked-once/nothing-live, N2 = individuals, non-filers excluded, domestic-only, AGI-incl-deficits, CBSA July-2023 delineation, 20-return suppression → Rest-of-U.S. kept separate, **31 = 30-by-pop + Louisville "hometown addition."** *(Hometown-addition phrasing is a veto flag §12.)*

**Data binding:** the app **never computes a displayed number from a CSV** — the pipeline pre-derives every figure (07 §9 maps each `{token}` → a 06 contract field). The build takes the corrected "31"/"{N}" strings from 07, not from the prototype (which hard-coded a few "30"s).

---

## 8. NEW — Per-metro share routing + OG cards

> Graduated from ticket 05 as *"confirmed in-scope + speccable, folds into ticket 08."* The route is already scaffolded in 06 §4 (`src/pages/metro/[slug].astro`, `getStaticPaths` over the 31). This section specs the **routing, cross-linking, canonical/sitemap, and OG image generation** in full. 100% static — no runtime compute.

### 8.1 Routes & slugs
- **URL shape:** `https://moves.dustincoledata.com/metro/<slug>` — one static route per metro, **31 total**.
- **Slug source:** `metro_summary[i].slug`, **minted by the pipeline** (06 §2) so routes and data can't disagree. Format: lowercase, hyphenated, primary-city based, disambiguated where needed (e.g. `new-york`, `los-angeles`, `washington-dc`, `louisville`). The pipeline owns the exact slug set; the app maps over it.
- **`getStaticPaths`** in `metro/[slug].astro` returns one entry per `metro_summary` row and **inlines that metro's summary + partner slice at build** — **no client fetch** on a share page (better for share/OG/SEO and instant first paint).

### 8.2 Share-page content (reuses §5.3 + §7 — no new design)
A `/metro/<slug>` page is the **metro pre-selected**, standalone:
- **Hero = the focus chord** (the ticket-04 A form / mobile hero): this metro at the hub, its top ~10 partners ringing it, Rest-of-U.S. as the muted base spoke. Same look, same encodings.
- **Below/beside:** the **metro readout** (Moved in / out / Net + avg-AGI subs), the **Rest-of-U.S. line** (direct + suppressed split), and the **income dumbbell** — the exact §4.2 panel copy from 07, one metro bound.
- **Frame + footer:** the same Stefaner header (kicker + headline + dek) and the shared **methodology/footer** (07 §7) render on every share route.
- **Copy:** identical to the in-explorer selected state (07 §4.2/§4.3); no share-specific body strings beyond the meta/OG copy in §8.4.

### 8.3 Cross-linking, canonical, sitemap
- **Share → explorer:** every share page carries a prominent link **`See all 31 metros →`** to `/` (the full national chord). This is the primary "keep exploring" affordance.
- **Share → share:** the readout's **top-partner names link to their own `/metro/<slug>`** pages (slugs already in `top_partners_{in,out}`) — a natural, crawlable graph between metros, zero extra data.
- **Explorer → share:** the index is the shareable explorer at `/`; **selecting a metro on the index does NOT change the URL** (see Decision 2). The share surface is the standalone `/metro/<slug>` route — that's what users copy/paste and what unfurls with an OG card.
- **Canonical:** each page emits `<link rel="canonical">` to its own absolute URL; `/` is canonical for the explorer.
- **`sitemap.xml`:** generated at build listing `/` + all 31 `/metro/<slug>` (use `@astrojs/sitemap`, autodetects the static routes). `robots.txt` allows all + points to the sitemap.
- **Per-page `<title>` / meta description:** data-bound, in the 07 voice — e.g. title `{metro_name} — Where America Moves`; description = the §8.4 og:description string. Home `/` title `Where America Moves — who moves where, and what they earn`.

### 8.4 OG cards (static, build-time — Namesake pattern)
Every route gets a **1200×630 PNG** social card, generated **at build**, output **gitignored + CI-generated** (like all other data — Namesake precedent).

- **Generation:** **`satori`** (HTML/JSX + inline styles → SVG) → **`@resvg/resvg-js`** (SVG → PNG), driven from Astro static endpoints so the PNGs are pre-rendered into `dist/` — **zero runtime compute**:
  - `src/pages/og/index.png.ts` → the home card.
  - `src/pages/og/[slug].png.ts` → `getStaticPaths` over the 31 → one card per metro, each inlining that metro's `metro_summary` row.
  - Endpoints return `Content-Type: image/png`; Astro emits them as static files at `/og/index.png` and `/og/<slug>.png`.
- **⚠️ Namesake gotcha — `loadSystemFonts:false`:** the `Resvg` options **must** set `font: { loadSystemFonts: false, fontFiles: [<the woff2/ttf paths from public/fonts>] }`. CI has no system fonts, so leaving this on either fails the build or silently swaps fonts. Feed satori the same font buffers (Source Serif 4 for the headline figure, Source Sans 3 for labels). This is the single rediscovery-risk item — it's called out in 06 §7 too.
- **Card design (Warm Atlas, type-forward — Decision 3):** `--ground` paper background + faint rule; **no live chart render** (a D3 chord into satori is brittle and illegible at card scale). Layout:
  - **Metro card:** metro name (Source Serif 4, large) · the **signed net** big and colour-coded (`+12,940` cool / `−31,588` warm, with the word `gaining`/`losing`) · a one-line stat strip `{total_in} in · {total_out} out · {agi_avg_in}/{agi_avg_out} avg AGI` (mono, tabular) · a slim spectral net-swatch motif for brand texture · footer `Where America Moves · dustincoledata · 2022–2023 IRS`.
  - **Home card:** the headline finding (§7) + `31 metros · one year · IRS SOI` + the same footer + a faint ring motif.
  - Minus sign U+2212; figures use the 07 formatting rules (comma thousands; avg AGI to nearest $100).
- **Meta tags (per route):** `og:title`, `og:description`, `og:image` (**absolute** `${site}/og/<slug>.png`), `og:type=website`, `og:url` (canonical), `twitter:card=summary_large_image`, `twitter:image`.
  - Metro `og:title` = `{metro_name}`; `og:description` = `{net_signed} net · {gaining_losing} people. {total_in} moved in, {total_out} out — and what they earn, in 2022–2023 IRS data.`
  - Home `og:title` = `Where America Moves`; `og:description` = the dek's first sentence (07 §3).
  - These OG/meta strings are **new in 08** (in the 07 register); flagged for veto (§12) but not blocking.

### 8.5 Decisions (open sub-calls, resolved — rationale)
1. **Share surface = the standalone `/metro/<slug>` route only** — not a query-param on the explorer. The static route pre-renders per metro (instant paint, clean OG unfurl, crawlable, no client fetch). Simplest thing that works.
2. **No `?metro=<slug>` URL-sync on the index.** Adding history/URL state to the explorer buys little (the share route already *is* the shareable per-metro artifact) and adds state-sync complexity that fights near-zero-motion/YAGNI. *(Veto flag §12 — if Dustin wants "copy this selection" from inside the explorer, add `?metro=` read-on-load + `history.replaceState` on select; low effort, additive.)*
3. **OG cards are type-forward, no live chart.** Big legible numbers read at thumbnail scale; a satori-rendered D3 chord is brittle and muddy small. The *site* keeps "viz-is-hero"; the *card* is a share-teaser, legibility-first. *(Veto flag §12 — a baked mini-chord PNG per metro is possible later if wanted.)*
4. **OG output gitignored + CI-generated**, like all other build artifacts (Namesake pattern) — the `dist/og/*.png` are produced by the build, never committed.

### 8.6 Share/OG acceptance
- `npm run build` emits `dist/metro/<slug>/index.html` ×31 + `dist/og/index.png` + `dist/og/<slug>.png` ×31 + `dist/sitemap.xml`.
- A share page renders standalone (focus chord + readout + income + rest line + footer) with **no client `metro_pairs.json` fetch**; `See all 31 metros →` and top-partner links resolve.
- OG PNGs are 1200×630, use the bundled fonts (verify `loadSystemFonts:false` didn't blank the text), and show correct data-bound numbers for a spot-checked metro (NY + Louisville).
- Validate one unfurl in a card debugger (Twitter/Slack/OpenGraph) on the Vercel preview URL.

---

## 9. NEW — dustincoledata.com link  *(⚠️ MAIN REPO — out of scope for this repo; flag only)*

The brief requires *Where America Moves* to be **linked from dustincoledata.com**. That link is a **one-line card/link to `https://moves.dustincoledata.com`** added to the **main dustincole_data site's projects/work area** — a trivial edit in the **`dustincole_data` repo**, mirroring how Namesake is linked. It is a **separate PR in that repo**, **not part of this build**, and needs **no proxy/rewrite** on the main site (independent origin, Namesake decoupling).

**Handoff item (do NOT do it inside this repo):** after *Where America Moves* deploys, add the link/card in `dustincole_data` (its projects grid, matching the Namesake entry's pattern). Nothing in the WhereAmericaMoves repo references or depends on the main site.

---

## 10. Global constraints (restated verbatim)

- **FREE. LOW upkeep.** No paid API, no database, no serverless, no cron. Only maintenance = re-running the build for a newer IRS vintage.
- **Data downloaded once → aggregated → baked static at build. No runtime/cron fetch.** IRS raw + generated JSON are **gitignored + CI-generated** (Namesake pattern).
- **Zero runtime compute** — 100% static output (Vercel CDN serves files only) → free.
- **Standalone repo, own Vercel project, subdomain `moves.dustincoledata.com`, linked from dustincoledata.com with no main-site proxy/rewrite.**
- **Metro set = 31** (top-30 by population + Louisville). **Vintage = IRS 2022–2023** paired with **Census delineation List 1, July 2023.**
- **Out of scope:** animated flow/particle maps, live data, sub-metro drill-down, multi-year animation.

---

## 11. Build order + acceptance

**Suggested build sequence (each stage verifiable before the next):**
1. **Scaffold** the repo (§6.1): Astro static, `tokens.css` from §3, self-hosted fonts, `metros.ts` (31) + `crosswalk.json` checked in, `.gitignore`.
2. **Pipeline** `build-data.ts` (06 §3) → emits the three JSON against the §6.2 contract. *Acceptance:* `npm run data` on a clean `data/raw/` downloads both CSVs and writes all three JSON; QA prints `metro_count===31`, `suppressed_top_metro_pairs≈0`; spot-check NY (35620) + Louisville (31140) have plausible top-partners, non-null AGI, `net = in − out`.
3. **Explorer** `index.astro` — Warm Atlas frame + rail; client-hydrated 31-arc chord + choropleth; §5 composition/interaction/mobile/a11y; §7 copy verbatim. *Acceptance:* `npm run dev` renders overview-first landing, select→highlight-in-place, Rest-of-US split, income dumbbell, Esc reset, mobile focus-chord; keyboard + aria-live verified (`playwright-core` + msedge). **Verify with `npm run dev`, not `astro preview`; strip agent env vars first.**
4. **Share routes + OG** (§8) — `metro/[slug].astro` ×31, `og/*.png.ts`, sitemap. *Acceptance:* §8.6.
5. **Deploy** — Vercel own project, Node 22, `npm run data && npm run build`; add subdomain CNAME. *Acceptance:* preview deploys from the full build command; **Lighthouse gate on the Vercel preview** (not local); subdomain resolves; **run the §7 headline verification gate against the real bake** and switch to fallback B if contradicted.
6. **(Separate, main repo)** add the dustincoledata.com link (§9).

**The headline verification gate (§7) and the `loadSystemFonts:false` OG detail (§8.4) are the two things most likely to bite — check them explicitly.**

---

## 12. Open flags for veto  *(Dustin's call — non-blocking; recommendations stand until vetoed)*

1. **Headline finding (§7):** **A** `America keeps moving south and west.` — recommended + gated to the real bake. B (neutral) / C (coastal-loss) banked. Or hand your own line (≤~48 chars, one clause, sentence case).
2. **"hometown addition" in the footer (§7):** included as light honest curation. One-word veto → neutral `plus Louisville.`
3. **Inflow/outflow toggle on a selected metro (§5.2):** recommended **no** (direction already on colour + sign + readout; fights near-zero-motion/YAGNI).
4. **`?metro=<slug>` deep-link on the explorer (§8.5-2):** recommended **no** (the share route is the shareable artifact). Additive later if wanted.
5. **OG card style (§8.5-3):** recommended **type-forward, no live chart** (legible at thumbnail). A baked mini-chord PNG is a later option.
6. **New OG/meta strings (§8.4):** written in the 07 register; confirm or reword.

---

## 13. Companion docs & references

- **[06 — Data Pipeline & Build Architecture](06-data-pipeline-build-architecture.md)** — authoritative pipeline algorithm, exact schemas, deploy detail. *(committed, this folder)*
- **[07 — Narrative Frame, Copy & States](07-narrative-frame-copy-states.md)** — authoritative verbatim copy deck + `{token}` → contract binding. *(committed, this folder)*
- **Local-only build references** *(in `.scratch/where-america-moves/` — gitignored, never shipped; read on the build machine):*
  - `assets/04-hero-viz-form.html` — the hero chord prototype (form B is locked).
  - `assets/05-composition-interaction.html` — the composition prototype (the pixel-level build reference; verified in-browser).
  - `assets/look-reference.html` + `assets/look-tokens.md` — the look study + tokens (Stage L locked).
  - `assets/01-…facts.md` · `assets/03-…bucketing.md` — full IRS + metro-set/crosswalk facts.
  - `map.md` + `issues/01–08` — the wayfinder decision trail.

**Provenance:** IRS SOI county-to-county migration 2022–2023 (public domain, 17 U.S.C. §105) · Census List 1 delineation July 2023 (OMB Bulletin 23-01) · Census Population Estimates.
