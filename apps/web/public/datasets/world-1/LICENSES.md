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
