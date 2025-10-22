import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  optimizeDeps: {
    include: ["lit"],
  },
  test: {
    deps: {
      // Ensure lit is inlined so its internal specifiers (like ./decorators)
      // are resolved correctly when running under Vitest.
      inline: ["lit"],
    },
    environment: "jsdom", // to run in browser-like environment
    env: {
      TZ: "Etc/UTC",
      IS_TEST: "true",
    },
    setupFiles: ["./test/setup.ts"],
    coverage: {
      include: [
        "src/data/**/*",
        "src/common/**/*",
        "src/external_app/**/*",
        "src/hassio/**/*",
        "src/panels/**/*",
        "src/util/**/*",
      ],
      reporter: ["text", "html"],
      provider: "v8",
      reportsDirectory: "test/coverage",
    },
  },
});
