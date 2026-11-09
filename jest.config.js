// Screen tests (React Native Testing Library) run in Jest with the Expo preset.
// Pure unit tests (*.test.ts) run in Vitest, see vitest.config.mts.
module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/src/**/*.ui.test.tsx"],
  setupFiles: ["<rootDir>/jest.setup.ts"],
};
