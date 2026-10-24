import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrderConfirmationPage } from '../pages/OrderConfirmationPage';
import { OrdersPage } from '../pages/OrdersPage';
import { OrderDetailsPage } from '../pages/OrderDetailsPage';
import orderData from '../test-data/orderData.json';
import { getRequiredEnv } from '../utils/env';

// Order tests use their OWN account (ORDER_USER_*): placing an order needs a cart, and the site
// empties an account's cart whenever it logs in, so no other test file may use this account.
// The tests below share it with each other, so they run one after another.
test.describe.configure({ mode: 'default' });

test.describe('Checkout and orders', () => {
  let dashboardPage: DashboardPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;
  let ordersPage: OrdersPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);
    ordersPage = new OrdersPage(page);

    await loginPage.goto();
    await loginPage.login(getRequiredEnv('ORDER_USER_EMAIL'), getRequiredEnv('ORDER_USER_PASSWORD'));
    await expect(page).toHaveURL(/dashboard\/dash/);

    // Clean start: empty cart, then put one product in it and go to checkout
    await cartPage.goto();
    await cartPage.emptyCart();
    await dashboardPage.goto();
    await dashboardPage.addProductToCart(orderData.product);
    await expect(dashboardPage.cartCount).toHaveText('1');
    await dashboardPage.openCart();
    await cartPage.checkoutButton.click();
    await checkoutPage.waitForPageToLoad();
  });

  // Clean up: delete every order this account created, and empty its cart
  test.afterEach(async () => {
    await ordersPage.deleteAllOrders();
    await cartPage.goto();
    await cartPage.emptyCart();
  });

  test('TC_ORDER_02: user can place an order end to end @smoke', async ({ page }) => {
    // Checkout page shows the right product and the account email for shipping
    await expect(checkoutPage.itemTitles).toHaveText([orderData.product]);
    await expect(checkoutPage.shippingEmailInput).toHaveValue(getRequiredEnv('ORDER_USER_EMAIL'));

    await checkoutPage.cvvInput.fill(orderData.card.cvv);
    await checkoutPage.nameOnCardInput.fill(orderData.card.nameOnCard);
    await checkoutPage.selectCountry(orderData.country.searchText, orderData.country.name);
    await checkoutPage.placeOrder();

    // Thank-you page: heading and an order id
    const confirmationPage = new OrderConfirmationPage(page);
    await expect(confirmationPage.heading).toBeVisible();
    await expect(page.locator('#toast-container')).toContainText(orderData.messages.orderPlaced);
    const orderId = await confirmationPage.getOrderId();
    expect(orderId).toMatch(/^[a-f0-9]{24}$/);

    // The same order appears in the order history with the right product and price
    await confirmationPage.ordersHistoryLink.click();
    await expect(ordersPage.orderRow(orderId)).toBeVisible();
    await expect(ordersPage.productNameCell(orderId)).toHaveText(orderData.product);
    const historyPrice = await ordersPage.priceCell(orderId).textContent();

    // Order details show the same id, product, price and the chosen country
    await ordersPage.viewOrder(orderId);
    const detailsPage = new OrderDetailsPage(page);
    await expect(page).toHaveURL(new RegExp(`order-details/${orderId}`));
    await expect(detailsPage.orderId).toHaveText(orderId);
    await expect(detailsPage.productTitle).toHaveText(orderData.product);
    await expect(detailsPage.productPrice).toHaveText(historyPrice!.trim());
    await expect(detailsPage.deliveryAddress).toContainText(`Country - ${orderData.country.name}`);
    await expect(detailsPage.billingAddress).toContainText(getRequiredEnv('ORDER_USER_EMAIL'));
  });

  test('TC_ORDER_01: order is blocked without a country @regression', async ({ page }) => {
    await checkoutPage.placeOrder();

    await expect(checkoutPage.shippingErrorToast).toHaveText(orderData.messages.missingShipping);
    await expect(page).toHaveURL(/dashboard\/order/);
  });

  for (const data of orderData.coupons) {
    test(`${data.id}: ${data.scenario} shows "${data.expectedMessage}" @regression`, async () => {
      await checkoutPage.applyCoupon(data.code);

      await expect(checkoutPage.couponMessage).toHaveText(data.expectedMessage);
    });
  }

  test('TC_ORDER_06: user can delete an order from the history @regression', async ({ page }) => {
    await checkoutPage.selectCountry(orderData.country.searchText, orderData.country.name);
    await checkoutPage.placeOrder();
    const confirmationPage = new OrderConfirmationPage(page);
    await expect(confirmationPage.heading).toBeVisible();
    const orderId = await confirmationPage.getOrderId();

    await ordersPage.goto();
    await ordersPage.deleteOrder(orderId);

    await expect(ordersPage.deletedToast).toBeVisible();
    await expect(ordersPage.orderRow(orderId)).toHaveCount(0);
  });

  test('TC_ORDER_07: order needs CVV and name on card @regression', async ({ page }) => {
    // Known bug: the order is placed even with CVV and Name on Card empty.
    // afterEach deletes the order that the bug lets through.
    test.fail(true, 'Bug: checkout accepts an empty CVV and name on card');

    await checkoutPage.cvvInput.clear();
    await checkoutPage.nameOnCardInput.clear();
    await checkoutPage.selectCountry(orderData.country.searchText, orderData.country.name);
    await checkoutPage.placeOrder();

    // Expected: an error message, and the user stays on checkout.
    // Actual (bug): no error, the order is created and the thank-you page opens.
    // We check for the error message, not "URL is not thanks": right after the click the URL has
    // not changed yet, so a "not" check would pass too early, while the order is still being created.
    await expect(checkoutPage.errorToast).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/dashboard\/order/);
  });
});
