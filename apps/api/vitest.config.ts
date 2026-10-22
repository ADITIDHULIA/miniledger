import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false, // tests share one isolated test database
    env: { NODE_ENV: "test" },
    testTimeout: 15000,
  },
});
