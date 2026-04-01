import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"]
      }
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"]
      }
    }
  ]
});
