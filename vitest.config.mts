import { defineConfig } from "vitest/config";

// Vitest runs the pure unit tests. Screen tests (*.ui.test.tsx) need React
// Native's Jest preset, so they run in Jest instead (see jest.config.js).
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
