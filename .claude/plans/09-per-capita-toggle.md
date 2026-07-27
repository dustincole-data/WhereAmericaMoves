# Where America Moves — Per-Capita Toggle (ticket 09)

> **Plan, don't build.** Design spec for a **People ⟷ Per 1,000 residents** mode toggle on the explorer. Approved 2026-07-26. A separate build session implements it against this doc.
>
> **Scope discipline:** this is an additive mode on the existing instrument. No re-encoding, no re-layout, no new data source, no pipeline change. Every locked string from ticket 07 stays locked in People mode; rate mode adds a small set of new strings defined in §6.

**Inherits:** 04 (encodings) · 05 (composition/states/a11y) · 06 (data contract) · 07 (copy). Population already ships in the contract — see §2.

---

## 1. What ticket 09 owns

A two-state mode on `/` (the explorer) that rescales **both graphs** and every number that accompanies them:

1. The **mode control** and its state machine (§4).
2. **Rate derivation** on the view model + the second colour domain (§2, §3).
3. **Dense chord** in rate units — matrix, arc colour, ribbon colour, tooltip (§3.1).
4. **Choropleth** in rate units — dot fill *and* dot size, tooltip, aria (§3.2).
5. **Panel + live region** in rate units, including the national extremes (§5).
6. **New copy** — mode labels, rate-mode hints, the denominator note (§6).
7. **Formatters** for one-decimal signed rates (§7).

**Not in 09:**
- The 30 `/metro/<slug>` share pages. They stay raw-people SSR. Their focus chord is a different form, their OG cards are baked in raw counts, and a mode control that can't survive the share link is worse than none. `metroPanelCoreHTML` therefore gains an **optional** mode param defaulting to `'people'` so no SSR call site changes.
- OG cards, routing, the pipeline, the legend's visual form.
- URL/localStorage persistence. The explorer has **no** URL state today (even metro selection is ephemeral); the toggle matches that. Do not add a `?per=` param.

---

## 2. Data — population is already in the contract

`scripts/metros.ts` carries `population` (Census POPESTIMATE2023) for all 30, and `scripts/build-data.ts:245` already writes it into `metro_summary.json`. **No pipeline change, no new download, no new provenance.** It is currently consumed only as ring order.

### 2.1 `MetroView` additions (`src/lib/data.ts`)

| Field | Derivation |
|---|---|
| `pop` | `s.population` (pass-through) |
| `in_rate` | `total_in / pop * 1000` |
| `out_rate` | `total_out / pop * 1000` |
| `net_rate` | `net / pop * 1000` |
| `churn_rate` | `(total_in + total_out) / pop * 1000` |

All four stored **unrounded**; rounding is a display concern only (§7).

### 2.2 New module constants

- `MAX_NET_RATE = max(|net_rate|)` over VIEWS — the diverging colour scale needs its own domain per mode, or rate mode renders nearly monochrome.
- `TOP_GAIN_RATE` / `TOP_LOSS_RATE` — the rate-mode extremes for the national panel (§5.2).

### 2.3 Invariant worth stating

`pop > 0` for all 30, so **`sign(net_rate) === sign(net)` always**. Therefore `N_DEST` / `N_DEPART` / `N_EVEN`, `verdictShort`, `verdictArticle`, `gainLose`, and every `pos`/`neg` CSS class are **mode-independent**. Only *magnitudes* and *rankings* change. This is what keeps §5 and §6 small.

### 2.4 Mode type

```ts
export type Mode = 'people' | 'per1k';
```
Lives in `data.ts` next to the view model; imported by `viz.ts`, `copy.ts`, `format.ts`, `explorer.ts`.

---

## 3. The two graphs

### 3.1 Dense chord (`renderDense`, `src/lib/viz.ts`)

- **Matrix.** `explorer.ts` builds `mx[i][j] += p.people` from `metro_pairs.json`. Rate mode builds a second matrix from the same fetched pairs: `mx[i][j] = people(i→j) / pop[i] * 1000` — every flow divided by the population of **where the movers left**. Build both once on fetch; the toggle swaps which is passed, it does not re-fetch.
- **Semantics.** `chordDirected` gives each ordered pair its own arrowed ribbon, so one ribbon = one directed quantity = "per 1,000 residents of the origin metro." Clean per ribbon. The residual wart: a metro's **arc** sums its own out-rates plus 29 in-rates carried in *other* metros' denominators. Accepted — the arc already mixes in and out in People mode, so this is not a new sin, and the ring is normalised to 360° either way.
- **Ring order stays `METROS` order (population-desc) in both modes.** Deliberate: same 30 arcs in the same seats means flipping the toggle reads as an A/B of one instrument, not a redraw of a different one. Do not sort by rate.
- **Colour.** `netColor(views[i].net, maxNet)` → `netColor(net or net_rate, MAX_NET or MAX_NET_RATE)`. Applies to both the group arcs and the ribbons.
- **Tooltip.** Mode-aware figure and unit (§6.3).
- `renderDense`'s signature already takes `matrix` and `maxNet`; add `mode` for the tooltip only.

