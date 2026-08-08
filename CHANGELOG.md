# Changelog

All notable changes to this project are documented here. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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
