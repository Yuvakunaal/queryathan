# Graph Report - .  (2026-10-05)

## Corpus Check
- Large corpus: 259 files · ~240,210 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 1262 nodes · 1878 edges · 58 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 175 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_CHANGELOG.md (202)|CHANGELOG.md (202)]]
- [[_COMMUNITY_Data Cleaning Quest (71)|Data Cleaning Quest (71)]]
- [[_COMMUNITY_BossFightScreen.tsx (63)|BossFightScreen.tsx (63)]]
- [[_COMMUNITY_pyodide.js (45)|pyodide.js (45)]]
- [[_COMMUNITY_TableCollage.tsx (43)|TableCollage.tsx (43)]]
- [[_COMMUNITY_sqlFunctions.js (39)|sqlFunctions.js (39)]]
- [[_COMMUNITY_pyodide.d.ts (37)|pyodide.d.ts (37)]]
- [[_COMMUNITY_ffi.d.ts (34)|ffi.d.ts (34)]]
- [[_COMMUNITY_afflictions.ts (33)|afflictions.ts (33)]]
- [[_COMMUNITY_World 1 — Boss Fights Visual Spec (32)|World 1 — Boss Fights Visual Spec (32)]]
- [[_COMMUNITY_sandbox.ts (29)|sandbox.ts (29)]]
- [[_COMMUNITY_kit.mjs (26)|kit.mjs (26)]]
- [[_COMMUNITY_sound.ts (26)|sound.ts (26)]]
- [[_COMMUNITY_prefersReducedMotion() (25)|prefersReducedMotion() (25)]]
- [[_COMMUNITY_sqlite.worker.js (21)|sqlite.worker.js (21)]]
- [[_COMMUNITY_save.ts (21)|save.ts (21)]]
- [[_COMMUNITY_caseSchema (20)|caseSchema (20)]]
- [[_COMMUNITY_generate-observatory.mjs (18)|generate-observatory.mjs (18)]]
- [[_COMMUNITY_EngineRpcClient (17)|EngineRpcClient (17)]]
- [[_COMMUNITY_Fight Screen Screenshot (Dark Theme) (15)|Fight Screen Screenshot (Dark Theme) (15)]]
- [[_COMMUNITY_handleRequest() (14)|handleRequest() (14)]]
- [[_COMMUNITY_generate-vault.mjs (12)|generate-vault.mjs (12)]]
- [[_COMMUNITY_generate-twins.mjs (10)|generate-twins.mjs (10)]]
- [[_COMMUNITY_helpers.ts (10)|helpers.ts (10)]]
- [[_COMMUNITY_mysqlType.ts (10)|mysqlType.ts (10)]]
- [[_COMMUNITY_PyodideClient (9)|PyodideClient (9)]]
- [[_COMMUNITY_generate-twins-multi.mjs (9)|generate-twins-multi.mjs (9)]]
- [[_COMMUNITY_scriptsgenerate-labyrinth.mjs (9)|scripts/generate-labyrinth.mjs (9)]]
- [[_COMMUNITY_scriptsgenerate-timekeeper.mjs (9)|scripts/generate-timekeeper.mjs (9)]]
- [[_COMMUNITY_python_cli_entry.mjs (8)|python_cli_entry.mjs (8)]]
- [[_COMMUNITY_scriptsgenerate-observatory.mjs (8)|scripts/generate-observatory.mjs (8)]]
- [[_COMMUNITY_CC0 public domain dedication (synthetic datasets) (8)|CC0 public domain dedication (synthetic datasets) (8)]]
- [[_COMMUNITY_scriptsgenerate-laboratory.mjs (7)|scripts/generate-laboratory.mjs (7)]]
- [[_COMMUNITY_generate-nul-sentinel.mjs (6)|generate-nul-sentinel.mjs (6)]]
- [[_COMMUNITY_scriptsgenerate-vault.mjs (6)|scripts/generate-vault.mjs (6)]]
- [[_COMMUNITY_prepareSql() (5)|prepareSql() (5)]]
- [[_COMMUNITY_csv.js (5)|csv.js (5)]]
- [[_COMMUNITY_contrast.e2e.ts (5)|contrast.e2e.ts (5)]]
- [[_COMMUNITY_scriptsgenerate-twins.mjs (5)|scripts/generate-twins.mjs (5)]]
- [[_COMMUNITY_scriptsgenerate-architect.mjs (5)|scripts/generate-architect.mjs (5)]]
- [[_COMMUNITY_key-1.wav to key-8.wav (5)|key-1.wav to key-8.wav (5)]]
- [[_COMMUNITY_RunCodeRequest (4)|RunCodeRequest (4)]]
- [[_COMMUNITY_hpSegments.ts (4)|hpSegments.ts (4)]]
- [[_COMMUNITY_ariaLabelForAffliction() (4)|ariaLabelForAffliction() (4)]]
- [[_COMMUNITY_inferSqlDtype() (4)|inferSqlDtype() (4)]]
- [[_COMMUNITY_A11yControls() (4)|A11yControls() (4)]]
- [[_COMMUNITY_KillSequence.tsx (4)|KillSequence.tsx (4)]]
- [[_COMMUNITY_sigil.ts (3)|sigil.ts (3)]]
- [[_COMMUNITY_editorTheme.ts (3)|editorTheme.ts (3)]]
- [[_COMMUNITY_SqliteClient (3)|SqliteClient (3)]]
- [[_COMMUNITY_four-corners-.csv (3)|four-corners-*.csv (3)]]
- [[_COMMUNITY_Sound licenses (2)|Sound licenses (2)]]
- [[_COMMUNITY_WorkerRequest (1)|WorkerRequest (1)]]
- [[_COMMUNITY_WorkerResponse (1)|WorkerResponse (1)]]
- [[_COMMUNITY_EngineReadyResponse (1)|EngineReadyResponse (1)]]
- [[_COMMUNITY_Case JSON content pipeline (1)|Case JSON content pipeline (1)]]
- [[_COMMUNITY_CodeEditor (CodeMirror 6 component) (1)|CodeEditor (CodeMirror 6 component) (1)]]
- [[_COMMUNITY_Data Cleaning Quest Favicon (Terminal Prompt Icon) (1)|Data Cleaning Quest Favicon (Terminal Prompt Icon) (1)]]

