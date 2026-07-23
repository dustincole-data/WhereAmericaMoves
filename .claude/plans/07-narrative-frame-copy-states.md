# Where America Moves — Narrative Frame, Copy & States (ticket 07)

> **Plan, don't build.** This is the *words + states* half of the spec, resolving ticket *Narrative frame + copy/states*. A separate build session wires these strings into the frame + panel defined by ticket 05; ticket *Assemble spec* (08) folds this into the single final spec. Nothing here is app code — it is the locked copy and its data bindings.
>
> **For the build session:** every user-facing string below is final and verbatim. `{tokens}` are the only dynamic parts; each maps to an exact field of the ticket-06 data contract in **§9 Data-binding table**. Don't reword locked strings; don't invent new ones. Where copy depends on state, the state is named in **§4**. The one genuinely editorial call (the headline finding) is resolved with a recommendation + a verification gate in **§3** — flagged for veto, not open to re-litigate elsewhere.

**Inherits:** 01 (data shape/limits) · 04 (encodings: net = colour+sign+label, income = readout dumbbell, Rest-of-US = readout+tooltip) · 05 (composition, states, a11y) · 06 (`metro_pairs` / `metro_summary` / `build_meta` contract). Look/type/case tokens: `assets/look-tokens.md`.

---

## 1. What ticket 07 owns

The complete text layer of the explorer, across every state, plus the rules that render its numbers:

1. The **Stefaner frame** — kicker, framed-finding headline, dek (§3).
2. **National at-rest** summary copy (§4.1).
3. **Per-metro readout** — in/out/net + avg AGI, verbatim (§4.2, §5).
4. The **Rest-of-U.S. line** with the direct/suppressed split disambiguated (§5.3).
5. **Income dumbbell** labels + the AGI help note (§5.4).
6. **Empty / at-rest / mobile-placeholder / loading / error** copy (§4.3–§4.5, §8).
7. **Methodology / footer** — provenance + every caveat (§7).
8. The **accessibility copy** — aria-labels, aria-live announcements, menu (§6).
9. The **number/format content model** binding every `{token}` to a contract field (§9).

Not in 07: layout, geometry, hues, motion (04/05/02); routing/OG (08); the pipeline (06).

---

## 2. Voice & register — Stefaner editorial

One voice everywhere. **Quiet, exact, credible.** The numbers carry the argument; the prose gets out of their way. POV is expressed by **what we chose to show** (31 metros, net direction, what movers earn), never by adjectives or persuasion. The tool stays neutral; the *curation* is the opinion.

| Principle | Is | Is not |
|---|---|---|
| **Grounded, not hyped** | "America keeps moving south and west." | "The great American migration EXPLODED." |
| **Plain over technical** | "who moves in, who moves out, and what they earn" | "bidirectional AGI-weighted flow vectors" |
| **Precise about limits** | "flows too small to disclose are kept separate" | silently merging suppressed data into a number |
| **Curation = POV** | "the 30 largest metros — plus Louisville" | editorial verdicts printed on the tool |
| **Respect the reader** | says the mechanism once, in the dek, then stops | re-explaining IRS returns on every panel |

**Case & typography (copy-side; visual in 02):**
- **Sentence case** for headline, dek, verdicts, body, cues, hints. Only proper nouns capitalised.
- **Kicker & panel titles:** small-caps / uppercase-tracked as styled (the *style* is caps; write the source string in normal case, e.g. source string `The national picture · at rest`).
- **"U.S."** with periods in body copy; **"US"** acceptable only inside a data sentinel label. Be consistent — body always "U.S."
- Numbers are **facts**, prose is **serif editorial**; keep them tonally distinct (readout figures are mono/tabular, §5).

