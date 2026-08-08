# Graph Report - .  (2026-08-08)

## Corpus Check
- 0 files · ~99,999 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 338 nodes · 522 edges · 20 communities detected
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_World 1 UI & CIDX Tooling|World 1 UI & CI/DX Tooling]]
- [[_COMMUNITY_Monorepo Governance & Tooling|Monorepo Governance & Tooling]]
- [[_COMMUNITY_World 1 VisualMotion Design|World 1 Visual/Motion Design]]
- [[_COMMUNITY_CSP & HostingPrivacy Policy|CSP & Hosting/Privacy Policy]]
- [[_COMMUNITY_Boss Fight Game Logic|Boss Fight Game Logic]]
- [[_COMMUNITY_Content Schema & World Roster|Content Schema & World Roster]]
- [[_COMMUNITY_GSAP Boss-Fight Choreography|GSAP Boss-Fight Choreography]]
- [[_COMMUNITY_Worker RPC Client|Worker RPC Client]]
- [[_COMMUNITY_Pyodide Worker & RPC Tests|Pyodide Worker & RPC Tests]]
- [[_COMMUNITY_PyodideClient Wrapper|PyodideClient Wrapper]]
- [[_COMMUNITY_Synthetic Dataset Generator|Synthetic Dataset Generator]]
- [[_COMMUNITY_RPC Protocol Message Types|RPC Protocol Message Types]]
- [[_COMMUNITY_ASCII Sigil Renderer|ASCII Sigil Renderer]]
- [[_COMMUNITY_HP Segment Math|HP Segment Math]]
- [[_COMMUNITY_WorkerRequest Type|WorkerRequest Type]]
- [[_COMMUNITY_WorkerResponse Type|WorkerResponse Type]]
- [[_COMMUNITY_EngineReadyResponse Type|EngineReadyResponse Type]]
- [[_COMMUNITY_Case JSON Content Pipeline|Case JSON Content Pipeline]]
- [[_COMMUNITY_CodeMirror 6 Integration|CodeMirror 6 Integration]]
- [[_COMMUNITY_Brand Favicon|Brand Favicon]]

