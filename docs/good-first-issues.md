# Good first issues

A ready list of well-scoped starter tasks. Each can become a GitHub issue with the `good first issue`
label (see [`.github/labels.yml`](../.github/labels.yml)). Pick one, say so in a comment, and open a PR.

## Cases (a JSON file and a dataset, no code)

1. **Ember Reach:** a case about unit mismatches (kg and lb in one column).
2. **Cryptara:** a case that normalises phone numbers to one format.
3. **Geminora:** a many-to-many join that fans out, where the fix is to aggregate first.
4. **Atlas Spire:** a pivot with missing combinations that must appear as zeros.
5. **Lumenfield:** top-3 per group where ties must all be kept (`RANK`, not `ROW_NUMBER`).
6. **Minos Deep:** reachability in a small graph with a recursive CTE.
7. **Chronopolis:** daylight-saving time: local times across a spring-forward night.
8. **Helix-9:** outliers by the IQR rule (needs `PERCENTILE` / `quantile`).
9. **Helix-9:** min-max and z-score normalisation of several columns.

## Product and polish

10. A small "explain this error" popover for pandas errors (the SQL ones already have plain-language explanations).
11. More plain-language explanations for common pandas errors (`explainError.ts` has the SQL ones).
12. A keyboard shortcut cheat sheet inside the Tips book.
13. Translate the interface text of one world (strings are already separated from logic in case JSON).
14. A Firefox and WebKit job in the Playwright matrix (see `playwright.config.ts`).
15. Add a high-contrast screenshot of each world to `docs/images/`.

## Docs

16. A short walkthrough of solving one case in pandas and SQL side by side, for the README or a blog post.
17. Proofread a world's briefings for clarity: every term defined before it is used.
