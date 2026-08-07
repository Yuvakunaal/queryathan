# Graph Report - .  (2026-08-08)

## Corpus Check
- Corpus is ~7,908 words - fits in a single context window. You may not need a graph.

## Summary
- 126 nodes · 202 edges · 9 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Game UI & Core Stack|Game UI & Core Stack]]
- [[_COMMUNITY_Security & Hosting Decisions|Security & Hosting Decisions]]
- [[_COMMUNITY_Case Schema & Game Worlds|Case Schema & Game Worlds]]
- [[_COMMUNITY_Content Pipeline & Foundry|Content Pipeline & Foundry]]
- [[_COMMUNITY_Monorepo Tooling & Docs|Monorepo Tooling & Docs]]
- [[_COMMUNITY_Worker RPC Message Types|Worker RPC Message Types]]
- [[_COMMUNITY_RunCodeCancel Request Types|RunCode/Cancel Request Types]]
- [[_COMMUNITY_Worker Response Union Type|Worker Response Union Type]]
- [[_COMMUNITY_Engine Ready Response Type|Engine Ready Response Type]]

## God Nodes (most connected - your core abstractions)
1. `Data Cleaning Quest Master Plan` - 44 edges
2. `Changelog` - 24 edges
3. `README` - 23 edges
4. `Security Policy` - 18 edges
5. `CONTRIBUTING Guide` - 17 edges
6. `Architecture Doc` - 17 edges
7. `Content Authoring Guide` - 11 edges
8. `ADR 0003: Win-Condition Contract` - 11 edges
9. `ADR 0001: React over Svelte` - 10 edges
10. `ADR 0002: Vercel Hosting` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Service Worker (Workbox) Caching` --conceptually_related_to--> `fetch-pyodide Script`  [INFERRED]
  data-cleaning-quest-master-plan.md → scripts/fetch-pyodide.mjs
- `ESLint Flat Config` --shares_data_with--> `Husky Pre-commit Hooks`  [INFERRED]
  eslint.config.js → CONTRIBUTING.md
- `Changelog` --references--> `fetch-pyodide Script`  [EXTRACTED]
  CHANGELOG.md → scripts/fetch-pyodide.mjs
- `Changelog` --references--> `validate-content Script`  [EXTRACTED]
  CHANGELOG.md → scripts/validate-content.mjs
- `Architecture Doc` --references--> `validate-content Script`  [EXTRACTED]
  docs/ARCHITECTURE.md → scripts/validate-content.mjs

## Hyperedges (group relationships)
- **Layered Code-Execution Sandboxing Model** — concept_web_worker, concept_sandbox_iframe, concept_csp, doc_security [INFERRED 0.85]
- **Three Pre-Scaffold Architecture Decisions** — doc_adr_0001_framework, doc_adr_0002_hosting, doc_adr_0003_win_condition_contract, doc_master_plan [EXTRACTED 0.95]
- **Community Content Contribution Pipeline** — dir_content_cases, pkg_content_schema, validate_content_script, doc_adr_0003_win_condition_contract, doc_content_authoring_guide [EXTRACTED 0.90]
- **Pyodide/SQL.js Worker Communication Architecture** — protocol_workermessageprotocol, vite_config_worker_build, vitest_config_rpc_phase1_plan [INFERRED 0.75]
- **Case Definition Schema System** — case_caseschema, case_winconditionschema, case_predicateschema, case_casestringsschema, case_test_caseschema_validation [INFERRED 0.85]
- **Defer Implementation Until Phase 1 / Second Use Principle** — index_shared_component_extraction_rule, vitest_config_rpc_phase1_plan, vitest_config_diff_afflictions_plan [INFERRED 0.65]

## Communities

### Community 0 - "Game UI & Core Stack"
Cohesion: 0.11
Nodes (23): BenchmarkHUD Component, CodeEditor Component, DataframeBattlefield Component, DiffView Component, WorldMap Component, CodeMirror 6, GSAP Animation, Lighthouse CI Performance Budget (+15 more)

### Community 1 - "Security & Hosting Decisions"
Cohesion: 0.15
Nodes (22): Contributor Covenant, Content Security Policy, Dependabot, GitHub Actions CI Pipeline, GitHub Pages Hosting, Netlify Hosting, Sandboxed Cross-Origin Iframe, sql.js (WASM SQLite) (+14 more)

### Community 2 - "Case Schema & Game Worlds"
Cohesion: 0.11
Nodes (20): App Component, Case (type), caseSchema, caseStringsSchema, Predicate (type), predicateSchema, Case Schema Validation Test Suite, WinCondition (type) (+12 more)

### Community 3 - "Content Pipeline & Foundry"
Cohesion: 0.18
Nodes (18): lint-staged, pandera Validation Framework, trustedAssertion Escape Hatch, Vitest, Declarative Win-Condition Predicates, World 5: The Foundry, apps/web/src/anim, content/cases (+10 more)

### Community 4 - "Monorepo Tooling & Docs"
Cohesion: 0.16
Nodes (15): apps/web, Husky Pre-commit Hooks, Playwright, pnpm Workspaces Monorepo, Pyodide (WASM Python), Service Worker (Workbox) Caching, Vite, scripts/ (+7 more)

### Community 5 - "Worker RPC Message Types"
Cohesion: 0.5
Nodes (4): CancelRequest, RunCodeRequest, RunErrorResponse, RunResultResponse

### Community 23 - "RunCode/Cancel Request Types"
Cohesion: 1.0
Nodes (1): WorkerRequest

### Community 24 - "Worker Response Union Type"
Cohesion: 1.0
Nodes (1): WorkerResponse

### Community 25 - "Engine Ready Response Type"
Cohesion: 1.0
Nodes (1): EngineReadyResponse

## Ambiguous Edges - Review These
- `README` → `graphify-out/GRAPH_REPORT.md`  [AMBIGUOUS]
  README.md · relation: references

## Knowledge Gaps
- **43 isolated node(s):** `Prettier Config`, `PR Template`, `"New Case / Boss Proposal" Issue Template`, `graphify-out/GRAPH_REPORT.md`, `scripts/` (+38 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `RunCode/Cancel Request Types`** (1 nodes): `WorkerRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Worker Response Union Type`** (1 nodes): `WorkerResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Engine Ready Response Type`** (1 nodes): `EngineReadyResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `README` and `graphify-out/GRAPH_REPORT.md`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `Data Cleaning Quest Master Plan` connect `Game UI & Core Stack` to `Security & Hosting Decisions`, `Content Pipeline & Foundry`, `Monorepo Tooling & Docs`?**
  _High betweenness centrality (0.202) - this node is a cross-community bridge._
- **Why does `README` connect `Monorepo Tooling & Docs` to `Game UI & Core Stack`, `Security & Hosting Decisions`, `Content Pipeline & Foundry`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `Changelog` connect `Security & Hosting Decisions` to `Game UI & Core Stack`, `Content Pipeline & Foundry`, `Monorepo Tooling & Docs`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **What connects `Prettier Config`, `PR Template`, `"New Case / Boss Proposal" Issue Template` to the rest of the system?**
  _43 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Game UI & Core Stack` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Case Schema & Game Worlds` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._