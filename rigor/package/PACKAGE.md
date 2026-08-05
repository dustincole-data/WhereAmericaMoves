# wam — package

*IRS SOI county-to-county migration, tax years 2022–2023*

`sha256:b7a3bba2195043c3…` · engine 0.1.0 · config `6ded7a8c1e29` · claim floor `99ca7abe04f1`

**3 claim(s) · 2 frame(s) · 7 near-miss entr(ies)**

## The contract

- **default** — a measured quantity absent from this package may not be drawn. The default is no.
- **apparatus** — coordinates, the selection set and other non-measured attributes are apparatus, not measurements, and fall outside this contract.
- **naming** — a cell may be drawn; only a claimed cell may be named. Naming is asserting a cell's relation to cells not shown: a superlative, a rank, a top-N cut, or a sort the reader reads as a ranking. A readout of a cell's own value names nothing, whoever elected it.
- **aggregation** — a mark may aggregate the cells it is made of; a spoken aggregate needs a claim or a figure.
- **scales** — apparatus never names, but no printed figure may equal an observed extreme of its own frame.
- **citation** — every rendered figure cites its source, a claim id or a frame id; only a claim id licenses naming.
- **precedence** — manifest.json is the contract. Where a rendered file disagrees with it, the manifest wins.

## Claims — may be stated, headlined, ranked, annotated

### C0003 — 14,900,349 people (tax filers and their dependents)

> 14,900,349 people moved between U.S. counties between tax years 2022 and 2023.

- **Register:** descriptive
- **Uncertainty** (coverage, not sampling): There is no confidence interval, because this is not a sample: it is the publisher's own total over the complete population of filed returns. The uncertainty is coverage — non-filers appear in no figure and the data does not reveal how many there are — plus 4,086,883 people of withheld mass that this total includes and that cannot be attributed to any specific pair of counties.  
  *Basis:* administrative near-census. The published-total route and the disclosed-flow-plus-residual route were computed independently and agree exactly: 0 disagreements over 5,608 comparable unit-directions.
- **Scope / kind:** population · descriptive
- **Arithmetic:** `out_total_people` · one row of the result is the national filing population
- **Figure:** [`figures/C0003.csv`](figures/C0003.csv) — 1 row(s), the median specification L0008 exported whole; claimed cell `all`
- **Curve:** 3 defensible specification(s), stability 100% (sign agreement with the median specification)
- **Confirmed against:** the full data
- *Limit:* counts tax filers and their dependents, not residents: non-filers never appear in the numerator
- *Limit:* movement below the publisher's disclosure floor is included via the published totals but cannot be attributed to a specific pair of counties
- *Limit:* single year-pair: no holdout period exists

### C0005 — 1,555,397 people (tax filers and their dependents)

> Between tax years 2022 and 2023, the 30 metros in this piece exchanged 1,555,397 people with one another.

- **Register:** descriptive
- **Uncertainty** (coverage and disclosure, not sampling): There is no confidence interval, because this is not a sample: it is a complete enumeration of every county-to-county flow the publisher disclosed between two different metros of this set. The uncertainty is one-sided and downward. A county pair below the publisher's 20-return floor is withheld by omitting its row, so its people are counted in each metro's unattributable residual and never in this total, and the true exchange among these 30 metros is larger than 1,555,397 by an amount this source cannot recover. 7 of the 870 directed metro pairs have no disclosed flow at all.  
  *Basis:* 8,203 disclosed county-pair rows resolving to 863 of 870 directed metro pairs. The shipped WhereAmericaMoves build's own TypeScript pipeline reports the same total over the same 863 pairs from the same bytes by different code, which checks that the decisions were applied and not that they are right; the invariant flow_mass_within_source asserts that the flow table carries exactly the disclosed mass of the input it came from.
- **Scope / kind:** population · descriptive
- **Arithmetic:** `people` · one row of the result is the top-metro set as a whole
- **Figure:** [`figures/C0005.csv`](figures/C0005.csv) — 1 row(s), the median specification L0019 exported whole; claimed cell `all`
- **Curve:** 1 defensible specification(s), stability 100% (sign agreement with the median specification)
- **Confirmed against:** the full data
- *Limit:* counts tax filers and their dependents, not residents: non-filers appear nowhere in it, and nothing in this source reveals how many are missing
- *Limit:* disclosed-only by construction, and therefore a lower bound: there is no published total for a county pair, so the withheld mass cannot be added back and this figure cannot be corrected upward from this source
- *Limit:* excludes each metro's own internal moves (D0013): a move between two counties of the same metro is not an exchange between metros, and including them answers a different question rather than the same one a different way
- *Limit:* one defensible specification, and that is a fact about the source rather than a shortcut: the three axes that gave the national total its curve are all unavailable at pair level. There is one flow file (D0004/D0010) and the second file is the same measurement in another layout, a foreign endpoint is a reserved row and never a metro, and no published total exists for a pair. So this number rests on the decisions behind the relation frame, not on agreement across specifications.
- *Limit:* single year-pair: no holdout period exists
- **Must be published with this number** (D0014): 7 of the 870 directed pairs among these 30 metros have no disclosed flow at all. Any published use of this number must state that count, and must say that an absent pair means withheld-or-absent and never zero.

### C0006 — 12 of the 30 metros

> Of the 30 metros in this piece, 12 are net destinations and 18 are net departures.

