import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the Checkout page (/client/#/dashboard/order?prop=[...]):
 * order summary, card details, coupon, shipping details and Place Order.
 */
export class CheckoutPage {
  readonly page: Page;
  readonly itemTitles: Locator;
  readonly itemPrices: Locator;
  readonly cardNumberInput: Locator;
  readonly cvvInput: Locator;
  readonly nameOnCardInput: Locator;
  readonly couponInput: Locator;
  readonly applyCouponButton: Locator;
  readonly couponMessage: Locator;
  readonly shippingEmailInput: Locator;
  readonly countryInput: Locator;
  readonly countryOptions: Locator;
  readonly placeOrderButton: Locator;
  readonly shippingErrorToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    this.page = page;

    // CSS class locator: product name(s) in the order summary on the left
    this.itemTitles = page.locator('.item__title');
    this.itemPrices = page.locator('.item__price');

    // XPath following-sibling: the input that comes right AFTER the title "Credit Card Number".
    // These fields have no id, name or linked label, so we find them through the title next to them.
    this.cardNumberInput = page.locator(
      "xpath=//div[@class='title' and contains(., 'Credit Card Number')]/following-sibling::input",
    );
    this.cvvInput = page.locator(
      "xpath=//div[@class='title' and contains(., 'CVV Code')]/following-sibling::input",
    );
    this.nameOnCardInput = page.locator(
      "xpath=//div[@class='title' and contains(., 'Name on Card')]/following-sibling::input",
    );

    // CSS attribute locator: the coupon box is the only field with name="coupon"
    this.couponInput = page.locator('input[name="coupon"]');
    this.applyCouponButton = page.getByRole('button', { name: 'Apply Coupon' });

    // filter with a regular expression: the <p> that shows the coupon result
    this.couponMessage = page.locator('p').filter({ hasText: /Coupon Applied|Invalid Coupon/ });

    // CSS child combinator '>': an <input> that is a DIRECT child of .user__name
    this.shippingEmailInput = page.locator('.user__name > input');

    this.countryInput = page.getByPlaceholder('Select Country');

    // CSS class + tag: the suggestion buttons shown while typing a country
    this.countryOptions = page.locator('.ta-results button');

    // getByText: the "Place Order" link (it is an <a> without href, so it has no button/link role)
    this.placeOrderButton = page.getByText('Place Order');

    // CSS class locator: this error toast has no role="alert", so find it by its class
    this.shippingErrorToast = page.locator('.toast-error');

    // Any error toast on this page (used to check that invalid input is rejected)
    this.errorToast = page.locator('#toast-container .toast-error');
  }

  async waitForPageToLoad() {
    await expect(this.page).toHaveURL(/dashboard\/order/);
    await expect(this.countryInput).toBeVisible();
  }

  /**
   * Types the start of a country name slowly (the suggestion list reacts to real key presses),
   * then clicks the option whose text is exactly the country name.
   */
  async selectCountry(searchText: string, countryName: string) {
    await this.countryInput.pressSequentially(searchText, { delay: 100 });
    await expect(this.countryOptions.first()).toBeVisible();
    // Exact text match, so "India" does not pick "British Indian Ocean Territory"
    await this.countryOptions.filter({ hasText: new RegExp(`^\\s*${countryName}\\s*$`) }).click();
    await expect(this.countryInput).toHaveValue(countryName);
  }

  async applyCoupon(code: string) {
    await this.couponInput.fill(code);
    await this.applyCouponButton.click();
  }

  async placeOrder() {
    await this.placeOrderButton.click();
  }
}
