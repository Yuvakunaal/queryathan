# Data Cleaning Quest — Master Plan
### A no-login, open-source, gamified platform for learning real Python + SQL data cleaning — from first-timers to working seniors

---

## 1. Vision & who this is actually for

A single-page, zero-backend, zero-login web platform where anyone can learn **real** Python (pandas) and **real** SQL data cleaning by playing through five visually distinct "worlds," each teaching a category of data work through a mechanic that matches how that skill actually feels to use.

Not a quiz app. Not multiple choice. **Users write real code, run it against a real in-browser engine, and watch real data respond.** The game is a skin around a real notebook, not a replacement for one.

**The one-line pitch:** "Fight your data clean." Every method you'd use in a Jupyter notebook or a database client becomes an action with visible, immediate, satisfying consequence.

### Audience segmentation — this matters for content design, not just marketing
| Segment | What they need | What makes them say "wow" |
|---|---|---|
| **Complete beginner** | Syntax, confidence, a reason to keep going | Instant visible feedback — code they typed literally changing something on screen |
| **Bootcamp/student, mid-learning** | Structured progression, real messy data (not toy datasets) | Boss fights that feel genuinely hard, real Kaggle-grade final bosses |
| **Working analyst, upskilling** | Fill specific gaps (window functions, joins, reshaping) fast | Jump straight into any world without a forced linear path; sandbox mode with their own data |
| **Already-employed engineer/analyst** | Refresher, interview prep, portfolio artifact | Shareable capstone results (a diff history/case report they can screenshot or link on LinkedIn) |
| **Senior / staff-level industry person** | Something that respects their intelligence — not "learn SELECT" | **World 5: The Foundry** (below) — performance, production-grade validation, and content that makes them think "I didn't know this existed as a learning tool" |

Designing for the full spectrum is what turns this from "a beginner toy" into something a senior engineer bookmarks and recommends to their team.

---

## 2. Design philosophy — how this avoids looking "AI-generated" or generic

Generic AI-made sites share a fingerprint: centered hero + gradient blob + rounded card grid + default sans font + soft drop shadows + stock imagery. We deliberately avoid every one of those defaults.

- **No hero-section-with-gradient-blob.** The homepage IS the world map — a literal illustrated overworld you navigate, not a marketing page with a "Get Started" button.
- **No default UI-library look** (no shadcn-blue, no Tailwind-default rounded-xl-shadow-md cards). Each world gets a hand-tuned visual language (Section 4) — flat colors, deliberate borders, no soft ambient shadows.
- **No stock photography, no generic 3D blob mascots.** Visuals are either genuinely functional (the real dataframe, real syntax-highlighted code) or flat geometric/pixel-art assets consistent with each world's chosen aesthetic.
- **No system-default sans font as the primary display face.** Pick 1–2 distinctive typefaces and commit everywhere.
- **Motion has personality, not just "fade in on scroll."** Boss hits recoil in a specific arc, HP bars shatter rather than smoothly drain, terminal text can type itself out.
- **Sound (optional, muteable)** — a genre most gamified-learning platforms skip. Even minimal 8-bit SFX massively changes how alive an interface feels.

### Real inspiration sources to actually use (not reinvent from scratch)
| Resource | What to look for |
|---|---|
| **Awwwards.com** | "Developer" and "Games" categories specifically |
| **Godly.website** | Bold, non-corporate visual work |
| **SiteInspire.com** | Calmer editorial reference for settings/world-select screens |
| **Codrops (tympanus.net/codrops)** | Real open-source code for glitch effects, terminal-typing effects, canvas particle systems |
| **Dribbble** — search "pixel art UI," "terminal UI," "game HUD" | Concrete visual references matching Section 4's aesthetics |
| **itch.io game pages** | Indie game UI/UX — a far better reference than corporate SaaS design for this project |
| **GSAP (greensock.com) showcase** | The animation library to actually use — free, framework-agnostic, extremely performant |

---

## 3. Do users write code or click buttons?

**Real code and real queries — always. Non-negotiable.**

- Users type actual pandas (`.fillna()`, `.merge()`...) or actual SQL (`COALESCE`, `JOIN`...) into a real syntax-highlighted editor.
- It runs against a **real Python engine (Pyodide, WASM)** or a **real SQL engine (sql.js, WASM)** — never a simulated interpreter.
- Syntax errors show the **real Python/SQL error message**, exactly as a real notebook would. Reading and fixing that error is itself part of the lesson.
- The game only evaluates the *result* of their code (did the affliction actually clear?) — never a pre-set "correct button."

Everything learned here transfers 1:1 to a real job on day one — this is the whole credibility of the product.

