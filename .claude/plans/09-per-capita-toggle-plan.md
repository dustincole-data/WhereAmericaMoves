# Per-Capita Toggle — Implementation Plan (ticket 09)

> **For agentic workers:** implement task-by-task. Steps use checkbox (`- [ ]`) syntax.
> **Spec:** `.claude/plans/09-per-capita-toggle.md` — authoritative. This plan sequences it; where they disagree, the spec wins.

**Goal:** Add a **People ⟷ Per 1,000 residents** toggle to the explorer at `/` that rescales the dense chord, the choropleth (fill *and* dot size), the panel, tooltips, hints and the live region.

**Architecture:** One `Mode` value threaded from a single `let mode` in `explorer.ts` down through the existing `refresh()` render path. No new render path, no new fetch, no pipeline change — population already ships in `metro_summary.json`. Rate figures are derived once onto `MetroView`; the rate chord matrix is built once alongside the people matrix when `metro_pairs.json` lands.

**Tech Stack:** Astro 7 (static), TypeScript 7, d3 (chord/geo/scale/selection), vanilla DOM. Node ≥22.

## Global Constraints

- **No test runner exists in this repo.** Gates are `npx tsc --noEmit` → `npm run build` → browser verification against spec §9. Do not add a test framework.
- **Verify in `npm run dev`, never `astro preview`** — preview is broken with this project's nested `outDir`.
- `astro dev` can inherit agent env vars that break it; if the dev server misbehaves, launch from a clean shell.
- **U+2212 (`−`) for every negative number**, per `format.ts`. Never a hyphen.
- **Ticket-07 copy is locked.** People mode must render byte-identical strings to today. Rate mode only *adds* strings.
- **Surgical edits.** `scripts/`, `src/pages/metro/`, `src/pages/og/`, `src/lib/og.ts`, `src/lib/share.ts`, `src/lib/colors.ts` are untouched.
- `metroPanelCoreHTML`'s new `mode` param is **optional, defaulting to `'people'`** so the SSR share page call site at `src/pages/metro/[slug].astro:64` needs no change.
- Do not refactor the pre-existing `dotAria` duplication between `copy.ts:54` and `viz.ts:482`; make both mode-aware and leave the duplication.
- One decimal on every rate. Derive `net_rate` from raw `net`, never from rounded parts.

---

### Task 1: Data layer + formatters

**Files:**
- Modify: `src/lib/data.ts`
- Modify: `src/lib/format.ts`

**Produces (later tasks depend on these exact names):**
```ts
export type Mode = 'people' | 'per1k';
// on MetroView: pop, in_rate, out_rate, net_rate, churn_rate  (all unrounded)
export const MAX_NET_RATE: number;
export const TOP_GAIN_RATE: MetroView;
export const TOP_LOSS_RATE: MetroView;
export const fmtRate: (n: number) => string;     // signed, 1dp, U+2212  → "+7.1" / "−8.8"
export const fmtRateAbs: (n: number) => string;  // unsigned, 1dp        → "36.3"
```

- [ ] **Step 1** — `data.ts`: add `Mode`; add `pop` + the four rate fields to the `MetroView` interface and to the `VIEWS.map` body (`pop: m.population`, `in_rate: s.total_in / m.population * 1000`, etc.).
- [ ] **Step 2** — `data.ts`: add `MAX_NET_RATE = Math.max(1e-9, ...VIEWS.map(v => Math.abs(v.net_rate)))` beside `MAX_NET`; add `TOP_GAIN_RATE` / `TOP_LOSS_RATE` mirroring the existing `TOP_GAIN` / `TOP_LOSS` reducers but on `net_rate`.
- [ ] **Step 3** — `format.ts`: add `fmtRate` and `fmtRateAbs` using the existing `MINUS` constant.
```ts
/** signed, one decimal; U+2212 for negatives (§7) */
export const fmtRate = (n: number): string => (n >= 0 ? '+' : MINUS) + Math.abs(n).toFixed(1);
/** unsigned, one decimal */
export const fmtRateAbs = (n: number): string => Math.abs(n).toFixed(1);
```
- [ ] **Step 4** — Gate: `npx tsc --noEmit`. Expected: clean.
- [ ] **Step 5** — Sanity-check the derived values against spec §3.3 before moving on:
```bash
node -e "const s=require('./src/data/metro_summary.json');const r=s.map(m=>({n:m.name,net:m.net/m.population*1000,ch:(m.total_in+m.total_out)/m.population*1000}));console.log(r.slice().sort((a,b)=>b.net-a.net)[0], r.slice().sort((a,b)=>a.net-b.net)[0], r.slice().sort((a,b)=>b.ch-a.ch)[0]);"
```
Expected: `Charlotte ≈ +7.13`, `New York ≈ −8.80`, top churn `Orlando ≈ 86.1`.
- [ ] **Step 6** — Commit: `feat(09): rate fields, Mode type and rate formatters`

---

### Task 2: Copy layer

**Files:**
- Modify: `src/lib/copy.ts`

