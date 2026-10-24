import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the "Thank you" page shown after placing an order (/client/#/dashboard/thanks).
 */
export class OrderConfirmationPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly orderIdLabel: Locator;
  readonly ordersHistoryLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // getByRole heading: the text is "Thankyou for the order." (CSS only shows it in capitals)
    this.heading = page.getByRole('heading', { name: 'Thankyou for the order.' });

    // CSS tag + class + filter by pattern: the label holding "| <24-character order id> |"
    this.orderIdLabel = page.locator('label.ng-star-inserted').filter({ hasText: /[a-f0-9]{24}/ });

    // getByText: the "Orders History Page" link in the sentence under the heading
    this.ordersHistoryLink = page.getByText('Orders History Page');
  }

  /** Reads "| 6adc555ca90a419aa825bc0f |" and returns just the id. */
  async getOrderId(): Promise<string> {
    const text = (await this.orderIdLabel.textContent()) ?? '';
    return text.replace(/\|/g, '').trim();
  }
}
