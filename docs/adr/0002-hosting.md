# ADR 0002: Vercel for hosting

**Status:** Accepted

## Context

Section 8 of the plan mandates strict CSP headers (`script-src 'self'`, no
inline scripts) and, by extension, `connect-src 'self'` to stop a worker from
exfiltrating a user's dataset over the network. This requires a host that can
set custom HTTP response headers.

**GitHub Pages cannot set custom response headers at all** — a fork deployed
there is limited to a `<meta>` CSP tag, which cannot express `connect-src`,
`frame-ancestors`, or violation reporting. That is a materially weaker
security posture than the one this project commits to.

## Decision

Deploy to **Vercel**. Headers are declared in [`/vercel.json`](../../vercel.json).

## Reasoning

- Custom headers via `vercel.json`, satisfying the CSP requirement.
- Free tier, static-friendly, good caching for the multi-MB Pyodide payload.
- Netlify is an equivalent alternative if Vercel is ever unavailable — the
  header configuration is the load-bearing requirement, not the specific
  vendor.

## Consequence for forks

If you fork this project onto GitHub Pages, document (per `SECURITY.md`)
that you are accepting a degraded security posture — don't assume parity
with the hosted version.
