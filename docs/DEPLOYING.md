# Deploying Queryathan

Queryathan is a static site: `pnpm build` produces `apps/web/dist`, and any static host can serve it.
It needs **response headers** (a strict Content-Security-Policy, among others), so pick a host that lets you
set them. [`vercel.json`](../vercel.json) is the source of truth; the end-to-end tests serve the build with
exactly those headers.

## Vercel (recommended, already configured)

1. Import the GitHub repository in Vercel. It reads `vercel.json`: install with `corepack enable && pnpm
install --frozen-lockfile`, build with `pnpm build`, output `apps/web/dist`. Nothing else to set.
2. Add your domain (for example `queryathan.fun`) under Settings, Domains, and make it the production domain.
3. Share links: the build uses Vercel's production domain automatically for the canonical address and the
   social image. To force a different address, set the environment variable `SITE_URL`
   (for example `https://queryathan.fun`) and redeploy.
4. Check: open the site, view the page source (the `og:image` should be an absolute URL), and paste the address
   into a social debugger (for example the LinkedIn Post Inspector or the X card validator).

## Other hosts

- **Netlify or Cloudflare Pages:** build command `pnpm build`, publish directory `apps/web/dist`. Copy the headers from
  `vercel.json` into a `_headers` file (the CSP is the important one; keep `worker-src 'self'` and
  `connect-src 'self' https://cdn.jsdelivr.net`, which Python needs to fetch pandas once).
- **GitHub Pages:** not suitable, because it cannot set response headers (see
  [ADR 0002](./adr/0002-hosting.md)).
- **Your own server:** serve `apps/web/dist` with the headers from `vercel.json`. `node scripts/serve-dist.mjs`
  is a minimal reference.

## Before you announce it

- [ ] `pnpm build` and `pnpm e2e` pass on the commit you deploy (the CI workflow does both).
- [ ] The site opens, a case can be played in SQL and in Python, and it works offline after one visit.
- [ ] The share image shows up in a link preview.
- [ ] In the repository: Discussions on, private vulnerability reporting on, Dependency graph on, topics and
      description set, the social preview image uploaded (`docs/images/social-preview.png`).
- [ ] Add the live address to the top of the README and to the repository's website field.