**Consumes:** Task 1's `Mode`, rate fields, `TOP_GAIN_RATE`, `TOP_LOSS_RATE`, `fmtRate`, `fmtRateAbs`.

**Produces:**
```ts
export const MODE_LABEL_PEOPLE: string;   // 'People'
export const MODE_LABEL_RATE: string;     // 'Per 1,000 residents'
export const MODE_LABEL_RATE_SHORT: string; // 'Per 1,000'  (compact viewport)
export const MODE_GROUP_LABEL: string;    // 'Show figures as'
export const HERO_HINT_NATIONAL_RATE: string;
export const MAP_HINT_RATE: string;
export const DENOMINATOR_NOTE: string;
export function nationalPanelHTML(mode?: Mode): string;
export function metroPanelCoreHTML(m: MetroView, mode?: Mode): string;  // mode defaults 'people'
export const liveMetro: (m: MetroView, mode?: Mode) => string;
export const dotAria: (m: MetroView, mode?: Mode) => string;
```

- [ ] **Step 1** — Add the §6.1 control strings and §6.2 rate hints verbatim from the spec.
- [ ] **Step 2** — Add `DENOMINATOR_NOTE` verbatim from spec §6.5:
  `'Rates use Census 2023 metro population. IRS migration counts tax filers and their dependents — not every resident — so rates run slightly low.'`
  (em dash as written; this string is shared by the legend and the footer.)
- [ ] **Step 3** — `metroPanelCoreHTML(m, mode = 'people')`: branch the three `.fig`/`.sub` cells only. `incomeHTML(m)` and the `verdict` line are called unchanged in both modes (spec §5.1 — AGI never normalises). In rate mode the in/out `.sub` reads `per 1,000 residents` and the net `.sub` reads `${gainLose(m.net)}, per 1,000`.
- [ ] **Step 4** — `restLineHTML(m, mode)`: rates for `rest_in`, `rest_out`, `rest_sup_total`; wording otherwise unchanged.
- [ ] **Step 5** — `nationalPanelHTML(mode = 'people')`: swap **only** the two extremes cells to `TOP_GAIN_RATE`/`TOP_LOSS_RATE` + `fmtRate` + label `net per 1,000`. Lead sentence and cue unchanged (spec §5.2 — sign is mode-independent).
- [ ] **Step 6** — `liveMetro(m, mode)` and `dotAria(m, mode)` per spec §6.4 / §6.3.
- [ ] **Step 7** — Gate: `npx tsc --noEmit`. Expected: clean, and **no error at `src/pages/metro/[slug].astro:64`** — proof the default param held.
- [ ] **Step 8** — Commit: `feat(09): mode-aware copy layer + denominator note`

---

### Task 3: Viz layer

**Files:**
- Modify: `src/lib/viz.ts`

**Consumes:** Task 1 + Task 2 exports.

**Produces:** `renderDense(..., mode)` and `buildMap(..., mode getter)` rendering in the active mode.

- [ ] **Step 1** — `renderDense`: add a `mode: Mode` parameter (after `compact`). Introduce `const netOf = (v: MetroView) => mode === 'per1k' ? v.net_rate : v.net;` and use it in the two `netColor(...)` calls (group arcs line ~71, ribbons line ~161). `maxNet` is already a parameter — the caller passes `MAX_NET_RATE` in rate mode.
- [ ] **Step 2** — `renderDense` arc tooltip: rate mode reads `net ${fmtRate(m.net_rate)} per 1,000 — ${gainLose(m.net)}`. Keep the existing `.mono` + `in`/`out` class logic keyed off `m.net` (sign is mode-independent).
- [ ] **Step 3** — `buildMap`: add a `getMode: () => Mode` parameter (mirrors the existing `getSelected` getter so `draw()` re-reads it). Build **both** size scales once:
```ts
const dotR = scaleSqrt().domain([0, Math.max(1, ...views.map(m => m.total_in + m.total_out))]).range([3, 16]);
const dotRRate = scaleSqrt().domain([0, Math.max(1, ...views.map(m => m.churn_rate))]).range([3, 16]);
```
Zero baseline in both (spec §3.2 — do not shift the domain).
- [ ] **Step 4** — `buildMap.draw()`: derive `const per = getMode() === 'per1k'` once, then `size(d) = per ? dotRRate(d.churn_rate) : dotR(d.total_in + d.total_out)` and `fill = netColor(per ? d.net_rate : d.net, per ? MAX_NET_RATE : maxNet)`. Apply to `.halo` (+5), `.core`, `.ring` (+3.5). **Fill and size must both switch** — this is the ticket's central rule.
- [ ] **Step 5** — `dotTipHTML` and the dot `aria-label` become mode-aware per spec §6.3; the aria-label delegates to `dotAria(d, getMode())`.
- [ ] **Step 6** — Gate: `npx tsc --noEmit`. Expected: clean except call-site arity errors in `explorer.ts` (Task 4 fixes them).
- [ ] **Step 7** — Commit: `feat(09): mode-aware chord and choropleth encodings`

---

### Task 4: Control + explorer state

