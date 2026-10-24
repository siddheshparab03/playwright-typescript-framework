import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for one order's summary (/client/#/dashboard/order-details/<order id>).
 */
export class OrderDetailsPage {
  readonly page: Page;
  readonly orderId: Locator;
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly billingAddress: Locator;
  readonly deliveryAddress: Locator;

  constructor(page: Page) {
    this.page = page;

    // CSS: two classes on the same element (.col-text AND .-main)
    this.orderId = page.locator('.col-text.-main');

    // CSS descendant: .title inside the product card
    this.productTitle = page.locator('.artwork-card-info .title');
    this.productPrice = page.locator('.artwork-card-info .price');

    // filter({ has }): the .address block that CONTAINS a title with this text
    this.billingAddress = page
      .locator('.address')
      .filter({ has: page.getByText('Billing Address') });
    this.deliveryAddress = page
      .locator('.address')
      .filter({ has: page.getByText('Delivery Address') });
  }
}
