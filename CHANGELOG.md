# Changelog

All notable changes to this project are documented here. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added (Phase 4: World 2, The Vault)

- Three cases: PIN_TUMBLER (phone formats), LATIN_LOCK (mojibake), THE_WARDEN (final boss stacking both plus emails). Each was solved end to end in both Python and SQL against the real engines.
- New predicates `matches_pattern` and `no_mojibake`, new affliction kinds `pattern` and `encoding`.
- SQL engine gains `REGEXP`, `REGEXP_EXTRACT` and `REGEXP_REPLACE`.
- World select hub as the landing screen; per-world themes (navy and brass for The Vault); `BossFightScreen` and `WorldMapScreen` now take a world.
- First-time tutorial overlay.

### Added

- Victory panel on boss clear (runs, cells cleaned, hints used, techniques) with "Back to bosses" and "Keep exploring".
- Progressive per-engine hints (`hints` in case JSON, hidden for final bosses); authored for the first three bosses.
- Redesigned boss roster screen with rank progress bar and boss cards.

### Fixed

- Mobile fight screen text overflow, cramped top bar, and clipped boot sequence.
- Briefing pane clipped the objective line on desktop; engine-select screen is now centred.

## Phase 3 — Dual-engine World 1 (SQL) — 2026-08-09

Every World 1 boss is now playable in SQL (SQLite via sql.js) as well as
Python (pandas via Pyodide) — the same case content, the same win
conditions, a real second in-browser engine rather than a simulated one.

### Added

- **sql.js/SQLite engine**: `apps/web/src/engines/sqlite.worker.ts`
  implements the same worker protocol as the Pyodide worker (`init-case`,
  `run-code`, `cancel`) against a real in-memory SQLite database. The seed
  CSV is loaded into a table literally named `data`; row identity for
  diffing uses SQLite's own `rowid` (stable across `UPDATE`/`DELETE`, with
  no idiomatic-SQL equivalent of `.reset_index()` that could defeat it,
  unlike pandas). sql.js's WASM binary is self-hosted automatically via
  Vite's `?url` asset resolution — no manual fetch/checksum script needed,
  unlike Pyodide's `scripts/fetch-pyodide.mjs` (it ships as one importable
  npm package, not a multi-hundred-MB distribution).
