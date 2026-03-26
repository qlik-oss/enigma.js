import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["test/**/*.spec.js"],
    setupFiles: ["./test/vitest.setup.js"],
    testTimeout: 5000,
    hookTimeout: 5000,
    fileParallelism: false,
    coverage: {
      enabled: false,
      provider: "v8",
      reporter: ["lcov", "text-summary"],
      reportsDirectory: "coverage",
      clean: true,
      include: ["src/**/*.js"],
    },
  },
});