**Global word choices (lock these — don't drift):**
- People who moved = **"movers"** / "people". A count of them = "people", never "souls", "individuals" in body copy (reserve "individuals" for the methodology's technical definition of N2).
- Net > 0 = **"gaining"** / a **"net destination"**. Net < 0 = **"losing"** / a **"net departure"**. Never "winner/loser".
- The residual = **"Rest of U.S."** (everywhere outside the 31 metros).
- Income = **"what movers earn"** in plain framing; **"average AGI"** when labelling the figure; full definition once, in §7.

---

## 3. The frame — kicker · headline · dek (verbatim)

### Kicker (fixed, with the fixed-year tag)
```
Where America Moves · dustincoledata · 2022–2023 IRS
```
- Site name is the kicker (Title Case); `2022–2023 IRS` is the **fixed-year tag** (en-dash, not hyphen) bound to `build_meta.year_pair`. Single snapshot → the year lives here so no per-panel repetition is needed.

### Headline (h1) — the framed finding
**LOCKED recommendation (A):**
```
America keeps moving south and west.
```
Sentence case, declarative, one line. This is the **POV via curation**: a real, well-documented 2022–2023 pattern (Sun-Belt metros gaining, large coastal metros losing), stated flat in the Stefaner register — not hedged, not hyped.

**Verification gate (build session, after the first real bake — non-negotiable):** confirm the baked `metro_summary` supports it: net-positive metros skew South/West, and the largest net losses are big coastal/Northern metros (expect NY, LA, SF, Chicago). If the real data contradicts the finding, **do not print a false headline** — switch to fallback **B** and flag Dustin.

- **Fallback B (neutral, always-true):** `Where America moved in 2022–2023.`
- **Alt finding C (banked):** `The big coastal metros are still losing people.`

> **VETO FLAG — Dustin:** the headline is the single editorial call in 07. A is recommended (evocative + true). Say the word to swap to B (neutral) or C (different finding), or hand me your own line — anything ≤ ~48 chars, one clause, sentence case.

### Dek (serif, ≤ ~2 sentences, carries the mechanism + the hook + the click-cue)
```
Every year the IRS quietly records where households filed their taxes from — and where they filed the year before. The ring below is the 30 largest U.S. metros, plus Louisville, trading people all at once; click any metro, on the ring or the map, to see who it trades with, whether it's gaining or losing, and what those movers earn.
```
- Weaves the **"30 largest + Louisville"** hook in-line (neutral here; the *why-Louisville* aside lives in §7).
- States the data mechanism **once** (so no panel has to). `<em>` italics allowed on: *30 largest*, *Louisville*, *gaining or losing* (per prototype), at the build session's visual discretion — italics carry emphasis, not new meaning.

---

## 4. Copy deck — state by state

The panel is **one region that swaps content by state** (05). Below is every state's full text. Scope header + verdict + ring-centre + hero hint update in lockstep (bound in §6/§9).

### 4.1 National at rest — `selected = null` (desktop & tablet landing)

**Scope header (above the chord):** `All 31 metros`
**Verdict (beside scope):** *(empty at rest)*
**Ring-centre annotation (Caveat hand):** `31 metros, one year`
**Hero hint (under chord):**
```
Each ribbon is people exchanged between two metros; colour is net direction (cool = gaining, warm = leaving). Hover a metro on the map to link it here.
```

**Panel title:** `The national picture · at rest`

**Panel lead (serif):**
```
Of these {N} metros — the 30 largest, plus Louisville — {n_dest} are net destinations and {n_depart} are net departures. They trade about {inter_metro_total_approx} people with one another in a year — every ribbon in the ring.
```

**Extremes (two cells):**
- `Biggest gain` → `{top_gain_name}` · `{top_gain_net_signed} net`
- `Biggest loss` → `{top_loss_name}` · `{top_loss_net_signed} net`

**Click-cue (muted):**
```
Click any metro — on the ring or the map — to light up its exchanges and read its in / out / net and what its movers earn.
```

> Counting rule (§9): `n_dest = count(net > 0)`, `n_depart = count(net < 0)`. If any metro is exactly even (`net === 0`, effectively never with integer people), it is **neither** — append ` (and {n_even} in balance)` to the lead only when `n_even > 0`; otherwise omit that clause entirely so the two counts read clean.

### 4.2 A metro selected — desktop (highlight-in-place)

**Scope header:** `{metro_name} {state_abbr}` *(state abbr in muted small type)*
**Verdict (serif italic, coloured by net):** `net destination` *(net ≥ 0)* / `net departure` *(net < 0)*
**Ring-centre (reset target):** `↺ national view`
**Hero hint:**
```
Its ribbons are lit; the other 30 metros are dimmed to context. Click the centre or "National view" to reset.
```

**Panel — metro name + reset chip:**
- Name: `{metro_name} {state_abbr}`
- Reset chip: `↺ National view`
- Verdict (serif italic under name): `a net destination` *(net ≥ 0)* / `a net departure` *(net < 0)*

**Readout (three cells — labels verbatim):**

| Cell | Label | Figure | Sub-line |
|---|---|---|---|
| 1 | `Moved in` | `{total_in}` | `{agi_avg_in} avg AGI` |
| 2 | `Moved out` | `{total_out}` | `{agi_avg_out} avg AGI` |
| 3 | `Net` | `{net_signed}` | `{gaining_losing} people` |

- `{gaining_losing}` = `gaining` (net ≥ 0) / `losing` (net < 0). Cell 3 figure + sub coloured by net.

**Rest-of-U.S. line:** see §5.3 (has variants).

**Income dumbbell:** see §5.4.

### 4.3 A metro selected — mobile (`≤640px`, focus chord)

Panel content is **identical to §4.2** (readout + rest line + income). Only the hero + its hint change:

**Hero hint (mobile, selected):**
```
Its top partner metros ring the hub; arc colour is net direction with that partner. Rest of U.S. is the muted base spoke.
```

### 4.4 Mobile at rest — the placeholder (`≤640px`, `selected = null`)

The dense 30×30 is dropped on phones (05); the hero shows a two-line placeholder, and the panel shows the **§4.1 national summary**.

**Hero placeholder (two lines, serif, muted):**
```
Tap a metro on the map above
to see who it trades people with.
```

### 4.5 Loading (first paint, before `metro_pairs.json` resolves)

The national chord client-fetches `/data/metro_pairs.json` once (06 §4). Brief, but spec it so there's never a bare empty card.

**Chord card, loading:**
```
Drawing the ring…
```
- Muted, centered, serif. No spinner beyond the near-zero-motion baseline; text only. The map (its data inlined at build) and the national summary render immediately, so only the chord card shows this.

---

## 5. Component copy & the number model

### 5.1 Scope header + verdict (chord card)
Bound in §9. At rest: `All 31 metros`, no verdict. Selected: `{metro_name} {state_abbr}` + `net destination`/`net departure`.

### 5.2 Readout figures — formatting (content model)

| Value | Format | Example | Rule |
|---|---|---|---|
| `{total_in}` `{total_out}` | comma thousands, full integer, tabular | `184,207` | never abbreviated in the readout; screen has room |
| `{net_signed}` | sign + comma, **U+2212 minus** for negatives, `+` for positives | `+12,940` / `−31,588` | colour + sign + word — never colour alone (04) |
| `{agi_avg_in}` `{agi_avg_out}` | `$` + comma, **rounded to nearest $100** | `$71,400` | avg AGI is an aggregate ÷ count — nearest $100 avoids false precision; never show cents |

- **Minus sign is always U+2212 (`−`), not a hyphen**, everywhere a signed number appears (readout, extremes, tooltips, aria) — the one exception is the year tag `2022–2023` which uses an en-dash `–`.
- All figures use `font-variant-numeric: tabular-nums` (columns align).

### 5.3 Rest-of-U.S. line — the disambiguation (has variants)

The ring shows only metro↔metro flows; **most of a metro's churn is with everywhere else.** This line quantifies that honestly and keeps the IRS-suppressed sliver visible-but-separate (per 01/03: sub-20-return flows are blanked by the IRS and folded 100% into a suppressed residual, never re-attributed to a partner).

**Variant A — suppressed component present (`rest_sup_total > 0`, the normal case):**
```
Rest of U.S. — {rest_in} in · {rest_out} out with everywhere outside the 31 metros, including {rest_sup_total} in small flows the IRS suppressed and we keep separate.
```

**Variant B — no suppressed component (`rest_sup_total === 0`):**
```
Rest of U.S. — {rest_in} in · {rest_out} out with everywhere outside the 31 metros.
```

- `{rest_in} = rest_of_us_in_direct + rest_of_us_in_suppressed`; `{rest_out}` mirrors; `{rest_sup_total} = rest_of_us_in_suppressed + rest_of_us_out_suppressed`.
- "**and we keep separate**" is load-bearing honesty — it tells the reader the suppressed flows are *not* silently mixed into the partner numbers. Keep the phrase.
- "outside the **31** metros" (not "top 30") — the residual is relative to the full set including Louisville. This corrects the prototype's "top 30" wording.

### 5.4 Income dumbbell

**Header (title + note, one row):**
- Title: `What movers earn · avg AGI`
- Note (muted, right): `income rides the readout, not the mark`

**Dumbbell endpoints (caps):**
- Arriving end: `in {agi_avg_in}`
- Leaving end: `out {agi_avg_out}`

**Axis ends:** `{agi_axis_min}` (left) · `{agi_axis_max}` (right) — rounded to nearest **$1,000**.

**AGI null guard (`agi_avg_in` or `agi_avg_out` is null — every contributing cell suppressed; realistically never for a top-31 aggregate, but spec it):** replace the entire dumbbell block with one muted line:
```
Average income isn't available for this metro — too many of its flows were too small to disclose.
```
And in the readout sub-lines, show `—` in place of the missing `avg AGI`.

### 5.5 Legend-as-art (inherited from 05 — confirmed verbatim, no change)
Hand title `the key`; annotation `← cool comes, warm goes`; rows `Arriving — net gain of people`, `Leaving — net loss of people`, `Rest of U.S. — everywhere outside the 31 metros`; foot: `Colour carries direction; the sign (+/−) and labels repeat it, so it never rests on colour alone. Spectral within each pole shows magnitude.`
- **One fix vs prototype:** the Rest-of-U.S. legend row reads "everywhere outside the **31 metros**" (was "top 30").

### 5.6 Choropleth hints (map selector card)
- Card title: `The map · click a metro`
- Hint: `Dot size = total movers (in + out) · fill = net direction.`

### 5.7 The national "about" number — register
`{inter_metro_total_approx}` = Σ `people` over `metro_pairs` rows where `bucket = "metro"` (total directed metro↔metro moves). Rendered **approximate**:
- `≥ 1,000,000` → `about {x.x} million` (one decimal, e.g. `about 1.3 million`).
- `< 1,000,000` → `about {xxx},000` (nearest 10,000, e.g. `about 840,000`).
The word "about" is required — this is a rounded gestalt figure, not a precise count.

---

## 6. Accessibility copy (a11y strings are copy too — @vigil, 05)

All net-bearing strings carry **sign + word**, never colour alone.

**Hero SVG (`role="img"`) aria-label:**
- At rest: `Migration chord of the 31 largest U.S. metros — the 30 biggest, plus Louisville — sized by people exchanged and coloured by net direction.`
- *(Correction vs prototype: was "30 largest"; it is 31.)*

**Map SVG aria-label:** `U.S. metro net-migration map; use the menu above, or Tab to a metro, to select it.`

**Map dot aria-label (per dot):** `{metro_name} {state_abbr}: net {net_signed}, {gaining_losing} people. Select.`

**Select menu:** label (visually hidden) `Choose a metro`; first option `National view`; then one option per metro, text `{metro_name}, {state_abbr}`.

**aria-live (`polite`) — announced on every state change:**
- To national: `National view. {n_dest} of {N} metros are gaining people.`
  *(Correction vs prototype: use `{N}` = 31 and `{n_dest}`, not a hardcoded "30".)*
- To a metro: `{metro_name}, {state_abbr} selected. {total_in} moved in, {total_out} moved out, net {net_signed}, {gaining_losing} people. Average AGI {agi_avg_in} in versus {agi_avg_out} out.`
  - If AGI is null: end the sentence after `{gaining_losing} people.` and append ` Average income isn't available for this metro.`

**Reduced-motion / keyboard:** no extra copy; behaviour is 05. Focus-visible ring is visual (02).

---

## 7. Methodology & footer (verbatim — replaces the prototype's ILLUSTRATIVE-DATA flag)

Sits under the stage, `role="contentinfo"`. Dense but plain; every caveat the data demands (01), stated once, honestly. This is where the tool earns trust.

**Footer block:**
```
About this map

Source: IRS Statistics of Income, county-to-county migration, tax years 2022–2023 — the latest the IRS has published. Figures are baked once at build from the public IRS files; nothing updates live.

A "mover" is an individual (IRS field N2) on a tax return filed from a different county than the year before. People who don't file a return — many with very low or no income — aren't counted. Only domestic moves are shown; moves to or from abroad are left out.

"What movers earn" is the average adjusted gross income (AGI) of the returns behind each flow, for the destination year. AGI can include losses, so it may run lower than take-home pay.

Metros are Core-Based Statistical Areas under the Census delineation of July 2023. We show 31: the 30 largest by population, plus Louisville — a hometown addition.

The IRS suppresses any county-to-county flow under 20 returns to protect privacy. Those small flows are folded into "Rest of U.S." and kept as a separate, labelled component — never mixed into a metro's partner numbers.

Built by dustincoledata · data & method: irs.gov/statistics/soi-tax-stats-migration-data
```

- The **"hometown addition"** is the woven hook — honest curation, light touch, on-brand for a personal site. (If Dustin prefers it fully neutral, drop `— a hometown addition` to just `plus Louisville.` — flagged in §10.)
- Link target: `{irs_source}` from `build_meta` (fixed IRS migration landing page).
- The "nothing updates live / baked once" line pre-empts the "is this current?" question and states the LOW-upkeep design honestly.
- Provenance line may also surface `build_meta.generated_utc` as a quiet "last built" date at the build session's discretion (optional; not required copy).

---

## 8. Edge / empty / error inventory

| Trigger | Where | Copy | Note |
|---|---|---|---|
| `metro_pairs.json` still loading | chord card | `Drawing the ring…` | §4.5; map + summary already rendered |
| `metro_pairs.json` fetch fails | chord card | `The ring couldn't load. Refresh to try again — the map and summary still work.` | honest, offers recovery, points to what *does* work; map/summary don't depend on this fetch |
| `us-atlas` states TopoJSON fails | map card | *(no message)* — dashed-rectangle fallback + dots still render/select (prototype `.catch`) | selection still fully works via dots + menu; silent graceful degrade is correct here |
| Metro has 0 top-31 partners on a side | chord/readout | none — ribbon simply absent; readout still shows totals (dominated by Rest of U.S.) | possible in principle; no special copy needed |
| `agi_avg_in`/`agi_avg_out` null | income + readout sub | §5.4 guard line + `—` in sub | aggregate-level suppression; near-impossible for top-31 but specified |
| `rest_sup_total === 0` | rest line | §5.3 Variant B | drop the suppressed clause cleanly |
| `net === 0` (exact tie) | verdict/counts | verdict → `in balance` (serif italic, muted); excluded from both national counts; `(and {n_even} in balance)` clause per §4.1 | integer-count tie effectively never occurs; rule defined so a build never divides-by-zero-of-meaning |
| No metro selected + user hits ←/→ | selection | steps into ring order from index 0 (05) — no copy | behaviour, not copy |

**Principle:** no state ever shows a bare empty box, a raw `null`/`NaN`, an error code, or `undefined`. Every failure names what happened and what still works.

---

## 9. Data-binding table (every token → ticket-06 field)

The build session binds these; the app **never computes a displayed number from a CSV** — the pipeline pre-derives them (06 §2–§3).

| Token | Source (contract field) | Transform |
|---|---|---|
| `{N}` | `metro_summary.length` | = 31; also `build_meta.metro_count` |
| `{metro_name}` `{state_abbr}` | `metro_summary[i].name` | split display name / state per look |
| `{total_in}` `{total_out}` | `metro_summary[i].total_in / total_out` | comma int |
| `{net_signed}` | `metro_summary[i].net` | sign + comma, U+2212 for neg |
| `{gaining_losing}` | sign of `metro_summary[i].net` | `gaining` / `losing` |
| `{agi_avg_in}` `{agi_avg_out}` | `metro_summary[i].agi_avg_in_dollars / agi_avg_out_dollars` | `$` + comma, nearest $100; null → guard (§5.4) |
| `{agi_axis_min}` `{agi_axis_max}` | min/max of the two AGI values | pad + round to nearest $1,000 (05 dumbbell) |
| `{rest_in}` | `rest_of_us_in_direct + rest_of_us_in_suppressed` | comma int |
| `{rest_out}` | `rest_of_us_out_direct + rest_of_us_out_suppressed` | comma int |
| `{rest_sup_total}` | `rest_of_us_in_suppressed + rest_of_us_out_suppressed` | comma int; 0 → Variant B |
| `{n_dest}` | `count(metro_summary, net > 0)` | int |
| `{n_depart}` | `count(metro_summary, net < 0)` | int |
| `{n_even}` | `count(metro_summary, net === 0)` | int; clause shown only if > 0 |
| `{top_gain_name}` `{top_gain_net_signed}` | `argmax(net)` | name + signed net |
| `{top_loss_name}` `{top_loss_net_signed}` | `argmin(net)` | name + signed net |
| `{inter_metro_total_approx}` | Σ `metro_pairs[].people` where `bucket = "metro"` | approximate render (§5.7) |
| `2022–2023` (year tag) | `build_meta.year_pair` | en-dash |
| `{irs_source}` | `build_meta.irs_source` | footer link href |

**Corrections to fold in from the prototype (the prototype hard-coded a few "30"s that are now 31):** hero aria-label, the aria-live national announcement (`of 30 metros` → `of {N} metros`), the Rest-of-U.S. legend row and rest line ("top 30" → "31 metros"). All reconciled above; the build takes these strings from 07, not from the prototype.

---

## 10. Open flags (for veto — not blockers)

1. **Headline finding (§3):** A `America keeps moving south and west.` recommended + gated. B/C banked. Dustin's call.
2. **"hometown addition" in the footer (§7):** included as light honest curation. One-word veto drops it to neutral `plus Louisville.`
3. **Inflow/outflow filter on a selected metro:** 05 rejected a toggle (direction already on colour + sign + readout). 07 adds no copy for one. Re-flagging only because it's the last place a control could add words — recommend **no**, consistent with near-zero-motion/YAGNI.

Everything else in 07 is locked verbatim.

---

## 11. Self-review — coverage of the ticket's Resolve list

- **Framed headline + dek + kicker (fixed-year tag)** → §3. ✓ (+ verification gate so the finding can't go false against real data)
- **National at-rest summary** (net destinations/departures, biggest gain+loss, click-cue) → §4.1. ✓
- **Per-metro readout verbatim** (in/out/net + avg AGI + Rest-of-US direct/suppressed, disambiguated) → §4.2 + §5.2 + §5.3. ✓
- **Income dumbbell labels** → §5.4. ✓
- **Empty / at-rest / mobile-placeholder copy** → §4.3–§4.5. ✓ (+ loading/error/edge → §8)
- **Methodology/footer** (IRS 2022–2023, suppression note, N2 = individuals, AGI incl. deficits) → §7. ✓ (+ non-filers, domestic-only, CBSA/delineation caveats)
- **"30 largest + Louisville, hometown" hook woven** → dek §3 + lead §4.1 + footer §7. ✓
- **POV via curation, tool stays neutral** → §2 register + curation-not-verdicts throughout. ✓
- **Stefaner editorial register** → §2 + sentence-case/plain-precise voice across all strings. ✓
- **A11y copy** (aria-labels, aria-live, non-colour net) → §6. ✓
- **Data-bound to the 06 contract** (no runtime CSV math) → §9. ✓

**Feeds ticket 08 (assemble spec):** these strings drop into the ticket-05 frame + panel and the `/metro/<slug>` share pages (same readout + income + rest-line copy, one metro pre-selected); the footer + methodology are shared across index and share routes. No design fork remains.
