# ADR 0004: Self-hosted Pyodide core, pinned-CDN package wheels

**Status:** Accepted

## Context

`scripts/fetch-pyodide.mjs` self-hosts `pyodide-core` (checksum-verified,
~14MB extracted) into `apps/web/public/pyodide/`. That archive's own
`pyodide-lock.json` lists `pandas` and its dependency chain (`numpy`,
`python-dateutil`, `pytz`, `six`) but does not bundle their wheel files —
only the interpreter and stdlib are in `-core`. The full distribution that
does bundle every package (`pyodide-314.0.4.tar.bz2`) is ~414MB, which
directly conflicts with Section 10's lazy-load/fast-first-paint requirement
and would bloat the repo's self-hosted asset footprint by nearly 30x for a
Phase 1 slice that only needs five specific wheels.

`packages_scientific/*.whl` files aren't individually addressable from a
GitHub release tarball, so downloading just the five needed wheels means
either extracting them from the full 414MB archive (still pays the full
download) or fetching them from Pyodide's own CDN mirror.

## Decision

- The Pyodide **interpreter/stdlib** (`pyodide.asm.wasm`, `pyodide.mjs`,
  etc.) stays fully self-hosted, per the existing pinned+checksummed fetch
  script.
- The **five package wheels pandas needs** (`numpy`, `python-dateutil`,
  `pytz`, `six`, `pandas` itself) are loaded via `pyodide.loadPackage()`
  using direct, absolute URLs to Pyodide's official jsdelivr mirror at the
  exact pinned version path: `https://cdn.jsdelivr.net/pyodide/v314.0.4/full/`.
  This path is immutable per Pyodide's own release conventions — `v314.0.4`
  never changes contents once published, the same guarantee the checksum
  pin gives the self-hosted core.
- `loadPackage()` skips dependency resolution when given direct URLs, so all
  five wheels are listed explicitly in `pyodide.worker.ts` — there is no
  implicit resolution step to silently drift.
- This requires one narrow CSP exception: `connect-src` in `vercel.json`
  allowlists `https://cdn.jsdelivr.net` in addition to `'self'`. This is a
  `fetch()`-only data dependency, not a `<script>` tag — `script-src`
  remains `'self'` with zero third-party script origins, so the supply-chain
  posture SECURITY.md describes for executable code is unchanged. The wheel
  URLs are version-pinned exactly like every other dependency in this repo.

## Consequence

- First entry into World 1 costs the self-hosted ~14MB core plus roughly
  10–15MB of package wheels fetched from jsdelivr — both cacheable, both
  behind Section 10's "lazy-load only when a relevant world is entered."
- If pandas' Pyodide-side dependency chain changes on a future version bump,
  `RUNTIME_WHEELS` in `pyodide.worker.ts` needs a matching update — the same
  reviewed-diff discipline `fetch-pyodide.mjs` already requires for
  `PYODIDE_VERSION`.
- Phase 7's security review should re-verify this CDN pin is still current
  and that jsdelivr continues to serve the exact pinned artifact
  immutably — this is exactly the kind of dependency Dependabot cannot track
  automatically since it's not an npm/GitHub Actions ecosystem reference.
