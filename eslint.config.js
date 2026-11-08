// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "ios/*", "android/*", ".expo/*"],
  },
  {
    // @env is generated from .env at build time by react-native-dotenv.
    settings: { "import/core-modules": ["@env"] },
  },
  {
    // Vitest hoists vi.mock above imports, so mocks are declared first on purpose.
    files: ["**/*.test.ts"],
    rules: { "import/first": "off" },
  },
]);
