# Graph Report - .  (2026-08-09)

## Corpus Check
- 0 files · ~99,999 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 494 nodes · 861 edges · 23 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 77 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_ADRs, CI, and Core Game-Logic Modules|ADRs, CI, and Core Game-Logic Modules]]
- [[_COMMUNITY_ReactPyodide Foundation & Component Roster|React/Pyodide Foundation & Component Roster]]
- [[_COMMUNITY_AfflictionDiffWin-Condition Logic|Affliction/Diff/Win-Condition Logic]]
- [[_COMMUNITY_World 1 Boss Roster & Row-Identity Diffing|World 1 Boss Roster & Row-Identity Diffing]]
- [[_COMMUNITY_World 1 GSAP Choreography & Typography|World 1 GSAP Choreography & Typography]]
- [[_COMMUNITY_CSP, Hosting & Licensing Policy|CSP, Hosting & Licensing Policy]]
- [[_COMMUNITY_App Shell, Save System & World Map|App Shell, Save System & World Map]]
- [[_COMMUNITY_Content Schema Types & World Roster|Content Schema Types & World Roster]]
- [[_COMMUNITY_GSAP Animation Playback Functions|GSAP Animation Playback Functions]]
- [[_COMMUNITY_Worker RPC Client (EngineRpcClient)|Worker RPC Client (EngineRpcClient)]]
- [[_COMMUNITY_Pyodide Worker Internals & RPC Tests|Pyodide Worker Internals & RPC Tests]]
- [[_COMMUNITY_PyodideClient Wrapper|PyodideClient Wrapper]]
- [[_COMMUNITY_NUL_SENTINEL Dataset Generator|NUL_SENTINEL Dataset Generator]]
- [[_COMMUNITY_Accessibility State Module (a11y.ts)|Accessibility State Module (a11y.ts)]]
- [[_COMMUNITY_RPC Protocol Message Types|RPC Protocol Message Types]]
- [[_COMMUNITY_HP Segment Severity Math|HP Segment Severity Math]]
- [[_COMMUNITY_ASCII Sigil Renderer|ASCII Sigil Renderer]]
- [[_COMMUNITY_WorkerRequest Type|WorkerRequest Type]]
- [[_COMMUNITY_WorkerResponse Type|WorkerResponse Type]]
- [[_COMMUNITY_EngineReadyResponse Type|EngineReadyResponse Type]]
- [[_COMMUNITY_Case JSON Content Pipeline|Case JSON Content Pipeline]]
- [[_COMMUNITY_CodeMirror 6 Integration|CodeMirror 6 Integration]]
- [[_COMMUNITY_Brand Favicon|Brand Favicon]]

