import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('TC_LOGIN_01: user can log in with valid credentials @smoke', async ({ page }) => {
    // Step 1: open the login page
    await page.goto('/client/#/auth/login');

    // Step 2: enter email and password
    // Built-in locator: getByPlaceholder - finds an input by its grey hint text
    await page.getByPlaceholder('email@example.com').fill(process.env.USER_EMAIL!);
    // CSS locator: '#' means "element with this id"
    await page.locator('#userPassword').fill(process.env.USER_PASSWORD!);

    // Step 3: click Login
    // Built-in locator: getByRole - finds an element by its role (button) and visible name
    await page.getByRole('button', { name: 'Login' }).click();

    // Expected: success toast is shown and the dashboard opens
    // Built-in locator: getByText - finds an element by the text it shows
    await expect(page.getByText('Login Successfully')).toBeVisible();
    await expect(page).toHaveURL(/dashboard\/dash/);
    // XPath locator: path-style query; contains(., 'text') matches the button's full text
    await expect(page.locator("xpath=//button[contains(., 'Sign Out')]")).toBeVisible();
  });
});
