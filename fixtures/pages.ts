import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrderConfirmationPage } from '../pages/OrderConfirmationPage';
import { OrdersPage } from '../pages/OrdersPage';
import { OrderDetailsPage } from '../pages/OrderDetailsPage';
import { ApiClient } from '../utils/apiClient';

/** Every page object a test can ask for, plus the API helper. */
type PageObjects = {
  api: ApiClient;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  productDetailsPage: ProductDetailsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  orderConfirmationPage: OrderConfirmationPage;
  ordersPage: OrdersPage;
  orderDetailsPage: OrderDetailsPage;
};

/**
 * Our own version of Playwright's `test`, with page objects as fixtures.
 * A test lists what it needs, e.g. `async ({ cartPage, dashboardPage }) => ...`,
 * and Playwright creates exactly those objects for that test's browser page.
 * Tests import `test` and `expect` from this file instead of '@playwright/test'.
 */
export const test = base.extend<PageObjects>({
  // `request` is Playwright's built-in HTTP client (uses baseURL from the config).
  // `storageState` is the saved-login file the test file chose with test.use({ storageState }),
  // so the API acts on the same account as the test's browser.
  api: async ({ request, storageState }, use) => {
    if (typeof storageState !== 'string') {
      throw new Error('The api fixture needs test.use({ storageState: <saved-login file> })');
    }
    await use(ApiClient.fromStorageState(request, storageState));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  productDetailsPage: async ({ page }, use) => {
    await use(new ProductDetailsPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  orderConfirmationPage: async ({ page }, use) => {
    await use(new OrderConfirmationPage(page));
  },
  ordersPage: async ({ page }, use) => {
    await use(new OrdersPage(page));
  },
  orderDetailsPage: async ({ page }, use) => {
    await use(new OrderDetailsPage(page));
  },
});

export { expect };
