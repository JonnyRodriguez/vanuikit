/**
 * Playwright e2e + a11y harness for the VanUikit demo.
 *
 * - Run against the demo server (default :3000).
 * - `reuseExistingServer: true` reuses an already-running server (local dev);
 *   in CI, Playwright starts a new one with `npm run start` over the
 *   previously built dist.
 */
import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    headless: true,
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start",
    url: `http://localhost:${PORT}/health`,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
