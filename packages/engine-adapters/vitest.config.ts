import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // protocol.ts is pure types today; rpc.ts (Phase 1 implementation) adds real coverage.
    passWithNoTests: true,
  },
});
