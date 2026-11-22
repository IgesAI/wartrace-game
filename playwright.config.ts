import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);

/**
 * E2E runs against a production build (`next start`) with an in-memory PGlite database seeded with DEMO fixture content.
 * WARTRACE_DEPLOY_ENV=local enables the dev admin mock; nothing here touches external services.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } }, testIgnore: /responsive\.spec\.ts/ },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testMatch: /(a11y|responsive)\.spec\.ts/ },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/api/v1/daily`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      WARTRACE_DEPLOY_ENV: "local",
      GAME_DEV_FIXTURE_MODE: "true",
      PGLITE_DATA_DIR: "memory://",
      // Set E2E_DATABASE_URL to run the suite against a real (pre-migrated, demo-seeded) Postgres.
      DATABASE_URL: process.env.E2E_DATABASE_URL ?? "",
      ANALYTICS_ENABLED: "false",
    },
  },
});
