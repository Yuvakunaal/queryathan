import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";

const CONTENT_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../content");
const DEV_URL_PREFIX = "/content/";

/**
 * content/ (cases + world rosters) is the single source of truth (validated
 * by pnpm validate-content, contributable via PR without touching engine
 * code) — this serves it in dev and copies it into dist/ at build time,
 * rather than duplicating it under public/.
 */
function contentCasesPlugin(): Plugin {
  return {
    name: "dcq-content-cases",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(DEV_URL_PREFIX)) return next();
        const relPath = decodeURIComponent(req.url.slice(DEV_URL_PREFIX.length));
        const filePath = join(CONTENT_DIR, relPath);
        if (!filePath.startsWith(CONTENT_DIR)) return next();
        try {
          const contents = readFileSync(filePath);
          res.setHeader("Content-Type", "application/json");
          res.end(contents);
        } catch {
          next();
        }
      });
    },
    closeBundle() {
      const distDir = join(dirname(fileURLToPath(import.meta.url)), "dist");
      copyJsonRecursive(CONTENT_DIR, join(distDir, "content"));
      stampServiceWorker(distDir);
    },
  };
}

/**
 * Fills the two placeholders in the built service worker: a build id (a hash
 * of index.html, which names every hashed asset, so it changes whenever the
 * app does) and the Pyodide version (so the cached runtime is replaced only
 * when it actually changes).
 */
function stampServiceWorker(distDir: string): void {
  const swPath = join(distDir, "sw.js");
  const indexPath = join(distDir, "index.html");
  if (!existsSync(swPath) || !existsSync(indexPath)) return;
  const buildId = createHash("sha1")
    .update(readFileSync(indexPath))
    .digest("hex")
    .slice(0, 10);
  const pyodideManifest = JSON.parse(
    readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "node_modules/pyodide/package.json"),
      "utf8",
    ),
  ) as { version: string };
  writeFileSync(
    swPath,
    readFileSync(swPath, "utf8")
      .replace("__BUILD_ID__", buildId)
      .replace("__PYODIDE_VERSION__", pyodideManifest.version),
  );
}

/**
 * Share links (canonical address, social image) need an absolute URL. The build reads
 * it from SITE_URL, or from the production domain Vercel provides; with neither, the
 * addresses stay relative and the canonical/og:url tags are left out.
 */
function siteMetaPlugin(): Plugin {
  const vercelHost = process.env["VERCEL_PROJECT_PRODUCTION_URL"];
  const raw = process.env["SITE_URL"] ?? (vercelHost ? `https://${vercelHost}` : "");
  const site = raw.replace(/\/+$/, "");
  return {
    name: "dcq-site-meta",
    transformIndexHtml(html) {
      if (site) return html.replaceAll("__SITE_URL__", site);
      return html
        .replace(/\s*<link rel="canonical"[^>]*>/, "")
        .replace(/\s*<meta property="og:url"[^>]*>/, "")
        .replaceAll("__SITE_URL__", "");
    },
  };
}

function copyJsonRecursive(srcDir: string, destDir: string): void {
  for (const entry of readdirSync(srcDir)) {
    const srcPath = join(srcDir, entry);
    if (statSync(srcPath).isDirectory()) {
      copyJsonRecursive(srcPath, join(destDir, entry));
    } else if (entry.endsWith(".json")) {
      mkdirSync(destDir, { recursive: true });
      writeFileSync(join(destDir, entry), readFileSync(srcPath));
    }
  }
}

export default defineConfig({
  plugins: [react(), contentCasesPlugin(), siteMetaPlugin()],
  worker: {
    format: "es",
  },
  build: {
    target: "es2022",
  },
});