**Files:**
- Modify: `src/lib/explorer.ts`
- Modify: `src/pages/index.astro`
- Modify: `src/styles/app.css`

**Consumes:** Tasks 1–3.

- [ ] **Step 1** — `index.astro`: add the segmented control inside `.chordhead`, between `#scope` and `#verdict`:
```html
<div class="modeswitch" id="modeSwitch" role="radiogroup" aria-label={MODE_GROUP_LABEL}>
  <button type="button" role="radio" data-mode="people" aria-checked="true" tabindex="0">{MODE_LABEL_PEOPLE}</button>
  <button type="button" role="radio" data-mode="per1k" aria-checked="false" tabindex="-1">
    <span class="wide">{MODE_LABEL_RATE}</span><span class="narrow">{MODE_LABEL_RATE_SHORT}</span>
  </button>
</div>
```
- [ ] **Step 2** — `app.css`: style `.modeswitch` in existing Warm Atlas tokens — `--ground` track, `--rule` hairline border, `border-radius: 7px`, 12px `--font-sans`, `--ink-2` idle / `--surface` on `--ink` when checked, matching `#metroPick`'s visual weight. Show `.wide` / hide `.narrow` above 640px and invert below, inside the existing `@media (max-width: 640px)` block.
- [ ] **Step 3** — `explorer.ts`: add `let mode: Mode = 'people';` beside `selected`, and `let matrixRate: number[][] | null = null;`.
- [ ] **Step 4** — `explorer.ts`: in the `metro_pairs.json` `.then()`, build the rate matrix in the same loop: `mxRate[i][j] += p.people / VIEWS[i].pop * 1000;` Store both. `renderHero()` picks `mode === 'per1k' ? matrixRate : matrix` and passes `MAX_NET_RATE` or `MAX_NET`, plus `mode`.
- [ ] **Step 5** — `explorer.ts`: pass `() => mode` to `buildMap`; pass `mode` into `renderPanel()`'s `metroPanelCoreHTML` / `nationalPanelHTML`, into `announce()`'s `liveMetro`, and swap the hint in `syncHead()` to `HERO_HINT_NATIONAL_RATE` when `selected === null && mode === 'per1k'`.
- [ ] **Step 6** — `explorer.ts`: wire the control. Click and ←/→ set `mode`, update both buttons' `aria-checked` + roving `tabindex`, then call the existing `refresh()`. Selection must survive (do not touch `selected`).
- [ ] **Step 7** — `explorer.ts:190`: extend the global keydown guard so ←/→ inside the control switches mode instead of stepping the metro selection — add `if ((document.activeElement as Element)?.closest?.('.modeswitch')) return;` alongside the existing tag guard.
- [ ] **Step 8** — `explorer.ts`: swap `MAP_HINT` → `MAP_HINT_RATE` in rate mode. `MAP_HINT` is currently rendered by `index.astro` as static SSR text; give that `<div class="hint">` an id (`maphint`) and set its `textContent` from `syncHead()`.
- [ ] **Step 9** — Gate: `npx tsc --noEmit` then `npm run build`. Both clean.
- [ ] **Step 10** — Browser gate (`npm run dev`): **People mode must be pixel-identical to `main`** — this is the regression floor. Then flip to rate mode and confirm Orlando is the largest dot and New York visibly shrinks.
- [ ] **Step 11** — Commit: `feat(09): per-capita mode control and explorer wiring`

---

### Task 5: Denominator note

**Files:**
- Modify: `src/components/Legend.astro`
- Modify: `src/components/Footer.astro`

- [ ] **Step 1** — `Footer.astro`: add `DENOMINATOR_NOTE` as a permanent `<p>`, after the CBSA/30-largest paragraph and before the suppression paragraph (it belongs with the population caveat, not the privacy one).
- [ ] **Step 2** — `Legend.astro`: add `<div class="foot ratenote" hidden>{DENOMINATOR_NOTE}</div>` after the existing `.foot`.
- [ ] **Step 3** — `explorer.ts`: toggle its `hidden` attribute from `syncHead()` on mode change. The share pages import `Legend` too and never run `explorer.ts`, so it stays hidden there — correct, since they are People-only.
- [ ] **Step 4** — Gate: `npm run build`, then confirm in dev that `/metro/charlotte` shows the legend **without** the rate note and with no control.
- [ ] **Step 5** — Commit: `feat(09): denominator note in legend and footer`

---

### Task 6: Spec §9 verification pass

**Files:** whatever the checks break.

- [ ] **Step 1** — Run all 8 checks in spec §9 at desktop width and at 375px, in `npm run dev`. Capture a screenshot of national People, national rate, and Charlotte-selected rate.
- [ ] **Step 2** — Confirm check 4 explicitly (mode ⟷ selection independence) and check 7 (keyboard: Tab into the control, ←/→ switches mode only; Tab out, ←/→ steps metros again).
- [ ] **Step 3** — Fix any fallout. Re-run `npx tsc --noEmit` and `npm run build`.
- [ ] **Step 4** — Commit: `feat(09): per-capita toggle verified against spec §9`
