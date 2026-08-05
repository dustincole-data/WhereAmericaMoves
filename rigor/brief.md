---
# ── What code reads. Everything below the fence is for people. ──
package_hash: "sha256:b7a3bba2195043c3bf326a1e437fa2f7ee17cbec06c54c0b799a1692f504ee20"
manifest_sha256: "697c138c0477493f134b5e7252a09a75941852da14a237eba27cc04cc75fb7ff"

universe_noun: people
universe_qualifier: "tax filers and their dependents, not residents"
forbidden_nouns: [Americans, American, residents, resident, population, households, household, taxpayers, taxpayer, returns, return, moves, move, movers, mover, families, citizens, workers]

claims: [C0003, C0005, C0006]
frames: [top_metro_relations, metro_totals]

# Rigor 13 landed before the build started. Both promotions are confirmed, so the
# base state described in the build spec §10 was never rendered.
promotions:
  inter_metro_total: confirmed   # C0005 — 1,555,397
  sign_counts: confirmed         # C0006 — 12 of 30

# The manifest fields an `apparatus` string may quote a figure from. See §4 below:
# these are declared parameters of the record, measured by nobody, and the only
# narrowing this build made to check ⑤.
declared_parameter_paths:
  - source.disclosure_floor
  - source.vintage
  - universes[].selection
---

# WAM v2 — the brief

The state file for this build. It sits **beside** the vendored package, never inside it, so
`diff -r rigor/package/ <atelier>/projects/wam/package/` stays a one-liner and byte-identity
is the staleness test.

Hand-written once, for this build. [Beauty 08] authors `beauty-brief` **from** this run, so
there was nothing to generate it with.

---

## 1. The package is read-only

`rigor/package/` is a **verbatim** copy of the Rigor pilot package. **Zero edits, ever, to any
member.** Not a reformat, not a link fix, not a whitespace change.

The reason is mechanical rather than procedural: `receipts` is inside the hashed body, so
rewriting a receipt path leaves a `package_hash` that no longer hashes its own contents — and
check ⑦ cannot notice, because it compares two stored strings rather than recomputing. Editing
the package is the one route to silently falsifying the stamp that the only cheap check is
blind to.

**Four receipt links in `manifest.json` dangle on purpose** — `receipts.claims`,
`receipts.decisions`, `receipts.ledger`, `receipts.profile` point at `../claims/` and
`../audit/`, which are Rigor's working directories and deliberately did not travel. The dead
links are the architecture being visible: the package is the contract, the receipts are the
engine's, and this repo has no engine. `PACKAGE.md` travels for a human reader and is **never
parsed** — two readers of one contract is how stale markdown gets trusted.

## 2. What is licensed

**Three claims.** Only a claim id licenses naming.

| id | value | text | family |
|---|---|---|---|
| `C0003` | 14,900,349 | 14,900,349 people moved between U.S. counties between tax years 2022 and 2023. | people |
| `C0005` | 1,555,397 | Between tax years 2022 and 2023, the 30 metros in this piece exchanged 1,555,397 people with one another. | people |
| `C0006` | 12 | Of the 30 metros in this piece, 12 are net destinations and 18 are net departures. | count |

**Two frames.** A cell may be drawn; a readout of a cell's own value names nothing. No cell may
be ranked, called out or headlined.

| id | rows | unit of analysis |
|---|---|---|
| `top_metro_relations` | 863 | one directed pair of metropolitan statistical areas |
| `metro_totals` | 30 | one of the 30 metropolitan statistical areas this project declares |

**One universe**, `top_metro_pairs`, size 30, selected on Census `POPESTIMATE2023` and cited in
`manifest.universes[0].selection` with its source URL. The rule is stated on the page **once**,
in the limits block, in the package's words. It is not a licence to divide by population.

**Seven near-misses** (`not_claimable`), each of which is beat content rather than a caveat:

1. no county-level superlative — three frozen claims, three deaths on rank stability;
2. nothing is corroborated — the two input files are one measurement in two layouts;
3. 10,813,466 is the disclosed-only sum, not a lower estimate — the gap is 4,086,883;
4. the relation frame is not a complete matrix — 7 of 870 directed pairs have no disclosed flow;
5. the suppressed columns are each metro's **unattributable residual**, not a rest-of-US quantity;
6. **which 12** metros are net destinations is not claimable — the count is, the membership is not;
7. no migration **rate** is claimable — dividing filers by residents mixes universes.

## 3. What may be said, and what may only be drawn

The contract, verbatim from `manifest.contract`, is the authority. In this build it resolves to:

- **Drawn, not said.** Every cell of both frames. The crowd aggregates the cells it is made of,
  so its two areas may be *compared by eye* and the piece prints no ratio for them.
- **Said, with a claim id.** The three claims and each claim's own `uncertainty` /
  `disclosure` figures — those fields are part of the claim, which is what licenses
  4,086,883, 10,813,466 and *7 of 870* on the page.
