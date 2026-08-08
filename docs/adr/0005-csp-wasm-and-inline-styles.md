# ADR 0005: CSP exceptions for WASM instantiation and CodeMirror's injected styles

**Status:** Accepted

## Context

The Phase 1 CSP (`script-src 'self'`, `style-src 'self'`) was written in ADR
0002/0004 before the code that has to run under it existed, and was never
tested against the actual production header set — only against `vite dev`,
which doesn't send Vercel's headers at all. A Phase 1 completeness review
served the exact `vercel.json` policy from a local server against real
Chrome and found two breaks:

1. **`script-src 'self'` blocks `WebAssembly.instantiate`/`compile`.**
   Chrome, Firefox, and Safari all gate WASM instantiation behind
   `'wasm-unsafe-eval'` (or the broader `'unsafe-eval'`) whenever _any_ CSP
   is present, in both document and worker contexts. Pyodide calls
   `WebAssembly.instantiate` directly. Without this token, `pyodide.worker.ts`
   fails to initialize, never posts `ready`, and (until the Phase 1
   `ready()` timeout fix) the app hangs on a blank screen — in production
   only, since dev/preview never exercised this header.
2. **`style-src 'self'` blocks CodeMirror 6's runtime-injected `<style>`
   element.** `EditorView`'s style-mod-based theming (our
   `worlds/boss-fights/editorTheme.ts`) inserts a stylesheet at runtime,
   which counts as inline content under CSP. Without an exception, the
   editor loads with zero styling — `editorTheme.ts` becomes dead code in
   production.

## Decision

- `script-src` gains **`'wasm-unsafe-eval'`** — not `'unsafe-eval'`. This
  token permits WASM compilation/instantiation only; it does **not** permit
  `eval()` or `new Function()` on arbitrary strings, which remain fully
  blocked. Plan §8's "no `unsafe-eval` on the main thread" is about the
  latter (arbitrary string execution) — `wasm-unsafe-eval` is a narrower,
  purpose-built grant that every browser vendor added specifically so sites
  running WASM don't need the broad token. It is not the exception the plan
  was written to forbid, but it is a real relaxation and is recorded here
  rather than folded silently into the original CSP line.
- `style-src` gains **`'unsafe-inline'`**. Plan §8 explicitly scopes its "no
  inline scripts" rule to scripts; it says nothing about styles. A CSP
  nonce (`EditorView.cspNonce`) would be the tighter alternative, but
  Vercel's static header configuration can't mint a per-request nonce
  without moving to a server function, which isn't worth the complexity
  for what inline styles can actually do (no script execution, no
  navigation, no data exfiltration channel of consequence here).

## Consequence

- `script-src` is no longer a pure `'self'` allowlist. This is disclosed in
  `SECURITY.md` rather than left implicit in the CSP string.
- Any future code path that would need full `'unsafe-eval'` (arbitrary
  `eval()`/`new Function()` on untrusted input) is still explicitly banned
  and would need its own ADR — this decision does not open that door.
- Before any future CSP edit, **test it against the real header set**, not
  just against `vite dev`. Phase 1 shipped this gap because the working
  build was never served with `vercel.json`'s actual headers before
  verification — add a local "serve `dist/` with production headers" step
  to the pre-tag checklist for any change touching `vercel.json` or a new
  third-party runtime dependency.