---

## 4. The five worlds — full content + distinct visual identity

### World 1 — Boss Fights (single-table cleaning)
**Covers:** nulls, duplicates, casing/whitespace, dtypes, outliers, date parsing.
**Mechanic:** turn-based combat; the dataframe itself is the battlefield (Section 5).
| Problem | pandas | SQL |
|---|---|---|
| Missing values | `.fillna()` `.dropna()` `.interpolate()` | `COALESCE` `IS NULL` |
| Duplicates | `.drop_duplicates()` | `DISTINCT` / `GROUP BY` |
| Casing/whitespace | `.str.strip()` `.str.lower()` | `TRIM` `LOWER()` |
| Wrong dtypes | `.astype()` `pd.to_numeric()` | `CAST` `CONVERT` |
| Outliers | `.clip()`, filters | `WHERE` range checks |
| Bad dates | `pd.to_datetime()` | `TO_DATE` |
**Visual identity:** terminal/hacker aesthetic — monospace, phosphor green/amber on black, optional CRT scanlines, ASCII-block boss art.

### World 2 — The Vault (pattern extraction)
**Covers:** regex extraction, encoding fixes.
**Mechanic:** safe-cracking — regex either opens the lock or it doesn't; tumblers visually align as your pattern gets closer.
**Content:** `str.extract()`, `str.contains()`, `re`, SQL `REGEXP`/`LIKE`/`SUBSTRING`; UTF-8 vs Latin-1 mojibake as a cipher sub-puzzle.
**Visual identity:** heist aesthetic — navy/brass palette, animated combination-lock dial.

### World 3 — The Twins (relational/multi-table)
**Covers:** joins, key mismatches, fuzzy matching.
**Mechanic:** tag-team boss — two linked bosses only take damage when correctly connected.
**Content:** `.merge()` join types, SQL `JOIN` types, missing/duplicate keys, fuzzy matching.
**Visual identity:** mirror/symmetry — split-screen tables, connecting lines snap taut on correct joins, spark red on cartesian-product mistakes.

### World 4 — The Architect (structural reshaping)
**Covers:** pivoting, melting, nested/JSON data.
**Mechanic:** shape-shifting boss that continuously changes form; you reshape data to match it.
**Content:** `.pivot()` `.melt()` `pd.json_normalize()`, SQL conditional aggregation, `JSONB` unwrapping.
**Visual identity:** architectural blueprint — isometric grid, blueprint-blue background, wireframe polyhedron boss.

### World 5 — The Foundry (production-grade & performance) — for working professionals & seniors
This is the world that makes an already-employed engineer stop and say "I didn't expect this here." It moves past "is the code correct" into "is the code production-grade" — the gap between junior and senior work.

**Mechanic:** a forge/crafting system. You're not fighting a boss's HP — you're forging a "tool" (your code) that must pass a **stress test** under real constraints: a time budget, a memory budget, or a correctness-under-scale test against a much larger hidden dataset. A live benchmark readout shows your runtime next to a reference solution — beating it is the "win," not just getting the right answer.

**Content covered:**
- Vectorization vs. `.apply()`/loops — visually racing a vectorized solution against a loop-based one on a 1M-row dataset
- Chunked processing for datasets too large to fit in memory (`pd.read_csv(chunksize=...)`)
- Query optimization & indexing — SQL `EXPLAIN`/query plans, why an unindexed `WHERE` is slow, composite indexes
- Data validation frameworks — writing schema/contract checks with `pandera` (Python) or SQL `CHECK` constraints, framed as "building fences against future mess" rather than fighting current mess
- Memory profiling and dtype optimization (`category` dtype, downcasting numerics)
- Window functions at scale — `ROW_NUMBER`, `RANK`, `LAG`/`LEAD`, and where they outperform self-joins

**Visual identity:** industrial forge aesthetic — dark charcoal + molten-orange palette, an anvil/gauge HUD showing live runtime/memory readouts as your code executes, a "quality stamp" (bronze/silver/gold) awarded based on how close you get to the optimized reference solution, not just correctness.

**Also unlocks:** "Bring your own dataset" sandbox mode (Section 6) — genuinely useful for a working professional prepping for a real task or interview, not just a locked-in tutorial track.

---

## 5. Signature UI concept — "the dataframe IS the battlefield"

- **No separate cartoon monster sprite.** The actual data grid is the boss.
- Afflicted cells visibly pulse/flicker with a status-color overlay directly on real values.
- The "HP bar" is a literal live count of afflicted cells, rendered as a heatmap strip above the grid.
- Correct code makes the **actual rows animate and change** — a duplicate visibly merges away, a null visibly fills — with a **git-diff-style red/green flash** showing exactly what changed.