- **CSV-to-table loading + dtype inference for SQL**
  (`apps/web/src/engines/csv.ts`, `sql-dtypes.ts`): a hand-rolled
  RFC4180-ish CSV parser plus pandas-like per-column type inference (a
  column is only numeric if _every_ non-empty value in it parses as one —
  matching `pandas.read_csv`'s actual behavior), and dtype inference from
  SQLite's manifest-typed return values, producing the exact same dtype
  vocabulary (`int64`/`float64`/`object`/`datetime64[ns]`) the Pyodide
  worker reports, so `valid_dtype` and every downstream rendering path stay
  engine-agnostic.
- **`WorkerEngineClient` base class** (`packages/engine-adapters/src/client.ts`):
  extracted from the original single-engine `PyodideClient` once a second,
  near-identical `SqliteClient` would otherwise have duplicated its
  spawn/ready/run/cancel/terminate logic — the two now differ only in
  which worker file `createWorker()` spawns.
- **Engine-select screen** (`EngineSelect.tsx`): a new gate before boot —
  neither `PyodideClient` nor `SqliteClient` spawns (and for Pyodide, its
  multi-megabyte WASM payload isn't fetched) until the player actually
  picks an engine. `BossFightScreen`'s phase flow grew a
  `loading -> engine-select -> spawning -> boot -> fight` sequence (was
  `loading -> boot -> fight`); the fight-reveal slide-down (added this
  phase — see Fixed) still plays on entering `fight`, unaffected by which
  engine the run underneath it is.
- **Dual-language starter code**: `caseSchema.starterCode` is now
  `{ python, sql }` (was a single string) — a case's Python and SQL seed
  buffers are authored separately since they aren't translations of each
  other. All four World 1 cases got real, runnable SQL starter code
  (inspection queries mirroring their Python counterparts, e.g.
  `SELECT COUNT(*) FROM data WHERE temp_c IS NULL` alongside
  `df.isna().sum()`).
- **SQL syntax highlighting**: `CodeEditor` takes a `language: "python" |
"sql"` prop, using `@codemirror/lang-sql`'s `sql()` extension when a
  player is in SQL mode.

### Fixed / cross-engine parity

- **`valid_dtype: "datetime"` was trivially satisfied on load in SQL,
  never in Python** — the seed CSV's `opened_at` column (`THE_RECKONING`)
  is written via `Date.toISOString()` (e.g.
  `"2026-01-15T09:20:00.000Z"`), and the SQL dtype inferencer's original
  ISO-date regex matched that shape immediately, so the predicate started
  satisfied with zero player action — unlike Pyodide, where the identical
  column starts as pandas' `object` dtype until `pd.to_datetime()` is
  called. Fixed by tightening `ISO_DATE_PATTERN` in `sql-dtypes.ts` to
  reject fractional seconds and zone suffixes, matching instead exactly
  what SQLite's own `datetime()` function returns — so
  `UPDATE data SET opened_at = datetime(opened_at);` is now the required
  fix, the structural SQL twin of `pd.to_datetime(...)`. Caught during
  this phase's manual real-browser verification of `THE_RECKONING` in SQL
  mode, not by the type system or existing tests — regression tests added.
- Documented (not a code fix, a genuine engine difference authors must
  design around): SQLite's `CAST(x AS REAL)` silently returns `0` for
  non-numeric text, unlike pandas' `pd.to_numeric(..., errors="coerce")`,
  which returns `NaN`. `THE_RECKONING`'s `first_response_hours` column
  (garbage tokens like `"N/A"`/`"TBD"` mixed with real numbers) needs an
  explicit `CASE`-based coercion in SQL to get the same result — see the
  new "Writing content that's fair on both engines" section in
  `docs/content-authoring-guide.md`.

### Verified

- All four World 1 cases solved end-to-end in a real headless browser in
  **both** engines (not just typechecked/unit-tested), including
  `THE_RECKONING`'s six-predicate final-boss win condition in SQL — zero
  console errors in either engine. Re-verified against a production build
  served with the real `vercel.json` CSP headers (sql.js's self-hosted
  WASM asset loads and initializes cleanly under
  `script-src 'self' 'wasm-unsafe-eval'`; no CSP/`vercel.json` changes were
  needed since no new external origin was introduced).

## Phase 2 — Full World 1 — 2026-08-08

World 1 is now four bosses deep instead of one, with a real front door,
real progression, and real save data — no more hardcoded single fight.

### Added

- **Three new bosses**: `DOUBLE_TAKE` (mid-boss — nulls + duplicates
  stacked), `CASE_SHIFT` (mid-boss — whitespace + casing + wrong dtype,
  three afflictions on one table), `THE_RECKONING` (final boss — all six
  World 1 techniques stacked on one 500-row support-ticket dataset,
  including a deliberate sequencing trap: one column needs a dtype fix
  before its nulls and outliers can be addressed). Each ships with a
  synthetic, CC0, seeded-PRNG dataset and generator script, same pattern
  as Phase 1's `NUL_SENTINEL`. Datasets are styled after realistic messy
  data rather than literally sourced from Kaggle — a deliberate scoping
  decision documented in `apps/web/public/datasets/world-1/LICENSES.md`
  for the same licensing/offline-availability reasons as
  [ADR 0004](./docs/adr/0004-pyodide-package-delivery.md).
- **Four new win-condition predicates** (`no_whitespace`,
  `consistent_casing`, `valid_dtype`, `no_outliers`) covering all six of
  World 1's content areas from the master plan — Phase 1 only implemented
  `no_nulls`/`no_duplicates`. `valid_dtype` targeting `datetime` covers
  "bad dates" rather than a bespoke predicate.
- **Multi-affliction rendering**: every cell's affliction kind (null,
  duplicate, whitespace/casing, wrong dtype, outlier, bad date) now comes
  from a real per-cell map (`apps/web/src/lib/affliction-cells.ts`),
  each with its own colorblind-safe badge glyph, fill pattern, and
  `aria-label`, extending Phase 1's single-hue-plus-pattern system rather
  than replacing it. The HP heatmap aggregates severity across kinds with
  a dominant-color-per-bin rule (never blends hues — that would break the
  CVD-safety the ramp exists for) plus a glyph-count breakdown row for
  stacked cases.
- **World map** (`WorldMapScreen.tsx`) — the "front door" Phase 1 never
  needed (it had exactly one hardcoded fight): a boss roster with
  locked/unlocked/cleared state (straight linear gate on roster order),
  a rank/XP readout, and save export/import.
- **localStorage save system** (`apps/web/src/lib/save.ts`) — per-world
  cleared-case tracking, mastered-technique tracking, and XP, exported/
  imported as portable JSON (no login, per plan §6). XP is awarded once
  per technique on a case's first clear only, so re-running a solved case
  can't be grinded. Ranks are tied to distinct techniques mastered, not
  cases cleared, also per plan §6.
- **Case tiers** (`tutorial`/`mid-boss`/`final-boss`) drive both the
  roster display and the final boss's "no hints, one shot" framing — an
  honest tone/framing choice (withheld objective line, no starter-code
  scaffold), not a fake anti-cheat mechanism; nothing stops a determined
  player from inspecting `df` themselves, nor should it.
- **World rosters** (`content/rosters/<world>.json`) declare a world's
  boss sequence explicitly as reviewable content, not an inferred
  directory listing; `validate-content.mjs` now cross-checks every
  roster's case IDs actually resolve to a case file.
- `docs/design/world-1-phase-2-visual-spec.md` — the Phase 2 visual/motion
  spec. **Authored by Sonnet, not Opus** — a documented, user-approved
  one-time deviation from this project's normal process, forced by an
  Opus session-quota block mid-phase. Extends rather than replaces Phase 1's
  spec: the six-status affliction palette (colors/glyphs/patterns) was
  already fully designed by Opus in Phase 1 specifically so Phase 2
  wouldn't need to reopen it.

### Fixed

- **`lib/diff.ts` was positional-only** — a documented Phase 1 scoping
  assumption explicitly flagged as needing revisiting "once
  drop_duplicates()/dropna() cases (Phase 2) can change row count." That's
  exactly what `DOUBLE_TAKE` and `THE_RECKONING` require. `ResultGrid` now
  carries each row's real pandas index value; `diffGrids` and the new
  `clearedCells` helper match rows by that identity instead of array
  position, so a run that drops rows no longer produces a wall of spurious
  diffs on every row after the drop. Caught via real-browser testing, not
  code review.
- **Content-directory naming mismatch**: case JSON lived under
  `content/cases/world-1/` (a Phase 1 naming artifact) while every other
  Phase 2 concept keys off the `WorldId` value `"boss-fights"` — silently
  broke roster loading (`fetch` 404 → SPA fallback → JSON parse error).
  Renamed the directory to match `WorldId` exactly, and documented the
  convention in `docs/ARCHITECTURE.md` so it can't drift again.
- **Boot sequence hardcoded "NUL" as the scan label** regardless of a
  case's actual affliction mix — a stacked case like `THE_RECKONING` now
  reads `scanning for affliction .. NUL+WS+DUP+TYPE+OOR`, not a
  misleading `NUL`.
- **Console output had no dedicated, labeled panel** — an unlabeled blank
  scroll region below the run button read as dead space, especially
  before any code had run. `DiffConsole` now has an `OUTPUT` header with
  an entry count and an explicit empty state
  (`// run code to see diff output here`), flagged during a mid-session
  UI pass as genuinely incomplete rather than polish-optional.
- **The fight screen had no entrance** — `setPhase("fight")` was a hard
  React state swap with zero transition. Added a GSAP entrance
  (`anim/world1/fightReveal.ts`): the status rail and command rail fade
  in plainly, but the battlefield (HP band + dataframe grid) gets its own
  distinct slide-down — "the dataframe IS the battlefield" earns the more
  deliberate reveal.
- **`DOUBLE_TAKE`'s generator could silently undercount its own stated
  duplicate count** — nulling an email on one half of a duplicate pair
  (composite key `[email, item_sku, submitted_at]`) breaks the match,
  since the two rows no longer share a key. Fixed by excluding
  duplicate-involved rows from the null-email sampling pool, so the
  generated dataset always has exactly the documented counts.

Verified end-to-end in a real browser (headless Chrome, zero console
errors): world map → tutorial fight → win → rank/XP update → roster
reflects cleared/unlocked state → 2-stack mid-boss → 3-stack mid-boss →
5-distinct-kind final boss → save export/import.

### Fixed (Phase 2 completeness review)

A structured self-critique against the master plan and every non-negotiable
found real defects before Phase 2 was called done — all fixed and
re-verified, including against the real production build under the actual
CSP headers (not just `vite dev`):

- **P0 — the HP heatmap's severity math was wrong, and the final boss's top
  severity tier could never render.** The ratio powering each segment's
  level was normalized against predicate _count_, not the number of
  distinct columns a win condition could actually flag — on THE_RECKONING
  (7 predicates, 4 affictable columns at the time) the max achievable ratio
  was 4/7 ≈ 0.57, capping every segment below the top tier regardless of
  how afflicted a row really was. Fixed with a proper
  `afflictableColumns()` capacity calculation, plus a second bug in the
  same function: level boundaries used the decimal literals `0.33`/`0.66`
  instead of exact `1/3`/`2/3`, so an exact-thirds ratio (CASE_SHIFT's own
  baseline) rounded into the wrong band. Both traced back to an error in
  the (Sonnet-authored, Opus-unreviewed) design spec's own formula, not
  just the implementation — the spec was corrected too.
- **Bad-dates content was entirely missing** despite three places (this
  changelog, `LICENSES.md`, a code comment) claiming World 1's full six
  content areas were covered. Added `valid_dtype(opened_at, "datetime")`
  to `THE_RECKONING` — its `opened_at` column was already realistic "bad
  dates" content (plain CSV text, not yet parsed), it just had no predicate
  checking it.
- **Datetime columns would have rendered as raw epoch-millisecond
  integers** once a player fixed the above — `to_json()`'s default
  `date_format="epoch"` in the worker's serializer. Fixed with
  `date_format="iso"`; verified a `pd.to_datetime()` fix now shows real
  ISO datetime strings in both the grid and the console output.
- **`.reset_index(drop=True)` — the single most idiomatic way to finish a
  `drop_duplicates()` fix — could re-corrupt the row-identity diffing
  fixed earlier this phase.** Pandas' default index survives
  `drop_duplicates()` but not an explicit reset, which re-labels rows back
  to a fresh range that can collide with old identities. Replaced
  index-based tracking with a hidden, hand-maintained data column
  (`__dcq_row_id__`, stripped from the grid before it's ever sent to the
  UI) that survives every row-preserving operation, `.reset_index()`
  included. See the updated [ADR 0006](./docs/adr/0006-row-identity-diffing.md).
- **A11y preferences (text scale, CRT intensity, high contrast) were
  silently ignored on the world map** — the app's actual landing screen
  since this phase, but the only code applying them still lived inside
  `BossFightScreen`. Lifted to `App.tsx` (`lib/a11y.ts`) and rendered via a
  new shared `A11yControls` component on both screens.
- **Save import/export status was invisible to screen readers** — the
  `aria-live` region only existed once there was something to announce,
  which most screen readers don't reliably pick up. Made it always-mounted
  (empty when idle), matching the pattern `BossFightScreen` already used
  for its own live regions; added an announcement for export too (there
  was none).
- **The world map's initial bundle pulled in CodeMirror and GSAP before a
  player had picked a fight** — an unsplit route boundary introduced by
  this phase's own new navigation. Route-split via `React.lazy`; the
  landing screen's JS dropped from ~279 KB gzip to ~79 KB gzip.
- Smaller fixes: the roster's "/ 6 techniques" denominator was hardcoded
  instead of derived from the world's actual rank tiers; the roster's
  affliction-kind glyph preview had no accessible-name equivalent for
  screen reader users (folded into each case button's `aria-label`); the
  save-export download anchor wasn't appended to the document before
  `.click()` (fragile outside Chromium) and revoked its object URL
  synchronously instead of after the click had a chance to start;
  `hpSegments.test.ts` had a test that positively certified the P0 bug as
  correct behavior — replaced with regression tests for the fixed formula;
  added a `clearedCells` test exercising the after-position remap branch
  the review flagged as uncovered.

Re-verified end-to-end after all of the above, including a full pass
against the production build served with the real `vercel.json` CSP
headers (not `vite dev`) — same lesson Phase 1's own review learned: dev
mode doesn't catch CSP-only or MIME-type-only failures.

## Phase 1 — Prove the core loop — 2026-08-08

The nulls-only tutorial boss, `NUL_SENTINEL`, is real and playable
end-to-end: real Pyodide/pandas execution in a dedicated Web Worker, real
diff feedback, real win detection. Verified in a real browser (headless
Chrome), not just unit tests — including a genuine unmodified Python
traceback surfacing on a bad run.

### Added

- **World 1 visual/motion design spec**
  (`docs/design/world-1-visual-spec.md`) — Opus-authored, covering palette,
  typography, layout, the CRT treatment, affliction rendering, the HP
  heatmap, diff-flash choreography, GSAP timelines, and the ASCII sigil.
  Sonnet implemented directly against this spec.
- **Pyodide worker** (`apps/web/src/engines/pyodide.worker.ts`) — self-hosted,
  checksum-verified interpreter core; pandas/numpy/etc. wheels loaded by
  direct pinned-version URL from jsdelivr (documented in
  [ADR 0004](./docs/adr/0004-pyodide-package-delivery.md), with the matching
  `connect-src` exception in `vercel.json`). Runs in a dedicated Web Worker,
  never the main thread. A persistent Python namespace holds `df` across
  runs within a boss fight, so cumulative edits behave like a real notebook.
- **Worker RPC** (`packages/engine-adapters/src/rpc.ts`) — correlates
  `init-case`/`run-code`/`cancel` requests with responses, with timeout
  handling and 8 unit tests. `cancel()` is documented as best-effort only
  (no true mid-execution interrupt without SharedArrayBuffer + cross-origin
  isolation, which would conflict with ADR 0002's simpler CSP posture).
- **Pure game-logic libraries** (`apps/web/src/lib/`): `diff.ts` (positional
  cell diffing — a documented Phase 1 scoping assumption, valid while row
  count/order stay stable), `afflictions.ts` (null/duplicate counting),
  `evaluate-win-condition.ts` (declarative predicate evaluation against a
  live result grid). 16 unit tests between them.
- **World 1 UI** (`apps/web/src/worlds/boss-fights/`) — `BootSequence`
  (character-typed boot log), `BriefingPanel` (with the decaying ASCII
  sigil), `HpHeatmap` (per-row auto-binned affliction heatmap, not an
  aggregate bar), `DataframeGrid` (TanStack Virtual, the dataframe _is_ the
  boss), `CodeEditor` (CodeMirror 6, custom theme, `Mod-Enter` to run),
  `RunBar`, `DiffConsole`. Colorblind-safe affliction/diff palettes (hue +
  glyph + pattern, never color alone), reduced-motion variants throughout,
  keyboard nav, font-scale/CRT-intensity/high-contrast controls persisted
  separately from save data.
- **GSAP choreography** (`apps/web/src/anim/world1/`) — boss-hit recoil,
  HP-segment shatter, diff-flash (reading-order wave vs. the shatter's
  randomized stagger), CRT idle flicker (via `repeatRefresh` so it never
  visibly loops), boot-sequence typing. All animation state lives outside
  React (ADR 0001) — driven via refs and CSS custom properties.
- **Tutorial case content**: `content/cases/world-1/w1-01-nul-sentinel.json`
  - a deterministic synthetic-data generator
    (`scripts/generate-nul-sentinel.mjs`, CC0, seeded PRNG) producing the
    240-row/23-null dataset with the clustered null distribution the HP
    heatmap needs to be informative.
- One additive, optional schema field (`caseStringsSchema.subtitle`) needed
  by the design spec's boss subtitle line.
- A custom Vite plugin (`apps/web/vite.config.ts`) serving/copying
  `content/cases/` in dev and at build time — replaced an initial attempt
  with `vite-plugin-static-copy`, which didn't serve files in dev mode.
- `pnpm install` now runs `postinstall` → `fetch-pyodide.mjs` automatically,
  since the worker genuinely depends on those assets being present.
- Case JSON gained three fields, applied to the shipped case: `datasetLicense`
  (required — plan §8's per-dataset license documented in metadata, not only
  `LICENSES.md`), `starterCode` (required — the code buffer the editor
  seeds, previously hardcoded in the component), `columnHints` (optional —
  per-column width/numeric display hints, previously hardcoded).
- Worker output capture: `run-result` now includes captured `print()` output
  plus the last expression's repr, exactly like a real notebook cell — the
  shipped starter code (`df.isna().sum()`) previously produced no visible
  output at all.

### Fixed

A Phase 1 completeness review (Opus self-critique against the plan, the
design spec, and every non-negotiable) found real defects before the phase
was tagged done — all fixed and re-verified in a real browser under the
actual production CSP headers, not just `vite dev`:

- **CSP would have blanked the app in production.** `script-src 'self'`
  blocks `WebAssembly.instantiate` (Pyodide can't start) and `style-src
'self'` blocks CodeMirror's runtime-injected stylesheet — neither was ever
  exercised by earlier verification, which only ran against the dev server.
  Fixed with `'wasm-unsafe-eval'` and `'unsafe-inline'` respectively; see
  [ADR 0005](./docs/adr/0005-csp-wasm-and-inline-styles.md).
- **Diff-flash was semantically broken**: `.diffOld` tweened `opacity: 0 →
0` (a no-op — the CSS default and the tween's start value were both zero),
  had no `text-decoration-line` for its strikethrough, and wasn't cleared
  after settling — an invisible stale value sat in the DOM and shifted cell
  layout for the rest of the session. Fixed: explicit `fromTo` from a real
  visible state, absolute-stacked spans so old/new overlap instead of
  pushing layout, and the old value's text is cleared on settle.
- `EngineRpcClient.ready()` had no timeout and the worker never posted a
  failure — a broken engine hung on a blank screen forever. Added an
  `engine-error` protocol message and a 45s `ready()` timeout with a real
  visible loading/failure UI (previously an empty div).
- Grid had no keyboard navigation despite `role="grid"` (plan §11's "full
  keyboard nav" requirement) — added roving `tabindex` + arrow keys, plus
  `:focus-visible` rings that were missing on the briefing/console panels.
- Font-scale controls silently broke the grid: row height was hardcoded at
  28px while the CSS line-height scaled with `--dcq-text-scale`, clipping
  text at larger sizes. Row height now derives from the same scale and
  triggers `virtualizer.measure()`.
- HP heatmap segment colors were set via inline style, so
  `[data-dcq-contrast="high"]` couldn't reach them; moved to CSS
  `[data-level]` rules. Added a `forced-colors: active` fallback (Windows
  High Contrast) for afflicted cells.
- Dead code removed: `afflictionDom.ts`'s `applyAffliction`/
  `setCellAriaLabel` were never called (affliction rendering already goes
  through React props, which ADR 0001 is amended to clarify is fine for
  once-per-turn state); `resetDiffFlash` was exported but never called
  (its cleanup is now automatic inside `playDiffFlashBatch`).
- `BootSequence` used a raw `useEffect` whose cleanup didn't kill the GSAP
  master timeline, so StrictMode's double-invoke could run two typing
  timelines concurrently. Switched to `useGSAP`.
- Chromatic aberration (`--w1-chromatic`) was tweened by
  `battlefieldRecoil.ts` but no CSS rule consumed it — the recoil had no
  screen mis-convergence artifact. Wired to `text-shadow` on `.battlefield`.
- Narrow-viewport DOM order didn't match the spec's reading order (briefing
  → HP → grid → editor → run bar → console) and the narrow-display notice
  wasn't dismissible. Fixed with `order` + a dismiss button.
- Run errors announced via the polite live region instead of assertive, and
  the polite region wasn't debounced. Split into two regions; the polite one
  now debounces 400ms.
- A schema-valid `no_duplicates`-only case would have rendered a blank
  screen (World 1 only renders the nulls affliction) — now shows an honest
  "not supported yet" message instead.
- Test gaps: `caseFormat.ts` and `bootType.ts`'s `revealLine` (segment
  boundary math) had zero coverage; `sigil.test.ts` had a vacuous assertion
  that passed only because it coincidentally matched the frame's border
  characters, not the fill logic under test; no component-level test
  existed despite jsdom being configured. Added tests for all of these
  (61 tests passing workspace-wide, up from 36).

### Not yet built (see `README.md#status` and the roadmap in the master plan)

- Save system, XP/rank tracking, stacked afflictions, mid/final bosses —
  Phase 2.
- SQL engine (sql.js), dual-engine cases — Phase 3.
- Worlds 2–5, sandbox mode — Phases 4–6.
- Playwright e2e, Lighthouse CI, Service Worker/offline caching, full
  security review — Phase 7.
- Open-source launch materials, sound design, shareable rank cards — Phases
  8–9.

## Phase 0 — Repo scaffold — 2026-08-08

### Added

- Initial repo scaffold: pnpm workspaces monorepo (`apps/web`,
  `packages/content-schema`, `packages/engine-adapters`, `packages/ui-kit`,
  `content/`), strict shared `tsconfig.base.json` chain, flat ESLint config,
  Prettier, Husky pre-commit + lint-staged.
- `apps/web`: Vite + React 19 + TypeScript placeholder shell.
- `packages/content-schema`: Zod schema for case JSON, declarative
  win-condition predicates (`no_nulls`, `no_duplicates`).
- `packages/engine-adapters`: typed main-thread/worker message protocol
  (`protocol.ts`) — RPC implementation and the actual Pyodide worker land in
  Phase 1 implementation, not this scaffold.
- `scripts/fetch-pyodide.mjs` — pinned + checksum-verified Pyodide-core
  fetch, gitignored output.
- `scripts/validate-content.mjs` — validates `content/cases/**/*.json`
  against the content schema; wired into CI.
- GitHub Actions CI: typecheck → lint → format check → unit tests → content
  validation → build.
- `vercel.json` with strict CSP (`script-src 'self'`, `connect-src 'self'`,
  no inline scripts).
- Governance docs: `LICENSE` (MIT), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `SECURITY.md`, PR template, bug/new-case issue templates, Dependabot.
- `docs/ARCHITECTURE.md`, `docs/content-authoring-guide.md`, and ADRs for
  the three open decisions resolved before scaffolding: React over Svelte
  (0001), Vercel over GitHub Pages for CSP-capable hosting (0002), and
  declarative-only win-condition predicates (0003).
