import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the Login page (/client/#/auth/login).
 * Tests call these methods instead of touching locators directly,
 * so a UI change is fixed here once instead of in every test.
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly validationMessages: Locator;
  readonly toastMessage: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;

    // Built-in locator: getByPlaceholder - the grey hint text inside the box
    this.emailInput = page.getByPlaceholder('email@example.com');

    // CSS attribute locator: [attribute="value"] - the input whose type is password
    this.passwordInput = page.locator('input[type="password"]');

    // Built-in locator: getByRole - a button with the visible name "Login"
    this.loginButton = page.getByRole('button', { name: 'Login' });

    // CSS class locator: '.' means "elements with this class"; matches every red message under the fields
    this.validationMessages = page.locator('.invalid-feedback');

    // CSS id locator: the area where every pop-up (toast) message appears, success or error
    this.toastMessage = page.locator('#toast-container');

    // Built-in locator: getByRole('alert') - only ERROR toasts carry role="alert" in this app;
    // the "Login Successfully" toast does not, so it cannot be found this way
    this.errorAlert = page.getByRole('alert');

    // Note: getByLabel('Email') does NOT work on this page. The <label for="email"> points to an
    // element with id "email", but the input's id is "userEmail", so they are not linked.
  }

  async goto() {
    await this.page.goto('/client/#/auth/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
