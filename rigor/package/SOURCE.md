# wam — source

Caption-grade provenance. Everything here is rendered from the project config; the attribution line is the one piece of prose in this package a human wrote.

- **Publisher:** Internal Revenue Service, Statistics of Income Division
- **Dataset:** SOI county-to-county migration data — countyoutflow2223.csv and countyinflow2223.csv, with the Migration Data Users Guide (2223inpublicmigdoc.pdf) as the codebook
- **Vintage:** Tax years 2022-2023: one year-pair, published once and not revised. Geography pinned to the Census CBSA delineation of July 2023 (OMB Bulletin 23-01).
- **Retrieved:** 2026-07-28
- **URL:** https://www.irs.gov/pub/irs-soi/
- **Licence:** No licence statement appears on the SOI migration pages or in the Users Guide. Public domain by the 17 U.S.C. §105 federal default — an inference from general federal copyright law, not a statement by the publisher about this product. IRS's general site policy: content created by federal employees is not subject to copyright and may be freely copied, credit requested. Treasury/IRS names, logos and seals may not be used in any way implying endorsement (18 U.S.C. §701). The release embeds a second federal agency's component — county assignment runs on a Census ZIP+4-to-county codebook — under the same regime.

## Universe — what the numbers count

Every count here is **tax filers and their dependents** — the individuals reported on individual income tax returns — and **not residents**. Non-filers appear nowhere: the very poor, many elderly people, undocumented residents and some students are absent from every figure, and nothing in the data reveals how many are missing. So a count is never a population, and a share of it is never a share of the population.

`n1` counts returns (approximately households); `n2` counts individuals. The money column is aggregate adjusted gross income in thousands of dollars — a whole-group total, not a per-person average.

A unit is the county of the address on the return, so a "move" is a change of filing address between the two years, not a dated relocation event. The temporal reference point is not recoverable from the values and is not asserted here.

Movement below the publisher's disclosure floor is carried in the published totals but cannot be attributed to any specific pair of counties.


## Disclosure floor — what the publisher withheld

**20 returns.** The publisher withholds any county-to-county flow below 20 returns. The withheld mass stays inside the published totals but cannot be attributed to any specific pair, so an absent pair means withheld-or-absent and never zero. Visible in the raw bytes as a distribution cliff: no row at 19 returns, 2,457 rows at exactly 20.

This is the *publisher's* threshold. It is not `claim_floor`, which is this project's own minimum publishable magnitude — two different quantities, named apart so a caption cannot reach for the wrong one.

## Attribution line

> Source: IRS Statistics of Income county-to-county migration data, tax years 2022-2023. Counts are tax filers and their dependents, not residents.

## Files, as published

| file | format | encoding | bytes | sha256 |
|---|---|---|---:|---|
| [outflow](https://www.irs.gov/pub/irs-soi/countyoutflow2223.csv) | csv | cp1252 | 4,584,439 | `364dba518f0db092…` |
| [inflow](https://www.irs.gov/pub/irs-soi/countyinflow2223.csv) | csv | cp1252 | 4,571,970 | `813ba2ef550c6a59…` |
| [delineation](https://www2.census.gov/programs-surveys/metro-micro/geographies/reference-files/2023/delineation-files/list1_2023.xlsx) | xlsx | — | 143,798 | `952c4b1e78acbb54…` |
| [codebook](https://www.irs.gov/pub/irs-soi/2223inpublicmigdoc.pdf) | pdf | — | 431,090 | `ad72b67cf7c34b4d…` |