- **Said, as a readout.** Any single cell of either frame, printed as its own value, citing the
  frame id. A metro's in / out / net / residual / suppressed columns are readouts.
- **Never.** A rank, a top-N cut, a superlative, a sort a reader can read as a ranking, any
  migration rate, any list of the twelve, any sentence calling a named metro a gainer or a
  loser (near-miss 6 — the **number** 12 is claimable and the **membership** is not, so a metro
  readout prints a signed net and never a category word).
- **Never, second form.** No printed figure may equal an observed extreme of its own frame.
  This is the numeric shape of a superlative and it is why the residual's 3%-to-99% spread —
  the min and max of `metro_totals`' own cells — is described on the page and never printed.

## 4. Two amendments this build had to make, and neither is a local exception

**(a) The apparatus rule over-reached by exactly two fields.** [Beauty 07] made *an apparatus
string containing a figure is itself a failure* so that `apparatus` could not launder a
measurement. But the manifest also carries **declared parameters** — the publisher's 20-return
disclosure floor (`source.disclosure_floor`, delivered by Rigor 11 in answer to 05's own N06
demand) and the universe's selection rule (`universes[].selection`). Nobody measured either;
they are rules of the record, which is exactly what `contract.apparatus` puts outside the
contract. So the check is **narrowed, not exempted**: an apparatus string may carry a figure
**iff that figure appears verbatim inside one of `declared_parameter_paths` above**. That is a
field comparison, and it cannot launder a measurement, because a measurement is not in those
fields.

**(b) `largest` comes back once, and only once.** [Beauty 05] cut it as "a superlative over
Census population, a dataset with no package". Rigor 14 falsified the premise: the measure, the
vintage, the source, the URL and the closeness of the cut are all in `universes[0].selection`
now. So the selection rule is stated **once**, in the limits block, in the package's own words
and with the Census attribution. It does **not** come back as a running epithet in eight
places, and the reason is the package's own wording: `C0005` and `C0006` both call the set
*"the 30 metros in this piece"*. The piece follows the claims it cites.

## 5. Every user-visible string is a `CopyRecord`

`{ text, cite }`, `cite: ClaimId | FrameId | 'apparatus'`, and there is no way to author a
string without deciding its citation — an uncited figure is a **type error**, not a lint
failure. One field does both jobs, so *cited and exempt* is unrepresentable.

`npm run lint:copy` then checks, in two directions:

| | check |
|---|---|
| ① | noun — a string citing a `people`-family id says *people* and no forbidden noun |
| ② | ratio hedge — a fraction phrase must point toward the truth (27.43%, so *one in four* fails and *more than one in four* passes) |
| ③ | superlative lexicon |
| ④ | scales — no printed figure equals an observed extreme of its own frame |
| ⑤ | apparatus — an apparatus string carries no figure, narrowed by §4(a) |
| ⑥ | dist → ledger — every figure in `dist/**/*.html`, `dist/**/*.svg` and `.scan/og/*.svg` traces to a ledger entry |
| ⑦ | `brief.package_hash` == `manifest.package_hash` |
| ⑧ | every vendored figure/frame file digest == the `sha256` the manifest records |
| ⑨ | `manifest.json`'s own bytes == `brief.manifest_sha256` |

⑦⑧⑨ run at module init on the **read path**, so they gate every build including local ones — a
hash mismatch means everything downstream is invalid and there is nothing to iterate. ①–⑥ always
run and always print, and throw only under `CI` / `VERCEL`, so the craft loop stays a review.

Still **not** code, and stated rather than papered over: a top-N cut is `.sort().slice()` where
every label is individually legal and the illegality lives in the set. That stays judgment.

## 6. The demand list

**Empty.** Every demand 05 raised has landed:

| demand | outcome |
|---|---|
| Amend the contract (7 clauses, stable frame ids, count floor, the literal disclosure floor) | **delivered** — Rigor 11 |
| `metro_totals` | **delivered** — Rigor 12 |
| `metro_agi` | **withdrawn by Beauty 10** — v2 carries no income at all |
| Freeze the inter-metro total | **confirmed** — `C0005` |
| Freeze the sign counts | **confirmed** — `C0006` |
| A cited home for the selection rule | **delivered** — Rigor 14, `universes[0].selection` |

Anything this build wants that the package does not license is written **here** and nowhere
else. It is never derived locally, and it never goes into Atelier from this repo — that is what
keeps the door shut.

**Open, and recorded rather than fixed:**

- **The 9,258,069 residual has no claim.** [Beauty 09] recorded that route 1 — drawing the
  absence as emptiness — cannot be honest at one scale until it exists. Nothing in v2 needs it;
  if a future piece draws that shape, it is a Rigor demand, not a drawing problem.
- **Antecedent resolution.** The headline defers its noun to the standfirst (*"…one in four of
  **them**…"*), so check ① passes it by having nothing to test. Resolving *them* is a theory of
  the sentence and belongs to `beauty-copy`, not to code.