- **Register:** descriptive
- **Uncertainty** (specification, not sampling): There is no confidence interval: this is a count over a complete, declared universe of 30 metros, not a sample. The uncertainty is analytic. Across the three defensible ways to decide the sign the count is 12, 12 and 13 — reading the disclosed county-pair flows alone, with each metro's withheld residual dropped rather than carried, moves one metro (Sacramento) onto the gaining side. The count is much steadier than the membership: 27 of the 30 metros hold one direction across all three specifications and 3 change side.  
  *Basis:* Three specifications over the same 30 units: the publisher's Total-US totals in individuals (12), the same totals in returns rather than individuals (12), and the disclosed county-pair flows alone (13). No metro's net is exactly zero on any of the three, so in each specification the complement is the whole of the rest of the universe. Measuring in returns returns the same count of 12 by a different route and a different set: Riverside gains people and loses households, Seattle the reverse.
- **Scope / kind:** aggregate · descriptive
- **Arithmetic:** `net_positive` · one row of the result is the top-metro set as a whole
- **Figure:** [`figures/C0006.csv`](figures/C0006.csv) — 1 row(s), the median specification L0020 exported whole; claimed cell `all`
- **Curve:** 3 defensible specification(s), stability 100% (sign agreement with the median specification)
- **Confirmed against:** the full data
- **Universe:** `top_metro_pairs` — 30 unit(s), and the structural floor this count cleared is that size; see the universes section for how the set was drawn
- *Limit:* counts tax filers and their dependents, not residents
- *Limit:* the complement holds by subtraction, not by its own gate: 18 net departures is 30 − 12, and it is true only because no metro's net is exactly zero in this vintage. A tie in a later vintage would break the 18 while leaving the 12 intact.
- *Limit:* the specification that decides the sign is the one that carries each metro's withheld residual inside its published total. Dropping it and reading the disclosed flows alone gives 13.
- *Limit:* the stability gate is close to vacuous for a count, and says so: it tests sign agreement with the median specification, and every count is positive, so it passes at 100% whatever the counts are. The gate that did the work here is the median specification — 12, 12, 13.
- *Limit:* names no metro, and cannot: which 12 is not claimed. No metro-level superlative or rank survives this dataset's stability gate, and the membership is the least stable part of this result.
- *Limit:* single year-pair: no holdout period exists

## Frames — may be drawn, may not be named

- **`top_metro_relations`** — [`frames/top_metro_relations.csv`](frames/top_metro_relations.csv), 863 row(s); one row is one directed pair of metropolitan statistical areas
  - measures: `value`
  - excludes what D0013 disposed of: keep within-coarse-unit edges in the flow table, flagged, and exclude them from coarse-unit in/out totals
  - units: the `top_metro_pairs` universe below
- **`metro_totals`** — [`frames/metro_totals.csv`](frames/metro_totals.csv), 30 row(s); one row is one of the 30 metropolitan statistical areas this project declares
  - measures: `total_in`, `total_out`, `net`, `rest_of_us_in_direct`, `rest_of_us_out_direct`, `rest_of_us_in_suppressed`, `rest_of_us_out_suppressed`, `net_positive`
  - excludes what D0013 disposed of: keep within-coarse-unit edges in the flow table, flagged, and exclude them from coarse-unit in/out totals
  - units: the `top_metro_pairs` universe below

## Universes — which units this project kept, and why those

- **`top_metro_pairs`** — 30 unit(s) via the `county_to_top_metro` map
  - **selection rule:** the 30 metropolitan statistical areas with the largest resident population
  - measure: POPESTIMATE2023 — the July 1, 2023 resident population estimate, the vintage contemporaneous with the 2022-2023 migration data
  - source: U.S. Census Bureau, Population Estimates Program, Vintage 2025 release (CBSA-EST2025-ALLDATA), filtered to Metropolitan Statistical Areas (387 of them) and sorted descending — [https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/metro/totals/cbsa-est2025-alldata.csv](https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/metro/totals/cbsa-est2025-alldata.csv)
  - The 30 units here are the 30 metropolitan statistical areas with the largest resident population, ranked on the Census Bureau's July 2023 estimate. Population was chosen over migration volume deliberately: ranking metros by how many people they exchange would rank them on the same rows this project then aggregates, so the set would be drawn by the numbers it exists to measure. The cut is not a close call — the 30th metro (Cincinnati, 2,281,096) leads the 31st (Kansas City, 2,229,173) by 2.3%, and the same 30 are the top 30 under the 2023, 2024 and 2025 estimates alike; only their internal order shifts.

    Two things this rule is not. It is not a fact about the publisher: the IRS did not choose these metros, this project did, and a different 30 would be a different set of numbers. And it is not a licence to divide by population — resident population selects the units and appears in no figure, because these counts are filers and their dependents and a rate over residents would mix universes.

## Funnel

**6 frozen → 3 confirmed → 3 rejected** · confirmed share 50%

Search denominator **Σ cells = 12,695** across 13 logged specification(s). Confirmation recomputation adds 15,939 cells across 11 run(s) and is counted separately — re-checking the engine's own work is not a wider search.

See [`FUNNEL.md`](FUNNEL.md) · [`NOT-CLAIMABLE.md`](NOT-CLAIMABLE.md) · [`SOURCE.md`](SOURCE.md) · [`ACCEPTED.md`](ACCEPTED.md) · [`manifest.json`](manifest.json)

## Receipts

- accepted: [`ACCEPTED.md`](ACCEPTED.md)
- claims: [`../claims/`](../claims/)
- decisions: [`../audit/DECISIONS.md`](../audit/DECISIONS.md)
- funnel: [`FUNNEL.md`](FUNNEL.md)
- ledger: [`../audit/ledger.jsonl`](../audit/ledger.jsonl)
- not_claimable: [`NOT-CLAIMABLE.md`](NOT-CLAIMABLE.md)
- profile: [`../audit/PROFILE.md`](../audit/PROFILE.md)
- source: [`SOURCE.md`](SOURCE.md)
