import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import loginData from '../test-data/loginData.json';

const validEmail = process.env.USER_EMAIL!;
const validPassword = process.env.USER_PASSWORD!;

test.describe('Login', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  // Runs before every test in this describe block: fresh page objects + open the login page
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
  });

  test('TC_LOGIN_01: user can log in with valid credentials @smoke', async ({ page }) => {
    await loginPage.login(validEmail, validPassword);

    await expect(loginPage.toastMessage).toHaveText(loginData.messages.loginSuccess);
    await expect(page).toHaveURL(/dashboard\/dash/);
    await expect(dashboardPage.signOutButton).toBeVisible();
    await expect(dashboardPage.ordersButton).toBeVisible();
  });

  // Data-driven: one test is generated for each row in loginData.rejectedLogins
  for (const data of loginData.rejectedLogins) {
    test(`${data.id}: login is rejected for ${data.scenario} @regression`, async ({ page }) => {
      const email = data.useRegisteredEmail ? validEmail : data.email;
      await loginPage.login(email, data.password);

      await expect(loginPage.errorAlert).toHaveText(loginData.messages.loginFailed);
      await expect(page).toHaveURL(/auth\/login/);
    });
  }

  // Data-driven: field validation messages shown under the inputs
  for (const data of loginData.fieldValidation) {
    test(`${data.id}: validation message for ${data.scenario} @regression`, async () => {
      await loginPage.login(data.email, data.password);

      // toHaveText with an array checks every matching element, in order
      await expect(loginPage.validationMessages).toHaveText(data.expectedMessages);
    });
  }

  test('TC_LOGIN_05: user can sign out @smoke', async ({ page }) => {
    await loginPage.login(validEmail, validPassword);
    await expect(dashboardPage.signOutButton).toBeVisible();

    await dashboardPage.signOut();

    await expect(page).toHaveURL(/auth\/login/);
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('TC_LOGIN_06: dashboard redirects to login when not logged in @regression', async ({ page }) => {
    await dashboardPage.goto();

    await expect(page).toHaveURL(/auth\/login/);
    await expect(loginPage.emailInput).toBeVisible();
  });
});