### 3.2 Choropleth (`buildMap`, `src/lib/viz.ts`)

**Fill and size must switch together** or the map is mixed-unit — this is the single most important rule in the ticket.

| Encoding | People | Per 1,000 |
|---|---|---|
| dot fill + halo | `netColor(net, MAX_NET)` | `netColor(net_rate, MAX_NET_RATE)` |
| dot radius | `scaleSqrt([0, max(total_in+total_out)] → [3,16])` | `scaleSqrt([0, max(churn_rate)] → [3,16])` |

- **Keep the zero baseline** on the sqrt size domain in both modes. Non-zero-baseline area encoding exaggerates differences and is not worth it here: the rank flip is total and legible (New York 16.0 → 11.2 px; Austin 10.2 → 15.8 px; Orlando 10.9 → 16.0 px, the rate-mode maximum).
- **Known consequence, accepted:** the `[3,16]` range floor plus a churn-rate spread that bottoms out at 40% of its max compresses rate-mode dots into 11.2–16.0 px, against People mode's 7.6–16.0. Size differences read more softly in rate mode; the *ranking* inverts completely and colour carries net independently. Shifting the domain off zero would restore the spread by lying about the ratios — do not.
- Both scales are built once at `buildMap` time; `draw()` picks by current mode.
- `dotTipHTML` and the dot `aria-label` become mode-aware (§6.3, §6.4).

### 3.3 The payoff, for verification (§9)

| | People | Per 1,000 residents |
|---|---|---|
| Biggest net gain | Dallas +39,109 | **Charlotte +7.1** |
| Biggest net loss | New York −174,207 | **New York −8.8** |
| Largest dot (churn) | New York (675k) | **Orlando (86.1)** — Austin 82.9 second |
| Smallest churn | — | **New York 34.1** |

The churn inversion is the reason this ticket exists: today the map's dot sizes say New York and LA are America's big movers. Per capita they are among its stillest metros. That story is currently unreachable on the site.

---

## 4. The control

- **Form.** Two-state segmented control, in the chord card header (`.chordhead`) beside `#scope`. It governs both graphs, so it sits above both — not in the map card.
- **Labels.** `People` · `Per 1,000 residents`. On the compact/mobile viewBox, the second may shorten to `Per 1,000`.
- **Default.** `people`. Raw counts stay the site's front door.
- **State.** One module-level `let mode: Mode = 'people'` in `explorer.ts`, alongside `selected`. Changing it calls the existing `refresh()` — no new render path. Selection **survives** a mode change; mode **survives** a selection change.
- **A11y.** `role="radiogroup"` with two `role="radio"` buttons, `aria-checked`, roving tabindex, ←/→ to move between them. `Escape` and the existing global ←/→ metro-stepping keys must not fire while focus is inside the control (`explorer.ts:190` already guards `input`/`textarea`/`select` — extend the guard to the control).
- **Announcement.** On change, `#live` gets the mode-aware `liveNational()` / `liveMetro()` string (§6.4), which already names the units.

---

## 5. Panel

### 5.1 Metro readout — `metroPanelCoreHTML(m, mode = 'people')`

Worked example, Charlotte (real contract values):

| Cell | People | Per 1,000 |
|---|---|---|
| Moved in | `102,284` / `$49,200 avg AGI` | `36.3` / `per 1,000 residents` |
| Moved out | `82,202` / `$48,900 avg AGI` | `29.2` / `per 1,000 residents` |
| Net | `+20,082` / `gaining people` | `+7.1` / `gaining, per 1,000` |

- **AGI is untouched in both modes.** It is already a per-person average; dividing it by population is meaningless. In rate mode the `.sub` line under Moved in / Moved out carries the unit instead, and the income dumbbell (`incomeHTML`) renders **identically in both modes**, in dollars.
- **Rest-of-U.S. line** (`restLineHTML`) switches to rates, including the suppressed-flows figure — they are counts and normalise correctly.
- `verdict` line: unchanged (§2.3).

### 5.2 National panel — `nationalPanelHTML(mode)`

Only **two** things change, because of §2.3:

- *Biggest gain* / *Biggest loss* cells read `TOP_GAIN_RATE` / `TOP_LOSS_RATE` with rate figures.
- The unit word in those cells (`net` → `net per 1,000`).

The lead sentence is **unchanged in both modes**: the destination/departure counts are identical under a positive rescale, and "they trade about 2.x million people with one another" is a national count, not a cross-metro comparison — leave it raw. The `Click any metro` cue is unchanged.

---

## 6. New copy

Additive only. Every ticket-07 string stays verbatim in People mode.