## God Nodes (most connected - your core abstractions)
1. `Architecture (docs/ARCHITECTURE.md)` - 63 edges
2. `Data Cleaning Quest Master Plan` - 44 edges
3. `World 1 Visual Spec (Phase 1)` - 43 edges
4. `Content Authoring Guide` - 36 edges
5. `SECURITY.md` - 35 edges
6. `World 1 Phase 2 Visual Spec` - 26 edges
7. `Contributing Guide` - 17 edges
8. `World 1 Dataset Licenses` - 15 edges
9. `ADR 0001: React over Svelte` - 14 edges
10. `ADR 0003: Win-Condition Contract` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Declarative win-condition predicates` --semantically_similar_to--> `Positional cell diff algorithm`  [INFERRED] [semantically similar]
  docs/ARCHITECTURE.md → apps/web/src/lib/diff.ts
- `fetch-pyodide Script` --conceptually_related_to--> `Service Worker (Workbox) Caching`  [INFERRED]
  scripts/fetch-pyodide.mjs → data-cleaning-quest-master-plan.md
- `Declarative win-condition predicates` --semantically_similar_to--> `pandera Validation Framework`  [INFERRED] [semantically similar]
  docs/ARCHITECTURE.md → data-cleaning-quest-master-plan.md
- `ESLint Flat Config` --shares_data_with--> `Husky Pre-commit Hooks`  [INFERRED]
  eslint.config.js → CONTRIBUTING.md
- `Data Cleaning Quest Master Plan` --references--> `packages/content-schema`  [EXTRACTED]
  data-cleaning-quest-master-plan.md → packages/content-schema/src/case.ts

## Hyperedges (group relationships)
- **Multi-Affliction Rendering System** — system_multi_affliction_rendering, code_affliction_cells_ts, code_hp_heatmap, doc_world1_phase2_visual_spec [INFERRED 0.80]
- **Row Identity Diffing Fix Flow** — adr_0006_row_identity_diffing, code_diff_ts, dcq_row_id_column, code_pyodide_worker, boss_double_take [EXTRACTED 0.90]
- **Save, XP, Rank, and World Map Progression System** — system_save_progression, system_xp_rank, code_world_map_screen, system_case_tiers, code_save_ts [INFERRED 0.75]

## Communities

### Community 0 - "ADRs, CI, and Core Game-Logic Modules"
Cohesion: 0.05
Nodes (78): ADR 0002: Hosting (Vercel), ADR 0003: Win-Condition Contract, ADR 0005: CSP, WASM and Inline Styles, content/cases/boss-fights/w1-01-nul-sentinel.json, content/cases/boss-fights/w1-04-the-reckoning.json, GitHub Actions CI pipeline, lib/a11y.ts, lib/afflictions.ts (+70 more)

### Community 1 - "React/Pyodide Foundation & Component Roster"
Cohesion: 0.05
Nodes (49): ADR 0001: Framework (React), ADR 0004: Pyodide Package Delivery, apps/web, pyodide.worker.ts, BenchmarkHUD Component, CodeEditor Component, DataframeBattlefield Component, DiffView Component (+41 more)

### Community 2 - "Affliction/Diff/Win-Condition Logic"
Cohesion: 0.08
Nodes (37): announcePolite(), boot(), defaultA11y(), handleRun(), isCancelled(), loadA11yState(), getPrimaryNullColumn(), predicateKinds() (+29 more)

### Community 3 - "World 1 Boss Roster & Row-Identity Diffing"
Cohesion: 0.12
Nodes (37): ADR 0006: Row Identity Diffing, CASE_SHIFT (mid-boss), DOUBLE_TAKE (mid-boss), NUL_SENTINEL (tutorial boss), THE_RECKONING (final boss), lib/affliction-cells.ts, afflictionDom.ts, BossFightScreen.tsx (+29 more)

### Community 4 - "World 1 GSAP Choreography & Typography"
Cohesion: 0.08
Nodes (21): diffFlash.ts (animation), IBM Plex Mono font, Martian Mono font, NUL_SENTINEL boss / w1-01-nul-sentinel case, Positional cell diff algorithm, Accessibility control cluster, Affliction cell rendering (3-signal design), Affliction status palette (CVD-safe) (+13 more)

### Community 5 - "CSP, Hosting & Licensing Policy"
Cohesion: 0.11
Nodes (28): Content Security Policy, CSP connect-src directive, CSP script-src directive, CSP style-src directive, Dataset/content licensing policy, Dependabot, GitHub Pages Hosting, GitHub Pages CSP limitation (+20 more)

### Community 6 - "App Shell, Save System & World Map"
Cohesion: 0.1
Nodes (13): announce(), handleExport(), load(), loadCase(), loadRoster(), emptySaveData(), emptyWorldProgress(), exportSaveAsJson() (+5 more)

### Community 7 - "Content Schema Types & World Roster"
Cohesion: 0.11
Nodes (20): App Component, Case (type), caseSchema, caseStringsSchema, Predicate (type), predicateSchema, Case Schema Validation Test Suite, WinCondition (type) (+12 more)

### Community 8 - "GSAP Animation Playback Functions"
Cohesion: 0.14
Nodes (11): playBossHitRecoil(), playNoProgressFlash(), playReducedRecoil(), playBootSequence(), revealLine(), playDiffFlashBatch(), playHpShatterBatch(), playSegmentShatter() (+3 more)

### Community 9 - "Worker RPC Client (EngineRpcClient)"
Cohesion: 0.14
Nodes (5): EngineRpcClient, generateRequestId(), RpcEngineError, RpcRunError, RpcTimeoutError

### Community 10 - "Pyodide Worker Internals & RPC Tests"
Cohesion: 0.24
Nodes (6): buildOutput(), handleRequest(), initPyodide(), isDestroyable(), serializeDataframe(), FakeTransport

### Community 11 - "PyodideClient Wrapper"
Cohesion: 0.25
Nodes (1): PyodideClient

### Community 13 - "NUL_SENTINEL Dataset Generator"
Cohesion: 0.47
Nodes (3): chooseNullRows(), range(), sampleDistinct()

### Community 17 - "Accessibility State Module (a11y.ts)"
Cohesion: 0.5
Nodes (2): defaultA11y(), loadA11yState()

### Community 18 - "RPC Protocol Message Types"
Cohesion: 0.5
Nodes (4): CancelRequest, RunCodeRequest, RunErrorResponse, RunResultResponse

### Community 19 - "HP Segment Severity Math"
Cohesion: 0.67
Nodes (2): computeHpSegments(), levelForRatio()

### Community 21 - "ASCII Sigil Renderer"
Cohesion: 1.0
Nodes (2): fillCharForRatio(), renderSigil()

### Community 50 - "WorkerRequest Type"
Cohesion: 1.0
Nodes (1): WorkerRequest

### Community 51 - "WorkerResponse Type"
Cohesion: 1.0
Nodes (1): WorkerResponse

### Community 52 - "EngineReadyResponse Type"
Cohesion: 1.0
Nodes (1): EngineReadyResponse

### Community 63 - "Case JSON Content Pipeline"
Cohesion: 1.0
Nodes (1): Case JSON content pipeline

### Community 64 - "CodeMirror 6 Integration"
Cohesion: 1.0
Nodes (1): CodeEditor (CodeMirror 6 component)

### Community 65 - "Brand Favicon"
Cohesion: 1.0
Nodes (1): Data Cleaning Quest Favicon (Terminal Prompt Icon)

## Knowledge Gaps
- **67 isolated node(s):** `Prettier Config`, `PR Template`, `"New Case / Boss Proposal" Issue Template`, `Graphify Structural Report`, `scripts/` (+62 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `PyodideClient Wrapper`** (8 nodes): `pyodide-client.ts`, `PyodideClient`, `.cancel()`, `.initCase()`, `.ready()`, `.run()`, `.spawn()`, `.terminate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Accessibility State Module (a11y.ts)`** (5 nodes): `a11y.ts`, `applyA11yToDocument()`, `defaultA11y()`, `loadA11yState()`, `persistA11yState()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HP Segment Severity Math`** (4 nodes): `hpSegments.ts`, `computeHpSegments()`, `levelForRatio()`, `pickDominantKind()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ASCII Sigil Renderer`** (3 nodes): `sigil.ts`, `fillCharForRatio()`, `renderSigil()`
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

- **Why does `World 1 Visual Spec (Phase 1)` connect `World 1 GSAP Choreography & Typography` to `ADRs, CI, and Core Game-Logic Modules`, `React/Pyodide Foundation & Component Roster`, `World 1 Boss Roster & Row-Identity Diffing`, `CSP, Hosting & Licensing Policy`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `Architecture (docs/ARCHITECTURE.md)` connect `ADRs, CI, and Core Game-Logic Modules` to `React/Pyodide Foundation & Component Roster`, `World 1 Boss Roster & Row-Identity Diffing`, `World 1 GSAP Choreography & Typography`, `CSP, Hosting & Licensing Policy`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `Data Cleaning Quest Master Plan` connect `React/Pyodide Foundation & Component Roster` to `ADRs, CI, and Core Game-Logic Modules`, `CSP, Hosting & Licensing Policy`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `Prettier Config`, `PR Template`, `"New Case / Boss Proposal" Issue Template` to the rest of the system?**
  _67 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ADRs, CI, and Core Game-Logic Modules` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `React/Pyodide Foundation & Component Roster` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Affliction/Diff/Win-Condition Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._