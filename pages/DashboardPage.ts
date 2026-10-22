import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the Dashboard (Home) page (/client/#/dashboard/dash).
 * Step 2 only needs the header; products and filters are added in Step 3.
 */
export class DashboardPage {
  readonly page: Page;
  readonly signOutButton: Locator;
  readonly ordersButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // XPath locator: //tag[condition]; contains(., 'text') checks all text inside the button
    this.signOutButton = page.locator("xpath=//button[contains(., 'Sign Out')]");

    // CSS attribute locator with *= : routerlink attribute that CONTAINS "myorders"
    this.ordersButton = page.locator('button[routerlink*="myorders"]');
  }

  async goto() {
    await this.page.goto('/client/#/dashboard/dash');
  }

  async signOut() {
    await this.signOutButton.click();
  }
}
