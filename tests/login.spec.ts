import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('TC_LOGIN_01: user can log in with valid credentials @smoke', async ({ page }) => {
    // Step 1: open the login page
    await page.goto('/client/#/auth/login');

    // Step 2: enter email and password
    await page.locator('#userEmail').fill(process.env.USER_EMAIL!);
    await page.locator('#userPassword').fill(process.env.USER_PASSWORD!);

    // Step 3: click Login
    await page.locator('#login').click();

    // Expected: success toast is shown and the dashboard opens
    await expect(page.locator('#toast-container')).toContainText('Login Successfully');
    await expect(page).toHaveURL(/dashboard\/dash/);
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
  });
});
