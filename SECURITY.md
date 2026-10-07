# Security Policy

Queryathan has no backend and no accounts, but it executes
**arbitrary user-typed Python and SQL in the browser**. That is a real attack
surface and is treated as such, not waved away because "there's no backend."

## Reporting a vulnerability

Please report suspected vulnerabilities privately via GitHub's
["Report a vulnerability"](https://github.com/Yuvakunaal/queryathan/security/advisories/new)
flow (Security tab → Advisories) rather than opening a public issue. We'll
acknowledge within a reasonable timeframe and coordinate disclosure.

## Code execution sandboxing

- Pyodide and sql.js run **inside a dedicated Web Worker**, never on the main
  thread. A worker has no direct access to the DOM, cookies, or
  `localStorage` of the main page.
- `eval()` / `new Function()` are never used on untrusted content outside
  that sandboxed context.
- Sandbox mode (bring-your-own-CSV) uses the same worker boundary, not an
  additional iframe. The file is read in the browser, tidied, and handed to
  the engine as plain text: it is only ever _data_ to the CSV parser or to
  `pandas.read_csv`, never executed. It is not uploaded anywhere and not
  stored (a reload clears it). The code run against it is code the player
  typed themselves, in the same worker, with the same `connect-src` limits as
  every other case. (An earlier plan called for a cross-origin sandboxed
  iframe; the worker boundary plus CSP was judged sufficient because nothing
  in a user's file is ever evaluated as code.)
- A run that does not finish within 20 seconds is abandoned: the worker is
  terminated and a fresh one started, so runaway or hostile code cannot hold
  the page's engine hostage.
- A worker has no DOM access but **can still make network requests.** The
  Content-Security-Policy `connect-src` directive (below) is what actually
  bounds where a malicious payload could exfiltrate a user's dataset to —
  this is treated as part of the sandboxing model, not just a CSP checkbox.

## Content Security Policy & supply chain

- `script-src 'self' 'wasm-unsafe-eval'`, no inline scripts. All CSP-relevant
  _scripts_ (GSAP, fonts) are **self-hosted via npm**, not loaded from a
  CDN — zero third-party script origins, no SRI bookkeeping required.
  `'wasm-unsafe-eval'` permits `WebAssembly.instantiate`/`compile` only —
  every browser vendor gates WASM behind this token whenever any CSP is
  present, and Pyodide cannot start without it. It does **not** permit
  `eval()` or `new Function()` on arbitrary strings, which stay fully
  blocked. See
  [`docs/adr/0005-csp-wasm-and-inline-styles.md`](./docs/adr/0005-csp-wasm-and-inline-styles.md).
- `style-src 'self' 'unsafe-inline'` — required because CodeMirror 6 injects
  its theme as a runtime `<style>` element. Plan §8's "no inline scripts"
  rule is scoped to scripts, not styles; inline styles carry no script
  execution or exfiltration channel of consequence here. See ADR 0005.
- `connect-src 'self' https://cdn.jsdelivr.net` — the one narrow exception
  for data (not script) fetches.
  Pyodide's interpreter/stdlib is self-hosted and checksum-verified
  (`scripts/fetch-pyodide.mjs`), but the pandas/numpy wheel files (~10–15MB)
  are fetched by exact pinned-version URL from Pyodide's official jsdelivr
  mirror rather than self-hosting the ~414MB full distribution. This is a
  `fetch()` data dependency, not a `<script>` tag — see
  [`docs/adr/0004-pyodide-package-delivery.md`](./docs/adr/0004-pyodide-package-delivery.md)
  for the full reasoning and the exact pinned URLs.
- Exact versions are pinned for Pyodide and sql.js — never `@latest`.
  Dependabot is enabled on this repo to track upstream CVEs; the jsdelivr
  package-wheel pin is outside Dependabot's ecosystems and needs manual
  review on every Pyodide version bump.
- **Hosting constraint:** shipping this CSP requires a host that can set
  custom response headers. The project deploys to Vercel (`vercel.json`
  headers). GitHub Pages cannot set custom response headers at all — a fork
  deployed there can only use a `<meta>` CSP, which cannot express
  `connect-src`, `frame-ancestors`, or violation reporting, and therefore
  ships a materially weaker security posture than the one described here.
  If you fork this project onto GitHub Pages, know that you are giving up
  part of this threat model.

## Offline cache (service worker)

`public/sw.js` caches the app's own hashed assets, the self-hosted Python
runtime, seed datasets, and the pinned pandas/numpy wheels from the one
allowed CDN origin, so the app keeps working offline after a first visit. It
only touches `GET` requests to this origin and `cdn.jsdelivr.net/pyodide/`,
registers in production builds only, and is covered by the existing
`worker-src 'self'` directive (no CSP change). Case and page requests are
network-first, so a deploy takes effect immediately.

## How the CSP is tested

`pnpm e2e` builds the app and serves `apps/web/dist` with the exact response
headers from `vercel.json` (`scripts/serve-dist.mjs`); every end-to-end test
fails on an uncaught page error or a Content-Security-Policy violation. CI runs
this on every pull request.

## Privacy by design

- Zero accounts, zero PII collected by default.
- User-uploaded datasets in sandbox mode never leave the browser — all
  processing happens client-side inside the worker.
- The hosted site counts anonymous page views with Vercel Web Analytics:
  cookieless, it sees which page was loaded and never your code, files or
  progress. A copy you host yourself has no analytics unless you add it
  (the `<Analytics />` line in `apps/web/src/main.tsx`).

## Dataset/content licensing

Every seed dataset shipped with the platform is explicitly open-licensed
(CC0, public-domain government data, or synthetic data) and documented per
dataset in the relevant `apps/web/public/datasets/<world>/LICENSES.md`.
Community-contributed case JSON is data (declarative win-condition
predicates + display strings), never executable code — see
[`docs/adr/0003-win-condition-contract.md`](./docs/adr/0003-win-condition-contract.md)
— which keeps content review a licensing/data review rather than a code
security review.
