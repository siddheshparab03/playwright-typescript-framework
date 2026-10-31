import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the Orders history page (/client/#/dashboard/myorders).
 */
export class OrdersPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly orderRows: Locator;
  readonly noOrdersMessage: Locator;
  readonly deletedToast: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole('heading', { name: 'Your Orders' });

    // CSS descendant: every row inside the table body (one row per order)
    this.orderRows = page.locator('tbody tr');

    // getByText with a regular expression: matches the start of the longer message
    this.noOrdersMessage = page.getByText(/You have No Orders to show/);

    // getByRole('alert') + name: the success toast after deleting
    this.deletedToast = page.getByRole('alert', { name: 'Orders Deleted Successfully' });
  }

  async goto() {
    const responsePromise = this.page.waitForResponse((response) =>
      response.url().includes('get-orders-for-customer'),
    );
    if (this.page.url().includes('/dashboard/myorders')) {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
    } else {
      // 'domcontentloaded': do not wait for images (see LoginPage.goto)
      await this.page.goto('/client/#/dashboard/myorders', { waitUntil: 'domcontentloaded' });
    }
    await responsePromise;
    // The data has arrived; now wait until it is drawn: either order rows or the "No Orders" text
    // (with no orders the "Your Orders" heading is not shown at all)
    await expect(this.orderRows.first().or(this.noOrdersMessage)).toBeVisible();
  }

  /** The table row for one order. XPath: a <tr> whose <th> cell holds exactly this id. */
  orderRow(orderId: string): Locator {
    return this.page.locator(`xpath=//tbody/tr[th[normalize-space()='${orderId}']]`);
  }

  /** Product name cell of a row. nth(1): the 2nd <td> (columns: image, name, price, date, ...). */
  productNameCell(orderId: string): Locator {
    return this.orderRow(orderId).locator('td').nth(1);
  }

  /** Price cell of a row. nth(2): the 3rd <td>. */
  priceCell(orderId: string): Locator {
    return this.orderRow(orderId).locator('td').nth(2);
  }

  async viewOrder(orderId: string) {
    await this.orderRow(orderId).getByRole('button', { name: 'View' }).click();
  }

  async deleteOrder(orderId: string) {
    await this.orderRow(orderId).getByRole('button', { name: 'Delete' }).click();
  }
}
