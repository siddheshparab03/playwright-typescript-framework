import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CartPage } from '../pages/CartPage';
import productData from '../test-data/productData.json';

// All tests share ONE user account, so they share ONE cart stored on the server, and the
// site empties that cart whenever the user logs in again. So:
// - playwright.config.ts runs this file in its own project, after all other tests finish
// - mode 'default' runs the tests in this file one after another, never at the same time
test.describe.configure({ mode: 'default' });

test.describe('Cart', () => {
  let dashboardPage: DashboardPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    cartPage = new CartPage(page);

    await loginPage.goto();
    await loginPage.login(process.env.USER_EMAIL!, process.env.USER_PASSWORD!);
    await expect(page).toHaveURL(/dashboard\/dash/);

    // Clean start: every test begins with an empty cart
    await cartPage.goto();
    await cartPage.emptyCart();
    await dashboardPage.goto();
    await expect(dashboardPage.productCards.first()).toBeVisible();
  });

  // Clean up after each test too, so other test files (and you) find an empty cart
  test.afterEach(async () => {
    await cartPage.goto();
    await cartPage.emptyCart();
  });

  test('TC_CART_01: user can add a product to the cart @smoke', async () => {
    const productName = productData.cart.singleProduct;

    await dashboardPage.addProductToCart(productName);

    await expect(dashboardPage.page.getByRole('alert')).toHaveText(productData.messages.addedToCart);
    await expect(dashboardPage.cartCount).toHaveText('1');

    await dashboardPage.openCart();
    await cartPage.waitForCartToLoad();
    await expect(cartPage.itemNames).toHaveText([productName]);
  });

  test('TC_CART_02: cart total equals the sum of item prices @regression', async () => {
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

  test('TC_CART_03: empty cart shows a message @regression', async () => {
    await cartPage.goto();

    await expect(cartPage.emptyCartMessage).toBeVisible();
    await expect(cartPage.cartItems).toHaveCount(0);
    await expect(cartPage.checkoutButton).toBeHidden();
  });

  test('TC_CART_04: user can remove a product from the cart @regression', async () => {
    const productName = productData.cart.singleProduct;
    await dashboardPage.addProductToCart(productName);
    await expect(dashboardPage.cartCount).toHaveText('1');

    await cartPage.goto();
    await cartPage.removeItem(productName);

    await expect(cartPage.emptyCartMessage).toBeVisible();
    await expect(dashboardPage.cartCount).toBeHidden();
  });
});