## God Nodes (most connected - your core abstractions)
1. `Architecture (docs/ARCHITECTURE.md)` - 63 edges
2. `Data Cleaning Quest Master Plan` - 44 edges
3. `World 1 — Boss Fights Visual Spec` - 43 edges
4. `Content Authoring Guide` - 36 edges
5. `SECURITY.md` - 35 edges
6. `World 1 Phase 2 Visual Spec` - 26 edges
7. `handleRun()` - 19 edges
8. `Contributing Guide` - 17 edges
9. `Data Cleaning Quest` - 16 edges
10. `World 1 Dataset Licenses` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Declarative win-condition predicates` --semantically_similar_to--> `Positional cell diff algorithm`  [INFERRED] [semantically similar]
  docs/ARCHITECTURE.md → apps/web/src/lib/diff.ts
- `fetch-pyodide Script` --conceptually_related_to--> `Service Worker (Workbox) Caching`  [INFERRED]
  scripts/fetch-pyodide.mjs → data-cleaning-quest-master-plan.md
- `Declarative win-condition predicates` --semantically_similar_to--> `pandera Validation Framework`  [INFERRED] [semantically similar]
  docs/ARCHITECTURE.md → data-cleaning-quest-master-plan.md
- `ESLint Flat Config` --shares_data_with--> `Husky Pre-commit Hooks`  [INFERRED]
  eslint.config.js → CONTRIBUTING.md
- `Architecture (docs/ARCHITECTURE.md)` --references--> `diffFlash.ts (animation)`  [EXTRACTED]
  docs/ARCHITECTURE.md → apps/web/src/anim/world1/diffFlash.ts

## Hyperedges (group relationships)
- **Multi-Affliction Rendering System** — system_multi_affliction_rendering, code_affliction_cells_ts, code_hp_heatmap, doc_world1_phase2_visual_spec [INFERRED 0.80]
- **Narrow CSP Exceptions for WASM and Runtime Styles** — doc_adr_0005, concept_wasm_unsafe_eval, concept_unsafe_inline_style, file_pyodide_worker_ts, file_editortheme_ts [EXTRACTED 0.90]
- **The nine worlds** — readme_ember_reach, readme_cryptara, readme_geminora, readme_atlas_spire, readme_cinderforge, readme_lumenfield, readme_minos_deep, readme_chronopolis, readme_helix_9 [EXTRACTED 0.95]
- **Contribution flow** — contributing_guide, rfc_template_rfc, call_for_cases_call, content_authoring_guide_guide [INFERRED 0.85]
- **Safe client-only execution** — architecture_execution_model, security_sandboxing, readme_pyodide, readme_sqljs, readme_no_backend [INFERRED 0.80]
- **Synthetic CC0 datasets produced by seeded generator scripts** — licenses_world2_generate_vault, licenses_world4_generate_architect, licenses_world7_generate_labyrinth, licenses_world8_generate_timekeeper, licenses_world9_generate_laboratory, licenses_datasets_cc0 [EXTRACTED 1.00]
- **CC0 sound assets from OpenGameArt** — licenses_sounds_key_wavs, licenses_sounds_slice_wav, licenses_sounds_cc0 [EXTRACTED 1.00]

## Communities

### Community 0 - "CHANGELOG.md (202)"
Cohesion: 0.03
Nodes (193): ADR 0001: Framework (React), ADR 0002: Hosting (Vercel), ADR 0003: Win-Condition Contract, ADR 0004: Pyodide Package Delivery, ADR 0005: CSP, WASM and Inline Styles, ADR 0006: Row Identity Diffing, apps/web, CASE_SHIFT (mid-boss) (+185 more)

### Community 1 - "Data Cleaning Quest (71)"
Cohesion: 0.03
Nodes (71): ADR 0004 Pyodide package delivery, ADR 0006 Stable row identity diffing, diffGrids (lib/diff.ts), __dcq_row_id__ hidden column (removed), Worker-side row identity state, Content pipeline, Deployment, Dual-engine selection (+63 more)

### Community 2 - "BossFightScreen.tsx (63)"
Cohesion: 0.06
Nodes (46): BlueprintBand(), bootReadout(), pad(), announcePolite(), answerNoteFor(), answerOffer(), boot(), defaultA11y() (+38 more)

### Community 3 - "pyodide.js (45)"
Cohesion: 0.12
Nodes (39): read(), A(), Ae(), B(), be(), C(), ce(), De() (+31 more)

### Community 4 - "TableCollage.tsx (43)"
Cohesion: 0.06
Nodes (27): clampSplit(), swapOrder(), commitSplit(), onKeyDown(), onPointerMove(), onPointerUp(), paneUnder(), readSplit() (+19 more)

### Community 5 - "sqlFunctions.js (39)"
Cohesion: 0.16
Nodes (37): addPair(), covarianceOf(), dateAdd(), dateDiffUnits(), dateFormat(), datePart(), dateTrunc(), dayOfWeekSun0() (+29 more)

### Community 6 - "pyodide.d.ts (37)"
Cohesion: 0.05
Nodes (36): PackageManager, PyAsyncGenerator, PyAsyncGeneratorMethods, PyAsyncIterable, PyAsyncIterableMethods, PyAsyncIterator, PyAsyncIteratorMethods, PyAwaitable (+28 more)

### Community 7 - "ffi.d.ts (34)"
Cohesion: 0.06
Nodes (33): PyAsyncGenerator, PyAsyncGeneratorMethods, PyAsyncIterable, PyAsyncIterableMethods, PyAsyncIterator, PyAsyncIteratorMethods, PyAwaitable, PyBuffer (+25 more)

### Community 8 - "afflictions.ts (33)"
Cohesion: 0.13
Nodes (28): describePredicate(), predicateDebt(), rowIndicesForPredicate(), answerDebt(), casingRowIndices(), columnSum(), columnSumMatches(), compareAnswer() (+20 more)

### Community 9 - "World 1 — Boss Fights Visual Spec (32)"
Cohesion: 0.08
Nodes (20): diffFlash.ts (animation), IBM Plex Mono font, Martian Mono font, NUL_SENTINEL boss / w1-01-nul-sentinel case, Accessibility control cluster, Affliction cell rendering (3-signal design), Affliction status palette (CVD-safe), ASCII-block decaying boss sigil (+12 more)

### Community 10 - "sandbox.ts (29)"
Cohesion: 0.09
Nodes (21): downloadCsv(), SandboxBriefing(), accept(), addExtra(), handleDrop(), readFile(), allColumnHints(), buildSandboxCase() (+13 more)

### Community 11 - "kit.mjs (26)"
Cohesion: 0.09
Nodes (7): createWorld(), dateStr(), mulberry32(), pad(), stampStr(), mean(), sampleVar()

### Community 12 - "sound.ts (26)"
Cohesion: 0.15
Nodes (18): handleKeydown(), getContext(), getNoise(), getOutput(), getReverb(), glide(), noiseBurst(), playCue() (+10 more)

### Community 13 - "prefersReducedMotion() (25)"
Cohesion: 0.11
Nodes (14): playBossHitRecoil(), playNoProgressFlash(), playReducedRecoil(), tokenColor(), playBootSequence(), revealLine(), playDiffFlashBatch(), playEngineSelectReveal() (+6 more)

### Community 14 - "sqlite.worker.js (21)"
Cohesion: 0.2
Nodes (13): buildOutput(), buildOutputTable(), compile(), handleRequest(), isScalar(), loadCsvIntoTable(), loadGeneratedIntoTable(), quoteIdentifier() (+5 more)

### Community 15 - "save.ts (21)"
Cohesion: 0.12
Nodes (13): announce(), handleExport(), load(), betterStamp(), budgetMs(), stampFor(), loadRoster(), emptySaveData() (+5 more)

### Community 16 - "caseSchema (20)"
Cohesion: 0.11
Nodes (20): App Component, Case (type), caseSchema, caseStringsSchema, Predicate (type), predicateSchema, Case Schema Validation Test Suite, WinCondition (type) (+12 more)

### Community 17 - "generate-observatory.mjs (18)"
Cohesion: 0.16
Nodes (8): dateStr(), int(), mark(), nextMonth(), pad(), stampStr(), toCsv(), writeCsv()

### Community 18 - "EngineRpcClient (17)"
Cohesion: 0.14
Nodes (5): EngineRpcClient, generateRequestId(), RpcEngineError, RpcRunError, RpcTimeoutError

### Community 19 - "Fight Screen Screenshot (Dark Theme) (15)"
Cohesion: 0.24
Nodes (15): ANIM Toggle (flight and killing animation), Answer HUD (column checks and rows correct counter), Case Briefing Panel (task, boss badge, skill, result-table note), Data Grid with Result Tabs, Rocket Travel Sequence (warp flight to landing), SQL Query Editor with Run Button, Dark and Light Theme Switch, Top Toolbar Controls (font size, theme, CRT, SFX, ANIM, HC) (+7 more)

### Community 20 - "handleRequest() (14)"
Cohesion: 0.26
Nodes (9): buildOutput(), fetchText(), handleRequest(), initPyodide(), isDestroyable(), serializeDataframe(), column(), generatedValue() (+1 more)

### Community 21 - "generate-vault.mjs (12)"
Cohesion: 0.24
Nodes (7): garble(), int(), maybeGarble(), messyEmail(), messyPhone(), phoneParts(), pick()

### Community 22 - "generate-twins.mjs (10)"
Cohesion: 0.22
Nodes (2): int(), messKey()

### Community 23 - "helpers.ts (10)"
Cohesion: 0.27
Nodes (5): openCase(), rosterOf(), seed(), titleOf(), openSandbox()

### Community 24 - "mysqlType.ts (10)"
Cohesion: 0.27
Nodes (5): columnTipsFor(), describeColumn(), inferFromValues(), intType(), type()

### Community 25 - "PyodideClient (9)"
Cohesion: 0.22
Nodes (1): PyodideClient

### Community 26 - "generate-twins-multi.mjs (9)"
Cohesion: 0.25
Nodes (2): toCsv(), writeCsv()

### Community 27 - "scripts/generate-labyrinth.mjs (9)"
Cohesion: 0.28
Nodes (9): bom.csv, customers.csv (world 7), employees.csv, scripts/generate-labyrinth.mjs, list-a.csv, list-b.csv, logins.csv, orders.csv (world 7) (+1 more)

### Community 28 - "scripts/generate-timekeeper.mjs (9)"
Cohesion: 0.28
Nodes (9): bookings.csv, events.csv, scripts/generate-timekeeper.mjs, price-history.csv, price-orders.csv, shipments.csv, sparse-sales.csv, store-offsets.csv (+1 more)

### Community 29 - "python_cli_entry.mjs (8)"
Cohesion: 0.46
Nodes (7): calculateSysPath(), dirsToMount(), escapeWindowsPath(), fsInit(), main(), patchPlatformForUv(), windowsPathToUnix()

### Community 30 - "scripts/generate-observatory.mjs (8)"
Cohesion: 0.32
Nodes (8): activity.csv, daily-sales.csv, scripts/generate-observatory.mjs, orders.csv (world 6), products.csv (world 6), shop-events.csv, users.csv, web-events.csv

### Community 31 - "CC0 public domain dedication (synthetic datasets) (8)"
Cohesion: 0.25
Nodes (8): CC0 public domain dedication (synthetic datasets), World 2 dataset licenses, World 3 dataset licenses, World 4 dataset licenses, World 6 dataset licenses, World 7 dataset licenses, World 8 dataset licenses, World 9 dataset licenses

### Community 34 - "scripts/generate-laboratory.mjs (7)"
Cohesion: 0.29
Nodes (7): blood-pressure.csv, customers-by-age.csv, dose-response.csv, experiment.csv, scripts/generate-laboratory.mjs, measurements.csv, sensor-readings.csv

### Community 35 - "generate-nul-sentinel.mjs (6)"
Cohesion: 0.47
Nodes (3): chooseNullRows(), range(), sampleDistinct()

### Community 38 - "scripts/generate-vault.mjs (6)"
Cohesion: 0.33
Nodes (6): scripts/generate-vault.mjs, host-lock.csv, latin-lock.csv, pin-tumbler.csv, serial-lock.csv, warden.csv

### Community 41 - "prepareSql() (5)"
Cohesion: 0.8
Nodes (3): dialectFriendly(), prepareSql(), replaceableResult()

### Community 42 - "csv.js (5)"
Cohesion: 0.6
Nodes (3): coerceCsvValue(), inferColumnTypes(), parseCsv()

### Community 43 - "contrast.e2e.ts (5)"
Cohesion: 0.6
Nodes (3): luminance(), ratio(), toRgb()

### Community 44 - "scripts/generate-twins.mjs (5)"
Cohesion: 0.4
Nodes (5): double-vision case (orders and customers csv), scripts/generate-twins.mjs, ghost-twin case (orders and customers csv), key-mirror case (orders and customers csv), the-twins case (orders and customers csv)

### Community 45 - "scripts/generate-architect.mjs (5)"
Cohesion: 0.6
Nodes (5): scripts/generate-architect.mjs, json-vault.csv, melt-form.csv, pivot-plan.csv, the-architect.csv

### Community 46 - "key-1.wav to key-8.wav (5)"
Cohesion: 0.5
Nodes (5): CC0 (sounds), key-1.wav to key-8.wav, Keyboard Soundpack #1 by Unicae Games (OpenGameArt), slice-1.wav, 20 sword sound effects by StarNinjas (OpenGameArt)

### Community 48 - "RunCodeRequest (4)"
Cohesion: 0.5
Nodes (4): CancelRequest, RunCodeRequest, RunErrorResponse, RunResultResponse

### Community 49 - "hpSegments.ts (4)"
Cohesion: 0.67
Nodes (2): computeHpSegments(), levelForRatio()

### Community 50 - "ariaLabelForAffliction() (4)"
Cohesion: 0.5
Nodes (2): ariaLabelForAffliction(), formatCellValue()

### Community 51 - "inferSqlDtype() (4)"
Cohesion: 0.83
Nodes (2): inferSqlDtype(), inferSqlDtypes()

### Community 52 - "A11yControls() (4)"
Cohesion: 0.5
Nodes (2): A11yControls(), useTips()

### Community 53 - "KillSequence.tsx (4)"
Cohesion: 0.67
Nodes (2): finish(), onKey()

### Community 54 - "sigil.ts (3)"
Cohesion: 1.0
Nodes (2): fillCharForRatio(), renderSigil()

### Community 55 - "editorTheme.ts (3)"
Cohesion: 1.0
Nodes (2): bossFightsEditorExtensions(), buildEditorTheme()

### Community 70 - "SqliteClient (3)"
Cohesion: 0.67
Nodes (1): SqliteClient

### Community 73 - "four-corners-*.csv (3)"
Cohesion: 1.0
Nodes (3): four-corners-*.csv, scripts/generate-twins-multi.mjs, three-way-*.csv

### Community 116 - "Sound licenses (2)"
Cohesion: 1.0
Nodes (2): Sound licenses, src/lib/sound.ts (synthesized tones)

### Community 128 - "WorkerRequest (1)"
Cohesion: 1.0
Nodes (1): WorkerRequest

### Community 129 - "WorkerResponse (1)"
Cohesion: 1.0
Nodes (1): WorkerResponse

### Community 130 - "EngineReadyResponse (1)"
Cohesion: 1.0
Nodes (1): EngineReadyResponse

### Community 138 - "Case JSON content pipeline (1)"
Cohesion: 1.0
Nodes (1): Case JSON content pipeline

### Community 139 - "CodeEditor (CodeMirror 6 component) (1)"
Cohesion: 1.0
Nodes (1): CodeEditor (CodeMirror 6 component)

### Community 140 - "Data Cleaning Quest Favicon (Terminal Prompt Icon) (1)"
Cohesion: 1.0
Nodes (1): Data Cleaning Quest Favicon (Terminal Prompt Icon)

## Knowledge Gaps
- **213 isolated node(s):** `Prettier Config`, `PR Template`, `"New Case / Boss Proposal" Issue Template`, `Graphify Structural Report`, `scripts/` (+208 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `generate-twins.mjs (10)`** (10 nodes): `csvCell()`, `id()`, `int()`, `makeCustomers()`, `makeOrders()`, `messKey()`, `generate-twins.mjs`, `mulberry32()`, `pick()`, `toCsv()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PyodideClient (9)`** (9 nodes): `pyodide-client.ts`, `PyodideClient`, `.cancel()`, `.createWorker()`, `.initCase()`, `.ready()`, `.run()`, `.spawn()`, `.terminate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `generate-twins-multi.mjs (9)`** (9 nodes): `csvCell()`, `hint()`, `int()`, `generate-twins-multi.mjs`, `mulberry32()`, `pick()`, `round2()`, `toCsv()`, `writeCsv()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `hpSegments.ts (4)`** (4 nodes): `hpSegments.ts`, `computeHpSegments()`, `levelForRatio()`, `pickDominantKind()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ariaLabelForAffliction() (4)`** (4 nodes): `afflictionPresentation.ts`, `formatCellValue.ts`, `ariaLabelForAffliction()`, `formatCellValue()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `inferSqlDtype() (4)`** (4 nodes): `sql-dtypes.js`, `sql-dtypes.ts`, `inferSqlDtype()`, `inferSqlDtypes()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `A11yControls() (4)`** (4 nodes): `TipsContext.ts`, `A11yControls.tsx`, `A11yControls()`, `useTips()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `KillSequence.tsx (4)`** (4 nodes): `KillSequence.tsx`, `finish()`, `onKey()`, `pointOnCut()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `sigil.ts (3)`** (3 nodes): `sigil.ts`, `fillCharForRatio()`, `renderSigil()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `editorTheme.ts (3)`** (3 nodes): `editorTheme.ts`, `bossFightsEditorExtensions()`, `buildEditorTheme()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SqliteClient (3)`** (3 nodes): `sqlite-client.ts`, `SqliteClient`, `.createWorker()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sound licenses (2)`** (2 nodes): `Sound licenses`, `src/lib/sound.ts (synthesized tones)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `WorkerRequest (1)`** (1 nodes): `WorkerRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `WorkerResponse (1)`** (1 nodes): `WorkerResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `EngineReadyResponse (1)`** (1 nodes): `EngineReadyResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Case JSON content pipeline (1)`** (1 nodes): `Case JSON content pipeline`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CodeEditor (CodeMirror 6 component) (1)`** (1 nodes): `CodeEditor (CodeMirror 6 component)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Data Cleaning Quest Favicon (Terminal Prompt Icon) (1)`** (1 nodes): `Data Cleaning Quest Favicon (Terminal Prompt Icon)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `World 1 — Boss Fights Visual Spec` connect `World 1 — Boss Fights Visual Spec (32)` to `CHANGELOG.md (202)`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `handleRun()` connect `BossFightScreen.tsx (63)` to `afflictions.ts (33)`, `sound.ts (26)`, `save.ts (21)`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `Architecture (docs/ARCHITECTURE.md)` connect `CHANGELOG.md (202)` to `World 1 — Boss Fights Visual Spec (32)`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `Prettier Config`, `PR Template`, `"New Case / Boss Proposal" Issue Template` to the rest of the system?**
  _213 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CHANGELOG.md (202)` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Data Cleaning Quest (71)` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `BossFightScreen.tsx (63)` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._