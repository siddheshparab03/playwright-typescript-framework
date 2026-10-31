import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { testUsers, getCredentials, type TestUserName } from '../utils/testUsers';

// Runs once before all tests (see the "setup" project in playwright.config.ts).
// Logs in with each test account and saves the browser's logged-in state to a file.
// Tests then start already logged in by loading that file, instead of typing in the login form.

for (const userName of Object.keys(testUsers) as TestUserName[]) {
  setup(`log in as the ${userName} user`, async ({ page }) => {
    // Every other test depends on these logins, so give them extra patience: when the shared site
    // is overloaded, its login server can take well over the usual 10 s to answer.
    setup.setTimeout(90_000);

    const { email, password } = getCredentials(userName);
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(email, password);
    await expect(page).toHaveURL(/dashboard\/dash/, { timeout: 60_000 });

    // The site keeps the login as a "token" in localStorage; storageState saves it to the file
    await page.context().storageState({ path: testUsers[userName].storageStateFile });
  });
}
