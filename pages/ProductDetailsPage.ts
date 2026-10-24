import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the Product Details page (/client/#/dashboard/product-details/<id>).
 */
export class ProductDetailsPage {
  readonly page: Page;
  readonly productName: Locator;
  readonly productPrice: Locator;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Built-in locator: getByRole('heading', { level: 2 }) - the <h2> heading (product name)
    this.productName = page.getByRole('heading', { level: 2 });

    // CSS tag locator: the <h3> right after the name holds the price
    this.productPrice = page.locator('h2 + h3');

    // getByRole with exact: true - "Add to Cart" only, not other buttons containing those words
    this.addToCartButton = page.getByRole('button', { name: 'Add to Cart', exact: true });
  }
}