No abstraction gap between "the game" and "the real skill" — what's exciting on screen is literally what real pandas/SQL output looks like. Reading diffs is itself a transferable real-world skill.

---

## 6. Progression, sandbox mode & portfolio value

- **Local save file** in `localStorage` + "download/import save" JSON — no login, still persistent and portable across devices.
- **XP + ranks per world**, tied to technique mastered, not just levels cleared.
- **Difficulty scales by stacking afflictions** (1 → 2–3 simultaneous), forcing correct real-world sequencing.
- **World-final bosses** are real, messy, Kaggle-grade datasets — no hints, one shot.
- **Shareable rank card / case report** — an exportable image or static HTML page showing the commands used and the before/after diff, screenshot-worthy for a resume or LinkedIn post. No server-verified leaderboard needed to make this valuable.
- **Sandbox / freeplay mode** (unlocked after World 1): upload your own CSV, or paste your own schema, and fight *your own* messy dataset in the same battlefield UI. This is the feature that turns "a learning toy" into "a tool I keep coming back to" for people who already have a job — genuinely useful for real interview prep or exploring a real dataset before writing a real notebook.

---

## 7. Tech stack & architecture (100% static, zero backend)

| Layer | Choice | Why |
|---|---|---|
| Framework | React or Svelte (TypeScript, strict mode) | Svelte compiles to near-vanilla JS (snappier); React if prioritizing contributor familiarity for open source |
| Python engine | **Pyodide** (WASM), run inside a **dedicated Web Worker** | Keeps heavy computation off the main thread so animations/UI never freeze — critical for the "smooth" requirement |
| SQL engine | **sql.js** or **wa-sqlite** (WASM), also worker-isolated | Same isolation reasoning |
| Code editor | **CodeMirror 6** | Lighter/faster than Monaco, real syntax highlighting + real error surfacing |
| Animation | **GSAP** | Boss-hit recoil, HP-bar break, diff-flash — industry standard, framework-agnostic |
| State/progress | `localStorage` + exportable JSON | No login, still durable |
| Offline support | **Service Worker (Workbox)** + Cache API for the Pyodide/sql.js WASM binaries | First load costs a few MB; every visit after that is instant and works offline |
| Build tool | **Vite** | Fast dev loop, handles WASM assets cleanly, native code-splitting |
| Hosting | GitHub Pages / Netlify / Cloudflare Pages (static) | Free, zero maintenance, instantly forkable |

**Why a Web Worker matters here specifically:** without it, a slow pandas operation on a big "final boss" dataset would freeze the whole UI — no animation, no responsiveness — exactly the "disturbed/janky" feeling the brief explicitly wants to avoid. Isolating execution in a worker keeps the interface buttery regardless of how heavy the underlying computation is.

---

## 8. Security & privacy — even a "no backend" site needs this taken seriously

A common founder mistake is assuming "no backend" means "no security work." Not true here — we're literally executing arbitrary user-typed code in a browser. That needs deliberate sandboxing.

### Code execution sandboxing
- Run Pyodide/sql.js **inside a Web Worker**, not the main thread — a worker has no direct access to the DOM, cookies, or `localStorage` of the main page by default.
- Where extra isolation is warranted (e.g. sandbox/freeplay mode with user-uploaded files), run the worker inside a **sandboxed, cross-origin `<iframe>`** with a strict `sandbox` attribute (no `allow-same-origin` + no `allow-top-navigation`) so even a worst-case malicious payload in a user's own uploaded file can't reach the parent page, its save data, or any other origin.
- Never use `eval()` or `new Function()` on untrusted content outside that sandboxed context.

### Content Security Policy & supply chain
- Strict CSP headers: `script-src 'self' <pinned CDN origins>`, no inline scripts, no `unsafe-eval` on the main thread.
- **Subresource Integrity (SRI)** hashes on every CDN-loaded script (GSAP, any font/library CDN).
- Pin exact versions of Pyodide/sql.js — never load `@latest` — and track upstream CVEs via **Dependabot/Snyk** on the repo.
- No third-party analytics scripts by default (see below) — every third-party script is a supply-chain risk surface, and the fewer there are, the smaller that surface.

