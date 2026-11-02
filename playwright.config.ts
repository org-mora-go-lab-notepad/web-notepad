import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

const realBff = process.env.NOTEPAD_API_MODE === "bff";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  // Local full-core parallelism was benchmarked; CLI --workers can override it.
  // The hosted runner has four cores and a ten-minute job budget. Using all
  // four keeps the complete E2E contract inside that budget without sharding
  // related scenarios across separate application servers.
  workers: process.env.CI ? 4 : "100%",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "line",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: realBff
        ? "npx next dev -p 3101"
        : "npx tsx scripts/mock-api.ts --port 3101 --ephemeral",
      cwd: realBff
        ? (process.env.NOTEPAD_BFF_DIR ??
          path.resolve("../../org-mora-go-lab-notepad/web-notepad-bff"))
        : process.cwd(),
      url: "http://127.0.0.1:3101/api/health",
      env: {
        NOTEPAD_BFF_SECRET: "test-bff-secret",
        TURSO_DATABASE_URL:
          "file:" + path.resolve("test-results/notepad-e2e.db"),
        TURSO_AUTH_TOKEN: "",
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npx next dev -p 3000",
      env: {
        KAKAO_REST_API_KEY: "test-rest-key",
        KAKAO_REDIRECT_URI:
          "http://localhost:3000/api/auth/oauth/kakao/callback",
        AUTH_SECRET: "test-auth-secret",
        LOCAL_DEV_LOGIN: "0",
        NOTEPAD_BFF_URL: "http://127.0.0.1:3101",
        NOTEPAD_BFF_SECRET: "test-bff-secret",
      },
      url: "http://localhost:3000",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
