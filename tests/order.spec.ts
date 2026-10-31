import { test, expect } from '../fixtures/pages';
import orderData from '../test-data/orderData.json';
import { testUsers, getCredentials } from '../utils/testUsers';

// Order tests use their OWN account (ORDER_USER_*): placing an order needs a cart, and the site
// empties an account's cart whenever it logs in, so no other test file may use this account.
// Every test starts already logged in with it (saved by tests/auth.setup.ts).
test.use({ storageState: testUsers.order.storageStateFile });

// The tests below share that account with each other, so they run one after another.
test.describe.configure({ mode: 'default' });

test.describe('Checkout and orders', () => {
  // Clean start and clean-up through the API: no orders and an empty cart for this account
  test.beforeEach(async ({ api }) => {
    await api.deleteAllOrders();
    await api.emptyCart();
  });

  test.afterEach(async ({ api }) => {
    await api.deleteAllOrders();
    await api.emptyCart();
  });

  test.describe('Checkout', () => {
    // Put one product in the cart through the API (1 request instead of 3 screens),
    // then open the checkout page in the browser: that page is what these tests check
    test.beforeEach(async ({ api, cartPage, checkoutPage }) => {
      await api.addToCart(orderData.product);
      await cartPage.goto();
      await cartPage.checkoutButton.click();
      await checkoutPage.waitForPageToLoad();
    });

    test('TC_ORDER_02: user can place an order end to end @smoke', async ({
      page,
      checkoutPage,
      orderConfirmationPage,
      ordersPage,
      orderDetailsPage,
    }) => {
      const accountEmail = getCredentials('order').email;

      // Checkout page shows the right product and the account email for shipping
      await expect(checkoutPage.itemTitles).toHaveText([orderData.product]);
      await expect(checkoutPage.shippingEmailInput).toHaveValue(accountEmail);

      await checkoutPage.cvvInput.fill(orderData.card.cvv);
      await checkoutPage.nameOnCardInput.fill(orderData.card.nameOnCard);
      await checkoutPage.selectCountry(orderData.country.searchText, orderData.country.name);
      await checkoutPage.placeOrder();

      // Thank-you page: heading and an order id
      await expect(orderConfirmationPage.heading).toBeVisible();
      await expect(page.locator('#toast-container')).toContainText(orderData.messages.orderPlaced);
      const orderId = await orderConfirmationPage.getOrderId();
      expect(orderId).toMatch(/^[a-f0-9]{24}$/);

      // The same order appears in the order history with the right product and price
      await orderConfirmationPage.ordersHistoryLink.click();
      await expect(ordersPage.orderRow(orderId)).toBeVisible();
      await expect(ordersPage.productNameCell(orderId)).toHaveText(orderData.product);
      const historyPrice = await ordersPage.priceCell(orderId).textContent();

      // Order details show the same id, product, price and the chosen country
      await ordersPage.viewOrder(orderId);
      await expect(page).toHaveURL(new RegExp(`order-details/${orderId}`));
      await expect(orderDetailsPage.orderId).toHaveText(orderId);
      await expect(orderDetailsPage.productTitle).toHaveText(orderData.product);
      await expect(orderDetailsPage.productPrice).toHaveText(historyPrice!.trim());
      await expect(orderDetailsPage.deliveryAddress).toContainText(
        `Country - ${orderData.country.name}`,
      );
      await expect(orderDetailsPage.billingAddress).toContainText(accountEmail);
    });

    test('TC_ORDER_01: order is blocked without a country @regression', async ({
      page,
      checkoutPage,
    }) => {
      await checkoutPage.placeOrder();

      await expect(checkoutPage.shippingErrorToast).toHaveText(orderData.messages.missingShipping);
      await expect(page).toHaveURL(/dashboard\/order/);
    });

    for (const data of orderData.coupons) {
      test(`${data.id}: ${data.scenario} shows "${data.expectedMessage}" @regression`, async ({
        checkoutPage,
      }) => {
        await checkoutPage.applyCoupon(data.code);

        await expect(checkoutPage.couponMessage).toHaveText(data.expectedMessage);
      });
    }

    test('TC_ORDER_07: order needs CVV and name on card @regression', async ({
      page,
      checkoutPage,
    }) => {
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

  test.describe('Order history', () => {
    test('TC_ORDER_06: user can delete an order from the history @regression', async ({
      api,
      ordersPage,
    }) => {
      // This test checks DELETING, so the order is created through the API in about a second,
      // instead of going through cart and checkout in the browser
      const orderId = await api.createOrder(orderData.product, orderData.country.name);

      await ordersPage.goto();
      await expect(ordersPage.orderRow(orderId)).toBeVisible();
      await ordersPage.deleteOrder(orderId);

      await expect(ordersPage.deletedToast).toBeVisible();
      await expect(ordersPage.orderRow(orderId)).toHaveCount(0);
    });
  });
});
