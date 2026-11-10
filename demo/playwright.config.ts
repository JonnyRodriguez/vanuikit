/**
 * Playwright e2e + a11y harness para el demo de VanUikit.
 *
 * - Corré contra el servidor del demo (por defecto :3000).
 * - `reuseExistingServer: true` reutiliza un servidor ya levantado (dev local);
 *   en CI, Playwright levanta uno nuevo con `npm run start` sobre el dist
 *   previamente construido.
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
