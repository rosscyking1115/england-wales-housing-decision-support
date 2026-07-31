# Pre-registration: search-demand test for the deployed site

> ## Status update, 2026-07-31: abandoned, unmeasured
>
> The Search Console property was verified on 2026-07-27 and the sitemap submitted on 2026-07-28,
> but the sitemap never returned a successful fetch — Search Console reported `Couldn't fetch` with
> `Last read` blank and 0 discovered pages for three days. **No impression data and no indexation
> count was ever read.** Step 0 never ran.
>
> The test is not being resumed. The decision it fed — whether to pursue a consumer-paid route —
> is not live: this repository is a reference analytics-engineering project with a closed feature
> roadmap, and the site's audience arrives by a link from the README rather than from search. A
> measurement that changes no decision is not worth taking.
>
> **This is not a finding about demand.** Nothing below was measured. No result — not "demand
> exists", not "no demand", not even the pre-registered VOID verdict — may be inferred from this
> file or from the absence of data in it. The thresholds below are left exactly as written on
> 2026-07-27 so that the record shows what *would* have counted, had it been run.
>
> Everything from here down is the original 2026-07-27 pre-registration, unchanged.

---

- **Status:** Pre-registered. Written 2026-07-27, **before any impression data existed to look at**
  — the Search Console property is not yet connected, so no one has seen a number.
- **Method:** Search demand analysis on an owned, already-deployed asset. Cost: nil. Build: none.
- **Decision this feeds:** whether "nobody is looking for this" survives as a reason to stop.

## Why this test, and why now

A 2026-07-27 review returned NOT YET on evidence and DO NOT ENTER on a consumer-paid route. The
remaining cheap test is whether anyone searches for what was actually built. The site is deployed,
crawlable and already carries 7,134 URLs, so this measures revealed search behaviour against the
real artefact rather than a stated preference about a hypothetical one.

Thresholds are fixed below **before** the property is connected. That ordering is the whole point:
a threshold chosen after seeing the number is not a threshold.

## The asset, measured 2026-07-27

| Property | Measured |
|---|---|
| `sitemap.xml` | HTTP 200, 1,137,122 bytes, `application/xml`, a flat URL set (no sitemap index) |
| URLs in the sitemap | **7,134** (`<loc>` and `<url>` counts agree) |
| `/area/…` | 6,482 |
| `/town/…` | 318 |
| `/rent/…` | 318 |
| `/rankings/…` | 11 |
| Core pages | 5 (homepage, `/search`, `/compare`, `/check`, `/methodology`) |
| `robots.txt` | `User-Agent: *`, `Allow: /`, `Disallow: /api/`, plus `Host:` and `Sitemap:` lines |

Crawling is permitted for every indexable page; only `/api/` is disallowed. Nothing in the
robots policy prevents indexation, so a low indexed count would not be explained by robots.

## Step 0 — indexation, checked before demand

Impressions can only be read as evidence about demand if the pages were eligible to be shown. So
indexation is measured first, and it has its own pre-registered floor.

**Floor: at least 500 of the 7,134 URLs indexed (≈7%).**

- **Below 500 indexed:** the demand test is **void, not failed**. A near-zero impression count in
  that state says nothing about demand — it says Google chose not to index a large programmatic set
  on a low-authority domain, which is ordinary and expected behaviour. Report it as an indexation
  finding and stop; do not convert it into a demand verdict in either direction.
- **At or above 500 indexed:** proceed to the demand thresholds below.

This is the one outcome most likely to occur, and it must not be quietly treated as a setup problem
to fix before measuring. If the pages are not indexed, **that is the finding**.

## Pre-registered demand thresholds

Window: one full **28-day** period. Search type: **Web**. Property: the deployed site. No filters
beyond that, and no exclusion of any query after the fact.

| Outcome | Rule (all conditions must hold) |
|---|---|
| **Evidence of real demand** | ≥ **2,000** impressions in 28 days **and** classes A+B ≥ **40%** of impressions **and** ≥ **25 distinct** class-A queries |
| **Evidence of no demand** | < **300** impressions in 28 days **or** classes C+D+E ≥ **80%** of impressions |
| **Inconclusive** | anything between; no further spend, re-read at 90 days |

The impression bar is set deliberately low, and that is the point. 2,000 impressions over 28 days
across 7,134 pages is roughly 0.3 impressions per page per month — a floor almost any genuinely
wanted set of pages would clear. A low bar makes a **failure** informative: if the site cannot clear
a bar this low, "nobody is looking" is well supported and the DO NOT ENTER verdict hardens. The 300
floor exists because below roughly ten impressions a day the query sample is too thin for the
intent mix to mean anything.

## Query intent taxonomy, fixed before looking

Every query in the window is assigned to exactly one class. The classes are defined now so that
classification cannot be tuned to the result later.

- **A — Decision intent.** Carries an evaluative or comparative term applied to a place: best / good
  / worst / safest / cheapest / compare / vs / "where to live" / "is X a good area" / "moving to X".
  *This is the product's actual thesis.*
- **B — Indicator lookup.** Names one indicator plus a place: "crime rate in X", "rent in X",
  "EPC X", "flood risk X". Adjacent demand — real, narrower than the composite.
- **C — Geography or reference lookup.** MSOA/LSOA codes, postcode-to-area, boundaries, maps.
  Demand for a lookup table, not for a decision aid.
- **D — Data-source or technical.** "land registry price paid", ONSPD, dbt, DuckDB, the repo name.
  Demand for the inputs or the engineering, not the product.
- **E — Brand or navigational.** The site name, the deployed URL, Ross's name.

A and B count toward demand. C, D and E do not. A dominant C+D+E mix means the pages are being
found as reference material, which is a different product from the one that was built.

## What a PASS does and does not license

A pass removes "nobody is looking" as the kill reason. **It does not license the consumer-paid
route.** Impressions are revealed attention to a *query*, not willingness to pay for *this format*,
and the crowded-market finding is untouched by this test — PostcodeCheck already gives a comparable
report away free. The most a pass can do is move the verdict from KILL to NOT YET, with willingness
to pay still unevidenced and still requiring a separate test that ends in a real transaction.

A fail, or a void-by-indexation result, is the stronger signal of the two.

## Hand-off — steps for Ross (needs his Google account)

1. **Google Search Console → Add property → URL prefix**, entered exactly as
   `https://uk-housing-decision-support.vercel.app/`.
2. **Verify.** For a Vercel deployment the HTML-file or HTML-tag method is simplest; the meta tag
   goes in the Next.js root layout. (A DNS/domain property is not available for a `vercel.app`
   subdomain.)
3. **Expect the Performance report to start empty.** Search Console generally does not backfill
   impressions from before verification. If no history appears, that is the tool behaving normally
   — not a finding. The test then becomes a forward 28-day collection from the verification date.
4. **Same day, record indexation** — two independent reads:
   - a `site:uk-housing-decision-support.vercel.app` query, for a rough indexed count;
   - Search Console → **Pages**, for indexed vs not-indexed with reasons.
   Write both numbers down before looking at anything else. This is the Step 0 gate.
5. **Submit the sitemap** (`sitemap.xml`) under Indexing → Sitemaps.
6. **After a full 28 days**, export Performance → Queries and apply the taxonomy above verbatim.

Nothing in this file should be revised after step 4 begins. If a threshold turns out to be badly
chosen, record that as a lesson for the next test rather than editing this one.
