/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
    include: ["tests/*_test.ts"],
    setupFiles: ["./tests/setup.ts"],
  },
});
