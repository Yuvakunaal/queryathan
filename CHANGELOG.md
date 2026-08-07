# Changelog

All notable changes to this project are documented here. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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

### Not yet built (see `README.md#status` and the roadmap in the master plan)

- Pyodide-in-worker wiring, the nulls-only tutorial boss, the
  dataframe-battlefield UI, diff-view feedback — Phase 1 implementation.
- Save system, SQL engine, Worlds 2–5, sandbox mode, Playwright/Lighthouse
  CI, sound, shareable rank cards — later phases per the roadmap.
