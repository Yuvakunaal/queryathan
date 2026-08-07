# Content authoring guide

Adding a new boss/case to an existing world requires **a JSON file plus a
dataset** — no engine code, no knowledge of Pyodide or Web Workers required.

## 1. Pick or add a dataset

Datasets live in `apps/web/public/datasets/<world>/`. They must be one of:

- **CC0 / public domain** (e.g. government open data)
- **Synthetic** (generated, e.g. via Faker-style tooling — preferred, since it
  avoids embedding real people's data in a "messy dataset" boss)

Never use scraped data or data with unclear provenance. Every dataset must
have an entry in that world's `LICENSES.md` documenting its source and
license.

## 2. Write the case JSON

Case files live in `content/cases/<world>/<case-id>.json` and must conform to
the schema in `packages/content-schema/src/case.ts`:

```json
{
  "id": "tutorial-nulls",
  "world": "boss-fights",
  "datasetPath": "/datasets/world-1/tutorial-nulls.csv",
  "strings": {
    "title": "The Null Hydra",
    "briefing": "Every missing value regenerates the boss. Clear them all."
  },
  "winCondition": {
    "all": [{ "predicate": "no_nulls", "column": "email" }]
  }
}
```

- `id` — lowercase, hyphenated, unique within its world.
- `strings` — all player-facing text. Kept separate from logic so community
  translations are possible later without touching behavior.
- `winCondition.all` — a list of declarative predicates from the fixed
  vocabulary in `packages/content-schema`. **Not executable code** — see
  [`docs/adr/0003-win-condition-contract.md`](./adr/0003-win-condition-contract.md)
  for why. If the predicate you need doesn't exist yet, propose adding it to
  the schema in your PR description rather than working around it.

## 3. Validate

```bash
pnpm validate-content
```

This runs every file under `content/cases/` through the schema and is the
same check CI runs on your PR — fix anything it flags before opening one.

## 4. Open a PR

Use the "New case / boss proposal" issue template first if you want design
feedback before writing the JSON. Otherwise, open a PR directly — see the PR
checklist in `.github/pull_request_template.md`.
