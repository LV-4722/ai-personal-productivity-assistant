import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Native ESM requires the forks pool (no vm sandbox issues).
    pool: "forks",
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});
