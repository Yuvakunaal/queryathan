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

- **Boss Fights:** more date formats and time zones, unit mismatches (kg vs lb),
  currency strings.
- **The Vault:** phone numbers, postcodes, free-text addresses, log lines.
- **The Twins:** many-to-many joins, fan-out duplicates, anti-joins.
- **The Architect:** wide-to-long, nested JSON columns, pivots with gaps.
- **The Foundry:** memory and dtype diets, chunked reading, validation fences.
- Cases in a second human language (briefing text), with the same data.

## Before you open a PR

1. Run `pnpm validate-content`.
2. Add your known-good answers to `apps/web/e2e/solutions.ts`, then run
   `pnpm e2e`. The suite fails if the starter already wins or your answer
   does not.
3. Fill in the **New case** issue form first if you want feedback on the idea.
