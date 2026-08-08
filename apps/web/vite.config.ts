import { readFileSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";

const CONTENT_CASES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../content/cases",
);
const DEV_URL_PREFIX = "/content/cases/";

/**
 * content/cases/ is the single source of truth (validated by
 * pnpm validate-content, contributable via PR without touching engine code)
 * — this serves it in dev and copies it into dist/ at build time, rather
 * than duplicating it under public/.
 */
function contentCasesPlugin(): Plugin {
  return {
    name: "dcq-content-cases",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(DEV_URL_PREFIX)) return next();
        const relPath = decodeURIComponent(req.url.slice(DEV_URL_PREFIX.length));
        const filePath = join(CONTENT_CASES_DIR, relPath);
        if (!filePath.startsWith(CONTENT_CASES_DIR)) return next();
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
      const outDir = join(dirname(fileURLToPath(import.meta.url)), "dist/content/cases");
      copyJsonRecursive(CONTENT_CASES_DIR, outDir);
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
  plugins: [react(), contentCasesPlugin()],
  worker: {
    format: "es",
  },
  build: {
    target: "es2022",
  },
});