### Privacy by design
- Zero accounts means zero PII collected by default — genuinely privacy-respecting, not just marketing language.
- If analytics are added later, use a **privacy-first, cookieless, self-hostable option** (e.g. Plausible or Umami) rather than anything that fingerprints users — and make it opt-in/clearly disclosed, not silent.
- User-uploaded datasets in sandbox mode **never leave the browser** — processing happens entirely client-side in the worker; explicitly document this so privacy-conscious users (and their employers' data policies) can trust it with real work data.

### Data/content licensing hygiene
- Every seed dataset shipped with the platform must be **explicitly open-licensed** (CC0, public-domain government data, or purpose-built synthetic data) — verify and document the license per dataset in `content/cases/*.json` metadata. Never scrape or embed data with unclear provenance.
- Synthetic data generation (e.g. Faker-style libraries) preferred over real scraped data specifically to avoid embedding real people's PII in "messy dataset" bosses.

---

## 9. Engineering practices — building this like a real product, not a demo

### Repository structure (monorepo — large is fine, organization matters more than size)
```
data-cleaning-quest/
├── apps/
│   └── web/                        # the main Vite app
│       ├── src/
│       │   ├── engines/
│       │   │   ├── pyodide-worker.ts
│       │   │   └── sqljs-worker.ts
│       │   ├── worlds/
│       │   │   ├── boss-fights/
│       │   │   ├── the-vault/
│       │   │   ├── the-twins/
│       │   │   ├── the-architect/
│       │   │   └── the-foundry/
│       │   ├── components/
│       │   │   ├── DataframeBattlefield.tsx
│       │   │   ├── DiffView.tsx
│       │   │   ├── CodeEditor.tsx
│       │   │   ├── WorldMap.tsx
│       │   │   └── BenchmarkHUD.tsx    # Foundry-specific
│       │   ├── state/
│       │   │   └── save-system.ts
│       │   └── sandbox/
│       │       └── upload-runner.ts    # bring-your-own-dataset mode
│       ├── public/
│       │   └── datasets/               # seed CSV/SQLite files, license-tagged
│       └── vite.config.ts
├── packages/
│   ├── content-schema/                 # shared TS types + JSON schema for "case" content
│   ├── ui-kit/                         # shared design-system components (buttons, HUD pieces)
│   └── engine-adapters/                # shared wrappers around Pyodide/sql.js calls
├── content/
│   └── cases/                          # community-contributable boss/case definitions (JSON)
│       ├── world-1/
│       ├── world-2/
│       ├── world-3/
│       ├── world-4/
│       └── world-5/
├── docs/
│   ├── CONTRIBUTING.md
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   └── content-authoring-guide.md      # how anyone can submit a new boss/case
├── .github/
│   └── workflows/
│       ├── ci.yml                      # lint, typecheck, unit tests, build
│       ├── e2e.yml                     # Playwright end-to-end tests
│       └── lighthouse.yml              # performance budget check on every PR
├── LICENSE                             # MIT
└── package.json                        # pnpm workspaces
```

### Code quality gates
- **TypeScript strict mode** everywhere, no `any` without an explicit justification comment.
- **ESLint + Prettier**, enforced via **Husky** pre-commit hooks so bad formatting/lint errors never reach CI.
- **Vitest** for unit tests (game-logic, diff computation, save-system serialization).
- **Playwright** for end-to-end tests (a real boss fight played start-to-finish in CI, headless).
- **GitHub Actions CI** on every PR: typecheck → lint → unit tests → build → Lighthouse performance budget check. Nothing merges red.

### Content as data, not code
Every boss/case/puzzle is a JSON file conforming to a shared TypeScript schema (`packages/content-schema`), not hardcoded logic. This is what makes "massive open-source project" actually achievable — contributors can add a new boss by writing a JSON file + a seed dataset, without touching engine code or understanding the Pyodide/worker internals at all. Document this clearly in `content-authoring-guide.md`.

---

## 10. Performance & efficiency budget (the "smooth, nice, never disturbed" requirement)

- **Lazy-load Pyodide/sql.js only when a relevant world is entered** — don't pay the multi-MB WASM cost on the landing page/world-map screen.
- **Route-level code-splitting per world** via Vite — visiting World 1 shouldn't download World 4's blueprint assets.
- **Cache the WASM binaries via the Service Worker/Cache API** — first visit costs a few seconds, every visit after is near-instant and works offline.
- **Lighthouse CI performance budget enforced in the pipeline** (e.g. fail the build if Time-to-Interactive on the world map regresses past a set threshold) — performance is a merge-blocking requirement, not an afterthought.
- **All animation via GSAP/CSS transforms**, never layout-thrashing JS — keeps boss-hit and diff-flash animations at 60fps even on modest hardware.
- **Web Worker isolation** (Section 7) ensures a heavy "final boss" computation never blocks the UI thread — this is the single biggest lever for "never feels disturbed."

---

## 11. Accessibility & inclusivity

- **Color-blind-safe status palette** for affliction indicators — never rely on red/green alone; pair color with icon/pattern.
- **Full keyboard navigation** — world map, code editor, and battle actions all operable without a mouse.
- **Screen-reader support** — meaningful `aria-label`s on HUD elements, diff-view changes announced via `aria-live` regions.
- **Reduced-motion mode** — respects `prefers-reduced-motion`; boss-hit recoils and screen-shake become simple fades instead.
- **Font-size and contrast controls** independent of the terminal/CRT aesthetic — the retro look must not compromise legibility for low-vision users.
- **Content localization-ready** — case JSON schema (Section 9) separates display strings from logic from day one, so community translations are structurally possible later without an engine rewrite.

---

## 12. Open-source governance & sustainability

- **License:** MIT — maximizes forkability and enterprise/team adoption (some companies avoid GPL-licensed internal tools).
- **`CONTRIBUTING.md`** with a clear, low-friction path: "add a new case" requires only a JSON file + dataset, no engine knowledge.
- **RFC process** for anything touching core architecture (new world, new engine, breaking schema change) — lightweight (a GitHub Discussion template), not bureaucratic.
- **`CODE_OF_CONDUCT.md`** — standard, matters for a project hoping to attract volunteer contributors long-term.
- **Sustainability, while staying free at the core:** the base platform must never require login or payment — that's a stated non-negotiable. Optional, clearly-separated revenue paths that don't compromise that:
  - GitHub Sponsors / Open Collective for the maintainer(s)
  - An entirely optional, opt-in cloud-sync account (for people who want cross-device save sync) — never required, never gates any world/content
  - Sponsored "dataset packs" from companies wanting to showcase realistic (anonymized/synthetic) industry data as an advanced Foundry case
- Think of this the way freeCodeCamp and SQLNoir sustain themselves — open core, optional non-blocking extras.

---

## 13. Explicitly out of scope for v1 (needs a backend later — don't scope-creep these in)

- AI-generated procedural cases (infinite replayability) — needs an LLM API
- "Courtroom trial" statistical-reasoning mode with an AI cross-examiner — needs an LLM API
- Real-time multiplayer co-op pipeline mode — needs a relay/session server
- A trustworthy global leaderboard — needs server-side score validation
- Cloud save sync — needs, at minimum, a lightweight auth+storage backend (kept explicitly optional per Section 12)

---

## 14. Build roadmap

**Phase 1 — Prove the core loop.** World 1 only: Pyodide-in-worker wired up, one tutorial boss (nulls-only), dataframe-as-battlefield UI, diff-view feedback. Ship as a playable static site before anything else.

**Phase 2 — Full World 1.** Mid-bosses (stacked afflictions), Kaggle-style final boss, localStorage save system, XP/rank tracking.

**Phase 3 — Dual-engine World 1.** Same bosses solvable in pandas or SQL — reinforces translating between the two.

**Phase 4 — World 2 (The Vault).** New mechanic, new visual language, regex/extraction content.

**Phase 5 — Worlds 3 & 4.** The Twins (joins) and The Architect (reshaping), each fully distinct per Section 4.

**Phase 6 — World 5 (The Foundry) + sandbox mode.** Performance/benchmark HUD, validation-framework content, bring-your-own-dataset sandbox — this is the phase that earns the senior-engineer "wow."

**Phase 7 — Engineering hardening.** Full CI/CD pipeline, Playwright E2E suite, Lighthouse performance budgets, security review (CSP/SRI/sandboxing audit), accessibility audit.

**Phase 8 — Open-source launch.** `CONTRIBUTING.md`, content-authoring guide, RFC template, public roadmap board, first call for community-submitted cases.

**Phase 9 — Polish & sustain.** Sound design, shareable rank cards, GitHub Sponsors setup, optional opt-in cloud sync, ongoing content packs.

---

## 15. Core principles to protect at every step

1. **Real code, real engines, real errors — never fake or simulated.**
2. **No backend for the core experience, ever** — anything that needs one goes in Section 13, not the roadmap.
3. **No login, ever, for the core experience** — progress lives locally, exportable, never gatekept.
4. **Every world gets its own distinct visual language** — never reuse one template with just a new color swatch.
5. **The data is the star** — feedback shows the learner their *actual data* changing, not an abstract animation layered on top.
6. **Security and performance are merge-blocking requirements, not later cleanup.**
7. **Content is data, not code** — anyone should be able to contribute a new case without touching engine internals.
8. **Built for the whole spectrum** — a total beginner and a staff engineer should both find something here worth their time.
9. **Open and forkable, sustainably** — MIT-licensed, one `pnpm install && pnpm dev` away from anyone extending it, with optional (never required) paths to fund ongoing maintenance.
