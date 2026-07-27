# Maintenance policy

England & Wales Housing Decision Support is a completed portfolio reference
implementation. It has no active product or feature roadmap.

Changes are accepted when they address one of these maintenance needs:

- an upstream official/open-data source changes or becomes unavailable;
- a security issue or supported dependency requires an update;
- a correctness defect is found in ingestion, modelling, scoring, API behaviour,
  or the website's representation of the evidence;
- tests, documentation, source provenance, or deployed evidence need to be kept
  aligned with what is actually built.

New product surfaces, speculative indicators, and expansion beyond England and
Wales are outside the current scope. Any future expansion must first define its
source coverage, uncertainty rules, versioned contract, and regression evidence.

## Upstream risk: ONS small-area outputs

Recorded 2026-07-27. The largest standing threat to this pipeline is not code rot but the supply of
small-area official statistics.

The visible example is House Price Statistics for Small Areas (HPSSA), which published at LSOA,
MSOA and ward level. Its year-ending-December-2022 bulletin was released 21 June 2023 and scheduled
its successor for 20 September 2023; the series has not resumed a predictable cadence since.
**HPSSA is not an input to this project** — nothing here consumes it — so this is not a live
breakage. It is recorded because it is the clearest published instance of a pattern that would break
this pipeline if it reached the sources that *are* consumed:

- **ONS Price Index of Private Rents** — the affordability indicator's rent figures.
- **ONS mid-year population estimates at MSOA grain** — the denominator for the crime rate. Without
  a compatible small-area denominator the crime indicator cannot be published at all; it is not
  substitutable with a local-authority figure.
- **ONS Postcode Directory** — the postcode-to-MSOA spine the whole warehouse is built on.

If any of those three loses its small-area grain or its release cadence, the correct response under
this policy is to mark the affected indicator unavailable and lower evidence quality — never to
substitute a coarser geography and present it at MSOA grain, and never to carry a stale figure
forward without changing its stated reference date.

The non-negotiable publication rules remain: indicators are not verdicts; scores
are never encoded as red/amber/green judgements; each score stays beside its
source fact; uncertainty and unsupported jurisdictions are explicit; outputs are
area-level rather than property valuations; and public area names are human-readable.
