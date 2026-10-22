import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the Dashboard (Home) page (/client/#/dashboard/dash):
 * header buttons, product list, search and filters.
 */
export class DashboardPage {
  readonly page: Page;
  readonly signOutButton: Locator;
  readonly ordersButton: Locator;
  readonly cartButton: Locator;
  readonly cartCount: Locator;
  readonly searchBox: Locator;
  readonly resultsSummary: Locator;
  readonly productCards: Locator;
  readonly productNames: Locator;

  constructor(page: Page) {
    this.page = page;

    // XPath locator: //tag[condition]; contains(., 'text') checks all text inside the button
    this.signOutButton = page.locator("xpath=//button[contains(., 'Sign Out')]");

    // CSS attribute locator with *= : routerlink attribute that CONTAINS "myorders"
    this.ordersButton = page.locator('button[routerlink*="myorders"]');

    // CSS attribute locator with = : routerlink attribute that EQUALS this exact value
    this.cartButton = page.locator('button[routerlink="/dashboard/cart"]');

    // Chaining: look for a <label> only INSIDE the cart button (the red number badge)
    this.cartCount = this.cartButton.locator('label');

    // getByPlaceholder + filter({ visible: true }): the page has 2 search boxes
    // (one is a hidden copy for mobile); keep only the one the user can see
    this.searchBox = page.getByPlaceholder('search').filter({ visible: true });

    // CSS id locator: the "Showing 3 results" text
    this.resultsSummary = page.locator('#res');

    // CSS class locator: one element per product card
    this.productCards = page.locator('.card-body');

    // CSS descendant locator: a <b> tag anywhere inside a .card-body (the product name)
    this.productNames = page.locator('.card-body b');
  }

  async goto() {
    await this.page.goto('/client/#/dashboard/dash');
  }

  async signOut() {
    await this.signOutButton.click();
  }

  /** One product card, picked by its name. */
  productCard(productName: string): Locator {
    // filter({ hasText }): keep only the card that contains this product name
    return this.productCards.filter({ hasText: productName });
  }

  /**
   * Starts listening for the product list request. Call it BEFORE the action that triggers
   * the request, then await it AFTER, so the page has the new results before we check them.
   */
  waitForProductsResponse() {
    return this.page.waitForResponse((response) => response.url().includes('get-all-products'));
  }

  async searchProduct(searchText: string) {
    const responsePromise = this.waitForProductsResponse();
    await this.searchBox.fill(searchText);
    await this.searchBox.press('Enter');
    await responsePromise;
  }

  async filterByCategory(category: string) {
    const responsePromise = this.waitForProductsResponse();
    // filter + getByRole('checkbox'): find the visible block whose text is exactly the
    // category, then the checkbox inside it (getByLabel cannot be used: labels are not linked)
    await this.page
      .locator('.form-group')
      .filter({ hasText: new RegExp(`^${category}$`), visible: true })
      .getByRole('checkbox')
      .check();
    return responsePromise;
  }

  async addProductToCart(productName: string) {
    await this.productCard(productName).getByRole('button', { name: 'Add To Cart' }).click();
  }

  async viewProduct(productName: string) {
    await this.productCard(productName).getByRole('button', { name: 'View' }).click();
  }

  async openCart() {
    // The cart page loads its items from the server; wait for that request to finish
    const responsePromise = this.page.waitForResponse((response) =>
      response.url().includes('get-cart-products'),
    );
    await this.cartButton.click();
    await responsePromise;
  }
}
