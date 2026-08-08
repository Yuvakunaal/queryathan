# World 1 dataset licenses

## nul-sentinel.csv

- **License:** CC0 (public domain dedication)
- **Provenance:** Synthetic — generated entirely by
  [`scripts/generate-nul-sentinel.mjs`](../../../../scripts/generate-nul-sentinel.mjs)
  using a seeded deterministic PRNG. No real sensor telemetry, no real
  people, no scraped data.
- **Shape:** 240 rows × 6 columns (`reading_id`, `station`, `captured_at`,
  `temp_c`, `humidity`, `operator`).
- **Affliction:** 23 nulls in `temp_c` only, clustered per
  [`docs/design/world-1-visual-spec.md`](../../../../docs/design/world-1-visual-spec.md#0-the-case-being-built)
  so the HP heatmap strip has a non-uniform distribution to render.
- Regenerate with `node scripts/generate-nul-sentinel.mjs` — deterministic,
  produces an identical file every run.

## double-take.csv

- **License:** CC0 (public domain dedication)
- **Provenance:** Synthetic — generated entirely by
  [`scripts/generate-double-take.mjs`](../../../../scripts/generate-double-take.mjs)
  using a seeded deterministic PRNG. No real customer data.
- **Shape:** 180 rows × 5 columns (`order_id`, `customer_email`, `item_sku`,
  `quantity`, `submitted_at`).
- **Afflictions:** 14 duplicate rows (a simulated double-submit bug — same
  `customer_email` + `item_sku` + `submitted_at`, fresh `order_id`) and 11
  missing `customer_email` values.
- Regenerate with `node scripts/generate-double-take.mjs`.

## case-shift.csv

- **License:** CC0 (public domain dedication)
- **Provenance:** Synthetic — generated entirely by
  [`scripts/generate-case-shift.mjs`](../../../../scripts/generate-case-shift.mjs)
  using a seeded deterministic PRNG.
- **Shape:** 200 rows × 5 columns (`sku`, `product_name`, `category`,
  `quantity`, `updated_at`).
- **Afflictions:** 16 SKUs with leading/trailing whitespace, 18 rows with
  inconsistent `category` casing, and 13 rows where `quantity` was reported
  as free text instead of a number — pushing the whole column to pandas
  dtype `object` instead of `int64`.
- Regenerate with `node scripts/generate-case-shift.mjs`.

## the-reckoning.csv

- **License:** CC0 (public domain dedication)
- **Provenance:** Synthetic — generated entirely by
  [`scripts/generate-the-reckoning.mjs`](../../../../scripts/generate-the-reckoning.mjs)
  using a seeded deterministic PRNG. Styled after a real support-ticket
  export's mess, not sourced from any actual ticketing system or scraped
  dataset — see [ADR 0004](../../../../docs/adr/0004-pyodide-package-delivery.md)'s
  sibling reasoning: synthetic-but-realistic keeps licensing unambiguous and
  the dataset available offline, at the cost of not being literally
  Kaggle-sourced. Documented as a deliberate scoping decision for the World 1
  final boss.
- **Shape:** 500 rows × 6 columns (`ticket_id`, `customer_email`, `priority`,
  `status`, `opened_at`, `first_response_hours`).
- **Afflictions:** all six World 1 techniques at once — 22 duplicate tickets
  (a sync/idempotency bug), 17 missing and 14 whitespace-padded emails, 30
  inconsistent-casing `status` values, `opened_at` stored as plain CSV text
  (`object` dtype) rather than parsed dates — the "bad dates" content area,
  fixed with `pd.to_datetime()` exactly as the master plan's technique
  table describes — and `first_response_hours` carrying three independent
  problems on one column (24 non-numeric entries forcing `object` dtype, 16
  genuinely empty cells, 9 out-of-range outliers) — deliberately requiring
  a dtype fix before the nulls and outliers underneath it can be addressed.
- Regenerate with `node scripts/generate-the-reckoning.mjs`.
