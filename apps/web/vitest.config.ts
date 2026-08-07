import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: false,
    // No tests yet at scaffold stage — lib/diff.ts and lib/afflictions.ts
    // (Phase 1 implementation) will add real coverage here.
    passWithNoTests: true,
  },
});
