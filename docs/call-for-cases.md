# Call for cases

Cases are the heart of this project and the easiest way to contribute: a JSON
file and a small dataset, no engine code. The
[authoring guide](./content-authoring-guide.md) walks through it.

## What makes a good case

- It teaches one technique a working analyst really needs.
- The mess is realistic: inconsistent codes, stray whitespace, mixed formats.
- It is winnable in both Python and SQL, and the starter code does not win.
- The briefing says what is wrong in plain words before it uses any jargon.
- The data is CC0, public domain or synthetic. Nothing scraped.

## Wanted

- **Ember Reach** (cleaning): more date formats, unit mismatches (kg vs lb), currency strings.
- **Cryptara** (patterns): phone numbers, postcodes, free-text addresses, log lines.
- **Geminora** (joins): many-to-many joins, fan-out duplicates, fuzzy keys.
- **Atlas Spire** (reshaping): wide-to-long, nested JSON columns, pivots with gaps.
- **Cinderforge** (speed): memory and dtype diets, chunked reading, validation fences.
- **Lumenfield** (analysis): year-over-year with missing months, running balances, top-N per group with ties.
- **Minos Deep** (CTEs and recursion): graph reachability, ranges and overlaps, multi-step CTE pipelines.
- **Chronopolis** (time): fiscal calendars, daylight saving, rolling windows, sessionisation.
- **Helix-9** (statistics): quantile and IQR outliers, normalisation, confidence intervals, correlation matrices.
- Cases in a second human language (briefing text), with the same data.

## Before you open a PR

1. Run `pnpm validate-content`.
2. Add your known-good answers to `apps/web/e2e/solutions.ts` (or the world's
   `solutions-*.ts`), then run `pnpm e2e`. The suite fails if the starter already wins or your answer
   does not.
3. Fill in the **New case** issue form first if you want feedback on the idea.
