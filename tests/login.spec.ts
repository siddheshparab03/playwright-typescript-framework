import { test, expect } from '../fixtures/pages';
import loginData from '../test-data/loginData.json';
import { getCredentials } from '../utils/testUsers';

/** Rows marked useRegisteredEmail use the main account's real email (from .env), not one in the JSON. */
function emailFor(data: { useRegisteredEmail: boolean; email: string }) {
  return data.useRegisteredEmail ? getCredentials('main').email : data.email;
}

test.describe('Login', () => {
  // Runs before every test in this describe block: open the login page
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('TC_LOGIN_01: user can log in with valid credentials @smoke', async ({
    page,
    loginPage,
    dashboardPage,
  }) => {
    const { email, password } = getCredentials('main');
    await loginPage.login(email, password);

    await expect(loginPage.toastMessage).toHaveText(loginData.messages.loginSuccess);
    await expect(page).toHaveURL(/dashboard\/dash/);
    await expect(dashboardPage.signOutButton).toBeVisible();
    await expect(dashboardPage.ordersButton).toBeVisible();
  });

  // Data-driven: one test is generated for each row in loginData.rejectedLogins
  for (const data of loginData.rejectedLogins) {
    test(`${data.id}: login is rejected for ${data.scenario} @regression`, async ({
      page,
      loginPage,
    }) => {
      await loginPage.login(emailFor(data), data.password);

      await expect(loginPage.errorAlert).toHaveText(loginData.messages.loginFailed);
      await expect(page).toHaveURL(/auth\/login/);
    });
  }

  // Data-driven: field validation messages shown under the inputs
  for (const data of loginData.fieldValidation) {
    test(`${data.id}: validation message for ${data.scenario} @regression`, async ({
      loginPage,
    }) => {
      await loginPage.login(data.email, data.password);

      // toHaveText with an array checks every matching element, in order
      await expect(loginPage.validationMessages).toHaveText(data.expectedMessages);
    });
  }

  test('TC_LOGIN_05: user can sign out @smoke', async ({ page, loginPage, dashboardPage }) => {
    const { email, password } = getCredentials('main');
    await loginPage.login(email, password);
    await expect(dashboardPage.signOutButton).toBeVisible();

    await dashboardPage.signOut();

    await expect(page).toHaveURL(/auth\/login/);
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('TC_LOGIN_06: dashboard redirects to login when not logged in @regression', async ({
    page,
    loginPage,
    dashboardPage,
  }) => {
    await dashboardPage.goto();

    await expect(page).toHaveURL(/auth\/login/);
    await expect(loginPage.emailInput).toBeVisible();
  });
});