## God Nodes (most connected - your core abstractions)
1. `Changelog` - 63 edges
2. `Data Cleaning Quest Master Plan` - 44 edges
3. `World 1 — Boss Fights Visual Spec` - 42 edges
4. `Architecture` - 38 edges
5. `Security Policy` - 35 edges
6. `README` - 34 edges
7. `Content Authoring Guide` - 21 edges
8. `Contributing Guide` - 17 edges
9. `ADR 0001: React over Svelte` - 14 edges
10. `ADR 0003: Win-Condition Contract` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Declarative win-condition predicates` --semantically_similar_to--> `Positional cell diff algorithm`  [INFERRED] [semantically similar]
  docs/ARCHITECTURE.md → apps/web/src/lib/diff.ts
- `Changelog` --references--> `lib/afflictions.ts`  [EXTRACTED]
  CHANGELOG.md → apps/web/src/lib/afflictions.ts
- `Changelog` --references--> `caseStringsSchema.subtitle field`  [EXTRACTED]
  CHANGELOG.md → packages/content-schema/src/case.ts
- `fetch-pyodide Script` --conceptually_related_to--> `Service Worker (Workbox) Caching`  [INFERRED]
  scripts/fetch-pyodide.mjs → data-cleaning-quest-master-plan.md
- `Declarative win-condition predicates` --semantically_similar_to--> `pandera Validation Framework`  [INFERRED] [semantically similar]
  docs/ARCHITECTURE.md → data-cleaning-quest-master-plan.md

## Hyperedges (group relationships)
- **Direct DOM Mutation Rendering Pattern (grid is the boss)** — file_dataframegrid_tsx, file_hpheatmap_tsx, file_afflictiondom_ts, concept_gsap_dom_refs_guardrail [INFERRED 0.80]
- **Narrow CSP Exceptions for WASM and Runtime Styles** — doc_adr_0005, concept_wasm_unsafe_eval, concept_unsafe_inline_style, file_pyodide_worker_ts, file_editortheme_ts [EXTRACTED 0.90]
- **Dual-Channel Diff Feedback (grid flash + console log)** — design_diff_flash_mechanics, file_diffconsole_tsx, anim_diffflash_ts, file_lib_diff_ts [EXTRACTED 0.85]

## Communities

### Community 0 - "World 1 UI & CI/DX Tooling"
Cohesion: 0.06
Nodes (47): apps/web, BenchmarkHUD Component, CodeEditor Component, DataframeBattlefield Component, DiffView Component, WorldMap Component, CodeMirror 6, GitHub Actions CI Pipeline (+39 more)

### Community 1 - "Monorepo Governance & Tooling"
Cohesion: 0.08
Nodes (42): GitHub Actions CI pipeline, Contributor Covenant, lint-staged, pandera Validation Framework, pnpm workspaces monorepo, trustedAssertion Escape Hatch, vite-plugin-static-copy (rejected), Vitest (+34 more)

### Community 2 - "World 1 Visual/Motion Design"
Cohesion: 0.08
Nodes (22): diffFlash.ts (animation), IBM Plex Mono font, Martian Mono font, NUL_SENTINEL boss / w1-01-nul-sentinel case, Positional cell diff algorithm, nul-sentinel.csv dataset, Accessibility control cluster, Affliction cell rendering (3-signal design) (+14 more)

### Community 3 - "CSP & Hosting/Privacy Policy"
Cohesion: 0.12
Nodes (31): Content Security Policy, CSP connect-src directive, CSP script-src directive, CSP style-src directive, Dataset/content licensing policy, Dependabot, GitHub Pages Hosting, GitHub Pages CSP limitation (+23 more)

### Community 4 - "Boss Fight Game Logic"
Cohesion: 0.12
Nodes (13): announcePolite(), boot(), defaultA11y(), handleRun(), isCancelled(), loadA11yState(), getPrimaryNullColumn(), countDuplicates() (+5 more)

### Community 5 - "Content Schema & World Roster"
Cohesion: 0.11
Nodes (20): App Component, Case (type), caseSchema, caseStringsSchema, Predicate (type), predicateSchema, Case Schema Validation Test Suite, WinCondition (type) (+12 more)

### Community 6 - "GSAP Boss-Fight Choreography"
Cohesion: 0.14
Nodes (11): playBossHitRecoil(), playNoProgressFlash(), playReducedRecoil(), playBootSequence(), revealLine(), playDiffFlashBatch(), playHpShatterBatch(), playSegmentShatter() (+3 more)

### Community 7 - "Worker RPC Client"
Cohesion: 0.14
Nodes (5): EngineRpcClient, generateRequestId(), RpcEngineError, RpcRunError, RpcTimeoutError

### Community 8 - "Pyodide Worker & RPC Tests"
Cohesion: 0.24
Nodes (6): buildOutput(), handleRequest(), initPyodide(), isDestroyable(), serializeDataframe(), FakeTransport

### Community 9 - "PyodideClient Wrapper"
Cohesion: 0.25
Nodes (1): PyodideClient

### Community 10 - "Synthetic Dataset Generator"
Cohesion: 0.47
Nodes (3): chooseNullRows(), range(), sampleDistinct()

### Community 12 - "RPC Protocol Message Types"
Cohesion: 0.5
Nodes (4): CancelRequest, RunCodeRequest, RunErrorResponse, RunResultResponse

### Community 14 - "ASCII Sigil Renderer"
Cohesion: 1.0
Nodes (2): fillCharForRatio(), renderSigil()

### Community 15 - "HP Segment Math"
Cohesion: 1.0
Nodes (2): computeHpSegments(), levelForRatio()

### Community 42 - "WorkerRequest Type"
Cohesion: 1.0
Nodes (1): WorkerRequest

### Community 43 - "WorkerResponse Type"
Cohesion: 1.0
Nodes (1): WorkerResponse

### Community 44 - "EngineReadyResponse Type"
Cohesion: 1.0
Nodes (1): EngineReadyResponse

### Community 55 - "Case JSON Content Pipeline"
Cohesion: 1.0
Nodes (1): Case JSON content pipeline

### Community 56 - "CodeMirror 6 Integration"
Cohesion: 1.0
Nodes (1): CodeEditor (CodeMirror 6 component)

### Community 57 - "Brand Favicon"
Cohesion: 1.0
Nodes (1): Data Cleaning Quest Favicon (Terminal Prompt Icon)

## Knowledge Gaps
- **63 isolated node(s):** `Prettier Config`, `PR Template`, `"New Case / Boss Proposal" Issue Template`, `Graphify Structural Report`, `scripts/` (+58 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `PyodideClient Wrapper`** (8 nodes): `pyodide-client.ts`, `PyodideClient`, `.cancel()`, `.initCase()`, `.ready()`, `.run()`, `.spawn()`, `.terminate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ASCII Sigil Renderer`** (3 nodes): `sigil.ts`, `fillCharForRatio()`, `renderSigil()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HP Segment Math`** (3 nodes): `hpSegments.ts`, `computeHpSegments()`, `levelForRatio()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `WorkerRequest Type`** (1 nodes): `WorkerRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `WorkerResponse Type`** (1 nodes): `WorkerResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `EngineReadyResponse Type`** (1 nodes): `EngineReadyResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Case JSON Content Pipeline`** (1 nodes): `Case JSON content pipeline`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CodeMirror 6 Integration`** (1 nodes): `CodeEditor (CodeMirror 6 component)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Brand Favicon`** (1 nodes): `Data Cleaning Quest Favicon (Terminal Prompt Icon)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Changelog` connect `Monorepo Governance & Tooling` to `World 1 UI & CI/DX Tooling`, `World 1 Visual/Motion Design`, `CSP & Hosting/Privacy Policy`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `World 1 — Boss Fights Visual Spec` connect `World 1 Visual/Motion Design` to `World 1 UI & CI/DX Tooling`, `Monorepo Governance & Tooling`, `CSP & Hosting/Privacy Policy`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `Data Cleaning Quest Master Plan` connect `World 1 UI & CI/DX Tooling` to `Monorepo Governance & Tooling`, `CSP & Hosting/Privacy Policy`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `Prettier Config`, `PR Template`, `"New Case / Boss Proposal" Issue Template` to the rest of the system?**
  _63 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `World 1 UI & CI/DX Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Monorepo Governance & Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `World 1 Visual/Motion Design` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._