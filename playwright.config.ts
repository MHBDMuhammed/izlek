import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4180",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm preview --port 4180 --strictPort",
    port: 4180,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], hasTouch: true, isMobile: true },
    },
  ],
});
