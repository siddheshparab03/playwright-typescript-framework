import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the Cart page (/client/#/dashboard/cart).
 */
export class CartPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly cartItems: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly totalAmount: Locator;
  readonly emptyCartMessage: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // getByRole heading + name: the "My Cart" title
    this.heading = page.getByRole('heading', { name: 'My Cart' });

    // CSS tag + class: every <li> inside the element with class "cart" (one per product)
    this.cartItems = page.locator('div.cart li');

    // Chaining + getByRole: the <h3> heading inside each cart item (product name)
    this.itemNames = this.cartItems.getByRole('heading', { level: 3 });

    // CSS class chain: the price paragraph inside each item's .prodTotal block
    this.itemPrices = this.cartItems.locator('.prodTotal p');

    // XPath with a condition on a child: the <li> whose label span says "Total",
    // then its value span. Text-based XPath like this is useful when there are no ids.
    this.totalAmount = page.locator("xpath=//li[span[text()='Total']]/span[@class='value']");

    // getByText: the message shown when the cart has no products
    this.emptyCartMessage = page.getByText('No Products in Your Cart !');

    // getByRole with a regular expression name: matches "Checkout" with or without the arrow
    this.checkoutButton = page.getByRole('button', { name: /Checkout/ });
  }

  async goto() {
    // Start listening BEFORE navigating, so the request cannot finish before we listen
    const responsePromise = this.page.waitForResponse((response) =>
      response.url().includes('get-cart-products'),
    );
    // This is a single-page app: going to the URL we are already on does nothing,
    // so the cart would not be fetched again. Reload in that case instead.
    if (this.page.url().includes('/dashboard/cart')) {
      await this.page.reload();
    } else {
      await this.page.goto('/client/#/dashboard/cart');
    }
    await responsePromise;
    await this.waitForCartToLoad();
  }

  /**
   * Call after the cart data has arrived. While loading, the page briefly shows the
   * "No Products" message, so this check alone is not enough: wait for the response first.
   */
  async waitForCartToLoad() {
    await expect(this.heading).toBeVisible();
    // or(): passes when either locator becomes visible
    await expect(this.cartItems.first().or(this.emptyCartMessage)).toBeVisible();
  }

  async removeItem(productName: string) {
    // filter + CSS class: the red delete button inside the item with this name
    await this.cartItems.filter({ hasText: productName }).locator('.btn-danger').click();
  }

  /** Deletes items one by one until the cart is empty (test clean-up). */
  async emptyCart() {
    let count = await this.cartItems.count();
    while (count > 0) {
      await this.cartItems.first().locator('.btn-danger').click();
      count--;
      await expect(this.cartItems).toHaveCount(count);
    }
    await expect(this.emptyCartMessage).toBeVisible();
  }

  /** Converts every item price like "$ 11500" into the number 11500. */
  async getItemPrices(): Promise<number[]> {
    const texts = await this.itemPrices.allTextContents();
    return texts.map((text) => Number(text.replace(/[^0-9.]/g, '')));
  }

  async getTotal(): Promise<number> {
    const text = await this.totalAmount.textContent();
    return Number((text ?? '').replace(/[^0-9.]/g, ''));
  }
}
