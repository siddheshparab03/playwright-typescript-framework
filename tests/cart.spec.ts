import { test, expect } from '../fixtures/pages';
import productData from '../test-data/productData.json';
import { testUsers } from '../utils/testUsers';

// The site stores the cart on the server and empties it whenever the account logs in again.
// So the cart tests use their OWN account (CART_USER_*), which no other test file uses, and start
// already logged in with it (saved by tests/auth.setup.ts).
test.use({ storageState: testUsers.cart.storageStateFile });

// The tests in this file share that one account, so they must not run at the same time:
// mode 'default' runs them one after another in a single worker.
test.describe.configure({ mode: 'default' });

test.describe('Cart', () => {
  test.beforeEach(async ({ dashboardPage, cartPage }) => {
    // Clean start: every test begins with an empty cart
    await cartPage.goto();
    await cartPage.emptyCart();
    await dashboardPage.goto();
    await expect(dashboardPage.productCards.first()).toBeVisible();
  });

  // Clean up after each test too, so other test files (and you) find an empty cart
  test.afterEach(async ({ cartPage }) => {
    await cartPage.goto();
    await cartPage.emptyCart();
  });

  test('TC_CART_01: user can add a product to the cart @smoke', async ({
    page,
    dashboardPage,
    cartPage,
  }) => {
    const productName = productData.cart.singleProduct;

    await dashboardPage.addProductToCart(productName);

    await expect(page.getByRole('alert')).toHaveText(productData.messages.addedToCart);
    await expect(dashboardPage.cartCount).toHaveText('1');

    await dashboardPage.openCart();
    await cartPage.waitForCartToLoad();
    await expect(cartPage.itemNames).toHaveText([productName]);
  });

  test('TC_CART_02: cart total equals the sum of item prices @regression', async ({
    dashboardPage,
    cartPage,
  }) => {
    const products = productData.cart.multipleProducts;

    for (const [index, productName] of products.entries()) {
      await dashboardPage.addProductToCart(productName);
      // Wait for the badge to update before adding the next product
      await expect(dashboardPage.cartCount).toHaveText(String(index + 1));
    }

    await dashboardPage.openCart();
    await cartPage.waitForCartToLoad();
    await expect(cartPage.itemNames).toHaveText(products);

    const prices = await cartPage.getItemPrices();
    const expectedTotal = prices.reduce((sum, price) => sum + price, 0);
    expect(await cartPage.getTotal()).toBe(expectedTotal);
  });

  test('TC_CART_03: empty cart shows a message @regression', async ({ cartPage }) => {
    await cartPage.goto();

    await expect(cartPage.emptyCartMessage).toBeVisible();
    await expect(cartPage.cartItems).toHaveCount(0);
    await expect(cartPage.checkoutButton).toBeHidden();
  });

  test('TC_CART_04: user can remove a product from the cart @regression', async ({
    dashboardPage,
    cartPage,
  }) => {
    const productName = productData.cart.singleProduct;
    await dashboardPage.addProductToCart(productName);
    await expect(dashboardPage.cartCount).toHaveText('1');

    await cartPage.goto();
    await cartPage.removeItem(productName);

    await expect(cartPage.emptyCartMessage).toBeVisible();
    await expect(dashboardPage.cartCount).toBeHidden();
  });
});
