#!/usr/bin/env node
// Serves apps/web/dist exactly as production does: the response headers
// (including the Content-Security-Policy) are read from vercel.json, so the
// end-to-end tests fail on anything the real CSP would block. Usage:
//   node scripts/serve-dist.mjs [port]
import { createServer } from "node:http";
import { readFileSync, statSync, existsSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "apps/web/dist");
const port = Number(process.argv[2] ?? process.env.PORT ?? 4173);

const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const globalHeaders = Object.fromEntries(
  (vercel.headers ?? [])
    .filter((entry) => entry.source === "/(.*)")
    .flatMap((entry) => entry.headers.map((h) => [h.key, h.value])),
);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".zip": "application/zip",
  ".csv": "text/csv; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".md": "text/markdown; charset=utf-8",
};

if (!existsSync(join(distDir, "index.html"))) {
  console.error("apps/web/dist is missing. Run `pnpm build` first.");
  process.exit(1);
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${String(port)}`);
  // Vercel serves its Web Analytics script and page-view endpoint itself, so they are not in
  // dist. Answer them the way Vercel does (an empty script, an accepted beacon) so the tests see
  // the same page as production without a request for a missing file.
  if (url.pathname === "/_vercel/insights/script.js") {
    res.writeHead(200, {
      ...globalHeaders,
      "Content-Type": "application/javascript; charset=utf-8",
    });
    res.end("/* Vercel Web Analytics is provided by Vercel; not used locally. */\n");
    return;
  }
  if (url.pathname.startsWith("/_vercel/insights/")) {
    res.writeHead(204, globalHeaders);
    res.end();
    return;
  }
  let relative = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "");
  if (relative === "" || relative.endsWith("/")) relative += "index.html";
  const filePath = join(distDir, relative);
  if (
    !filePath.startsWith(distDir) ||
    !existsSync(filePath) ||
    !statSync(filePath).isFile()
  ) {
    res.writeHead(404, { ...globalHeaders, "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }
  res.writeHead(200, {
    ...globalHeaders,
    "Content-Type": TYPES[extname(filePath)] ?? "application/octet-stream",
  });
  res.end(readFileSync(filePath));
}).listen(port, () => {
  console.log(
    `serving apps/web/dist on http://localhost:${String(port)} with production headers`,
  );
});
