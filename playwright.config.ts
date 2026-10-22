import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load values such as BASE_URL and login credentials from the .env file.
dotenv.config({ quiet: true });

export default defineConfig({
  // Folder where Playwright looks for test files (*.spec.ts).
  testDir: './tests',

  // Max time one test may run before it fails.
  timeout: 30_000,

  // Max time an assertion like toBeVisible() keeps retrying.
  expect: { timeout: 10_000 },

  // Run test files in parallel to save time.
  fullyParallel: true,

  // Fail the CI build if someone accidentally left test.only in the code.
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI only (the live site can be slow sometimes).
  retries: process.env.CI ? 2 : 0,

  // HTML report to view results; 'list' prints progress in the terminal.
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    // page.goto('/client/...') is resolved against this URL.
    baseURL: process.env.BASE_URL ?? 'https://rahulshettyacademy.com',

    // Evidence for failed tests: screenshot, video and trace.
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  // The site empties a user's cart whenever that user logs in again. Cart tests would lose
  // their cart if other tests logged in at the same moment, so they run in their own project
  // that starts only after the first project has finished.
  projects: [
    {
      name: 'chromium',
      testIgnore: /cart\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-cart',
      testMatch: /cart\.spec\.ts/,
      dependencies: ['chromium'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
