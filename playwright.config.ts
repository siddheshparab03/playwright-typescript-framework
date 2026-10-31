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

  // Retry a failed test before calling it a failure: the shared practice site is sometimes very slow.
  // A test that fails and then passes on retry is reported as "flaky", so problems stay visible.
  retries: process.env.CI ? 2 : 1,

  // HTML report to view results; 'list' prints progress in the terminal.
  // On CI, 'github' also marks failures directly on the pull request's changed lines.
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    // page.goto('/client/...') is resolved against this URL.
    baseURL: process.env.BASE_URL ?? 'https://rahulshettyacademy.com',

    // Evidence for failed tests: screenshot, video and trace.
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    // 1. Logs in once per test account and saves each login to playwright/.auth/
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // 2. The real tests; they start only after "setup" has finished.
    //    Each test file chooses which saved login to use with test.use({ storageState }).
    {
      name: 'chromium',
      testIgnore: /.*\.setup\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