### 6.1 Control
- `MODE_LABEL_PEOPLE = 'People'`
- `MODE_LABEL_RATE = 'Per 1,000 residents'`
- `MODE_GROUP_LABEL = 'Show figures as'` (the radiogroup's accessible name)

### 6.2 Hints — rate-mode variants
- `HERO_HINT_NATIONAL_RATE` — "Each ribbon is people exchanged between two metros, per 1,000 residents of the metro they left; colour is net direction (cool = gaining, warm = leaving). Pick a metro on the map to light it here."
- `MAP_HINT_RATE` — "Dot size = total movers (in + out) per 1,000 residents · fill = net direction."
- `HERO_HINT_SELECTED` is unit-free — **unchanged in both modes.**

### 6.3 Tooltips
- Chord arc, rate mode: `net −8.8 per 1,000 — losing`
- Map dot, rate mode: `36.3 in · 29.2 out` / `net +7.1 per 1,000 — gaining`

### 6.4 Live region — `liveMetro(m, mode)`
Rate mode: "Charlotte, NC-SC selected. 36.3 moved in per 1,000 residents, 29.2 moved out, net +7.1, gaining. Average AGI $49,200 in versus $48,900 out." AGI clause unchanged (§5.1). `liveNational()` is unchanged (§2.3).

### 6.5 The denominator note — **required, non-negotiable**

Appears in the legend card while rate mode is active, **and permanently in the footer methodology**:

> Rates use Census 2023 metro population. IRS migration counts tax filers and their dependents — not every resident — so rates run slightly low.

Rationale: the numerator (IRS filer exemptions) and the denominator (total resident population) are different universes. The ratio is the standard published migration rate and is fine to show, but the page does not get to imply the two match.

### 6.6 Legend
The three swatch rows read "net gain of people" / "net loss of people" — direction language, not unit language, and §2.3 makes direction mode-independent. **Leave them unchanged.** The only legend delta is §6.5's note appearing in rate mode.

---

## 7. Formatters (`src/lib/format.ts`)

- `fmtRate(n)` → signed, one decimal, U+2212 for negatives: `+7.1`, `−8.8`.
- `fmtRateAbs(n)` → unsigned, one decimal: `36.3`.

One decimal everywhere. These figures carry ~2 significant digits of real information; more decimals are false precision, fewer collapse the middle of the ranking.

**Known rounding wart, accepted:** at one decimal, displayed `in − out` can differ from displayed `net` by 0.1. All three derive independently from unrounded values, and no copy in this ticket asserts the subtraction. Do **not** "fix" it by deriving `net_rate` from the rounded parts — that would put a wrong number in the most-read cell to protect an arithmetic no one performs.

---

## 8. Files touched

| File | Change |
|---|---|
| `src/lib/data.ts` | `pop` + 4 rate fields on `MetroView`; `Mode` type; `MAX_NET_RATE`, `TOP_GAIN_RATE`, `TOP_LOSS_RATE` |
| `src/lib/format.ts` | `fmtRate`, `fmtRateAbs` |
| `src/lib/copy.ts` | §6 strings; `mode` param on `metroPanelCoreHTML` (**optional, defaults `'people'`**), `nationalPanelHTML`, `liveMetro` |
| `src/lib/viz.ts` | `renderDense` mode-aware tooltip; `buildMap` mode-aware fill + size scale + tooltip + aria |
| `src/lib/explorer.ts` | `mode` state, rate matrix built alongside the people matrix, control wiring, keyboard guard, hint swap |
| `src/pages/index.astro` | the control markup in `.chordhead` |
| `src/components/Legend.astro` | §6.5 note, shown in rate mode |
| `src/components/Footer.astro` | §6.5 note, permanent |
| `src/styles/*` | segmented-control styling in the existing Warm Atlas tokens |

**Untouched:** `scripts/` (whole pipeline), `src/pages/metro/[slug].astro`, `src/pages/og/*`, `src/lib/og.ts`, `src/lib/share.ts`, `src/lib/colors.ts`.

**Pre-existing, out of scope:** the dot aria-label is duplicated between `copy.ts:54` (`dotAria`) and an inline template at `viz.ts:482`. Make both mode-aware; do **not** refactor the duplication in this ticket.

---

## 9. Verification

No test suite in this repo. Verify in `npm run dev` (**not** `astro preview` — broken with the nested outDir), desktop + a 375px viewport:

1. **Default is People**, and every figure matches today's site exactly. Regression floor.
2. **Rate mode, national:** Orlando is the largest dot, Austin second; New York is visibly smaller than in People mode. Panel extremes read Charlotte `+7.1` and New York `−8.8`.
3. **Rate mode, select Charlotte:** readout reads `36.3` / `29.2` / `+7.1`; AGI cells unchanged from People mode; rest-of-U.S. line in rates.
4. **Mode ⟷ selection independence:** select a metro, flip the mode → selection held, hint and figures switched. Flip back → identical to step 1 for that metro.
5. **Chord invariance:** the 30 arcs occupy the same seats in the same order in both modes; only widths, colours and ribbons change.
6. **Denominator note** visible in rate mode (legend) and in both modes (footer).
7. **Keyboard:** Tab reaches the control, ←/→ switches mode without also stepping the metro selection; Tab out, ←/→ steps metros again.
8. **Share pages untouched:** `/metro/charlotte` renders exactly as before, no control, raw counts.
