import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

/**
 * End-to-end tests run against the production build (`pnpm build` first),
 * served by scripts/serve-dist.mjs with the real headers from vercel.json, so
 * a Content-Security-Policy regression fails here instead of in production.
 * They run the real Pyodide and SQLite engines.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: true,
  workers: process.env["CI"] ? 2 : 3,
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1400, height: 900 } },
    },
  ],
  webServer: {
    command: `node ../../scripts/serve-dist.mjs ${String(PORT)}`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !process.env["CI"],
    timeout: 30_000,
  },
});
