import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import productData from '../test-data/productData.json';

test.describe('Products', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login(process.env.USER_EMAIL!, process.env.USER_PASSWORD!);
    await expect(page).toHaveURL(/dashboard\/dash/);
    await expect(dashboardPage.productCards.first()).toBeVisible();
  });

  test('TC_PROD_01: products are listed with name, price and buttons @smoke', async () => {
    const cardCount = await dashboardPage.productCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // all() returns a list of locators, one per card, so we can check each card the same way
    for (const card of await dashboardPage.productCards.all()) {
      await expect(card.locator('b')).not.toBeEmpty();
      await expect(card.getByText(/\$\s?\d+/)).toBeVisible();
      await expect(card.getByRole('button', { name: 'View' })).toBeVisible();
      await expect(card.getByRole('button', { name: 'Add To Cart' })).toBeVisible();
    }

    // The summary text must agree with the number of cards on screen
    await expect(dashboardPage.resultsSummary).toContainText(`Showing ${cardCount} results`);
  });

  for (const data of productData.search) {
    test(`${data.id}: search by ${data.scenario} @regression`, async () => {
      await dashboardPage.searchProduct(data.searchText);

      await expect(dashboardPage.productCard(data.expectedProduct)).toBeVisible();
      // Every product still shown must start with the search text
      for (const name of await dashboardPage.productNames.allTextContents()) {
        expect(name.startsWith(data.searchText)).toBe(true);
      }
    });
  }

  test(`${productData.knownBugs.caseInsensitiveSearch.id}: search ignores upper/lower case @regression`, async () => {
    // Known bug: search is case-sensitive. The page shows "ZARA COAT 3", but typing "zara" finds nothing.
    // test.fail() marks this test as EXPECTED to fail. If the bug is ever fixed, this test will
    // "unexpectedly pass" and turn red, reminding us to remove test.fail().
    test.fail(true, 'Bug: product search is case-sensitive');

    const data = productData.knownBugs.caseInsensitiveSearch;
    await dashboardPage.searchProduct(data.searchText);

    await expect(dashboardPage.productCard(data.expectedProduct)).toBeVisible({ timeout: 5_000 });
  });

  test(`${productData.categoryFilter.id}: filter by category shows only that category @regression`, async () => {
    const category = productData.categoryFilter.category;

    // filterByCategory returns the server's answer, so we can compare page and data
    const response = await dashboardPage.filterByCategory(category);
    const body = await response.json();

    // Every product the server returned belongs to the chosen category...
    for (const product of body.data) {
      expect(product.productCategory).toBe(category);
    }
    // ...and the page shows exactly that many cards
    await expect(dashboardPage.productCards).toHaveCount(body.data.length);
  });

  test('TC_PROD_04: product details match the product card @regression', async ({ page }) => {
    const productName = productData.productToView;
    const card = dashboardPage.productCard(productName);
    const cardPrice = await card.locator('.text-muted').textContent();

    await dashboardPage.viewProduct(productName);

    const detailsPage = new ProductDetailsPage(page);
    await expect(page).toHaveURL(/product-details/);
    await expect(detailsPage.productName).toHaveText(productName);
    await expect(detailsPage.productPrice).toHaveText(cardPrice!.trim());
    await expect(detailsPage.addToCartButton).toBeVisible();
  });
});
