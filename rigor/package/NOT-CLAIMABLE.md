# wam — not claimable

**a measured quantity absent from this package may not be drawn. The default is no.** This list is not the prohibition — the prohibition is structural, and this is the residue: statements that look claimable, are not, and get invented when nobody writes them down. Each cites the mechanical evidence that killed it.

**1. No county-level superlative is publishable from this dataset — not "the biggest net gain", not "the fastest-growing county", not a ranked top ten of counties. Across five defensible ways to compute net migration the leading county's rank moves: 80% of specifications agree where 90% is required. The instability is the finding; the superlative is not available.**

- **C0001** *[claim · rejected]* — Between tax years 2022 and 2023, county-equivalent 12105 recorded a net gain of 18,208 people who moved between U.S. counties — the largest net gain of any county-equivalent in the country.
  - gate(s) not met: stability
- **C0002** *[claim · rejected]* — County-equivalent 12105 gained 19,407 people in 2022-23 — the biggest net migration gain in America.
  - gate(s) not met: median_specification, stability
- **C0004** *[claim · rejected]* — County-equivalent 48339 recorded a net gain of 18,661 people in 2022-23. Across the five logged specifications its rank among all county-equivalents moves, so no superlative is claimed.
  - gate(s) not met: stability

**2. Nothing here is corroborated by a second source. The inbound and outbound files are one measurement in two layouts, so their agreement certifies nothing — the check that compares them cannot fail, and "confirmed against the inbound file" is not a sentence this project can write.**

- **independence.agreement.outflow.inflow** *[check · VACUOUS]* — cross-input agreement between outflow and inflow
  - the two inputs are one measurement in two layouts, so an agreement check between them subtracts a number from itself: it reports zero discrepancies forever and cannot fail

**3. 10,813,466 is not a lower alternative estimate of total movers. It is the disclosed-only sum: an undercount of known size — the 4,086,883 people of withheld mass the publisher carries in its own totals — and not a different analytic choice about the same quantity.**

- **D0016** *[decision]* — exclude L0010 from the curve for total_domestic_movers_people
  - summing only the disclosed flows is a defensible way to answer 'how much movement is attributable to a specific pair of units', and an indefensible way to answer 'how many people moved' — it omits the withheld mass, which this source's own published totals quantify at about a quarter of the population. It is not a different analytic choice about the same estimand; it answers a different question.

**4. The metropolitan relation frame is not a complete matrix. 7 of its 870 directed pairs have no disclosed flow at all, so a missing ribbon means "withheld or absent", never "zero".**

- **D0014** *[decision]* — record the expected pairs with no disclosed flow as a quantified under-count and publish the number with any claim built on that relation set
  - the prior written down before the run was ~0 absent pairs; the observed handful is small and consistent with the disclosure floor rather than with a join defect. The count is interpretable only because the prior predates it — which is the difference between this metric and a check that cannot fail.

**5. The suppressed columns of the metro table are not a rest-of-US quantity. `rest_of_us_in_suppressed` and `rest_of_us_out_suppressed` are each metro's *unattributable* residual — every move the publisher did not attach to a specific county pair — and that includes moves inside the metro small enough to fall below the disclosure floor, which were therefore never subtracted along with the rest of the intra-metro mass. The split cannot be recovered from this source. It is bounded rather than unknown: each absent pair is under 20 returns, and the metro with the most absent internal pairs (Atlanta, 466 of 812 possible) has a ceiling of 8,854 returns against a suppressed column of 78,594 people.**

- **D0013** *[decision]* — keep within-coarse-unit edges in the flow table, flagged, and exclude them from coarse-unit in/out totals
  - they are roughly half the naive coarse total, and their share correlates about 0.7 with how many fine units each coarse unit contains — so a naive coarse ranking is differentially biased in a way that mimics a real geographic pattern. Flagging rather than deleting keeps the alternative computable, which is what makes the choice reviewable at all.
- **D0008** *[decision]* — carry the residual as its own labelled column per unit, and take every ratio's numerator and denominator from the published totals
  - the residual is about a quarter of the national total but ranges from 3% to 99% by unit. Dropping it understates units unevenly, and mixing a disclosed-sum numerator with a published-total denominator biases each rate by that unit's own suppression share — a bias that correlates with unit size, which is to say it is shaped exactly like a real geographic finding.

**6. Which 12 metros are the net destinations is not claimable. The count is, and the set is not: across the three defensible ways to decide a metro's direction the count is 12, 12 and 13, but three of the thirty change side — Sacramento reverses when each metro's withheld residual is dropped and only the disclosed county-pair flows are read, and Riverside and Seattle reverse when the same published totals are measured in returns rather than in individuals. So no list of the twelve, no map that colours a metro by direction as a claimed fact, and no sentence naming one of them as a gainer or a loser. This is the *metro*-level entry and it bites on membership; the county-level entry in this list bites on ranking, and neither implies the other level is free.**

- **D0019** *[decision]* — the membership of the net-destination count is not claimable: the number 12 may be published, the identity of the 12 may not
  - the count's own specification curve is far steadier than the set behind it. Across the three defensible sign rules the count is 12, 12 and 13, but 3 of the 30 metros change side: Sacramento reverses when each metro's withheld residual is dropped and only the disclosed county-pair flows are read, and Riverside and Seattle reverse when the same published totals are measured in returns rather than in individuals. So a caption that answers 'which 12' asserts a membership that a defensible alternative computation contradicts, while the count it came from survives all three.

**7. No migration *rate* is claimable from this package. Dividing these counts by resident population mixes universes — filers and their dependents over residents — which biases every rate low by each place's own non-filing share, and that share correlates with the demographics a migration story is usually about.**

- **D0008** *[decision]* — carry the residual as its own labelled column per unit, and take every ratio's numerator and denominator from the published totals
  - the residual is about a quarter of the national total but ranges from 3% to 99% by unit. Dropping it understates units unevenly, and mixing a disclosed-sum numerator with a published-total denominator biases each rate by that unit's own suppression share — a bias that correlates with unit size, which is to say it is shaped exactly like a real geographic finding.

## What the engine proved limiting

- rejected claims: `C0001`, `C0002`, `C0004`
- checks that certified nothing: `independence.agreement.outflow.inflow`
- accepted failures: none

Every one of the above is covered by a statement here; that is a precondition of the package building at all. Decisions may also be cited, and the full log is in [`../audit/DECISIONS.md`](../audit/DECISIONS.md).
