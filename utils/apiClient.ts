import { readFileSync } from 'node:fs';
import { type APIRequestContext, type APIResponse, expect } from '@playwright/test';

/** A product as the API returns it (only the fields we use). */
type Product = {
  _id: string;
  productName: string;
  productPrice: number;
};

/** An order as the API returns it (only the fields we use). */
type Order = {
  _id: string;
  productName: string;
  country: string;
};

/**
 * Talks to the Let's Shop server directly, without the browser.
 * Tests use it to PREPARE and CLEAN UP data in about a second (empty the cart, create or delete
 * an order), so the browser is only used for what the test is really checking.
 *
 * It logs in with the token that tests/auth.setup.ts saved, so it acts on the same account as the
 * test's browser. (Logging in again would empty that account's cart.)
 */
export class ApiClient {
  private readonly request: APIRequestContext;
  private readonly token: string;
  readonly userId: string;

  constructor(request: APIRequestContext, token: string) {
    this.request = request;
    this.token = token;
    // The token is a JWT: header.payload.signature. The payload is readable JSON with the user's _id.
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    this.userId = payload._id;
  }

  /** Reads the login token from a saved-login file (playwright/.auth/<user>.json). */
  static fromStorageState(request: APIRequestContext, storageStateFile: string): ApiClient {
    const state = JSON.parse(readFileSync(storageStateFile, 'utf8'));
    const item = state.origins
      .flatMap((origin: { localStorage: { name: string; value: string }[] }) => origin.localStorage)
      .find((entry: { name: string }) => entry.name === 'token');
    if (!item) {
      throw new Error(`No login token in ${storageStateFile}. Did the setup project run?`);
    }
    return new ApiClient(request, item.value);
  }

  /** The site expects the token as-is in the Authorization header (no "Bearer " in front). */
  private get headers() {
    return { Authorization: this.token };
  }

  /** Fails the test with a clear message if the server did not answer with a 2xx status. */
  private async expectOk(response: APIResponse, action: string) {
    await expect(response, `API call failed: ${action}`).toBeOK();
  }

  async getProducts(): Promise<Product[]> {
    const response = await this.request.post('/api/ecom/product/get-all-products', {
      headers: this.headers,
      data: {
        productName: '',
        minPrice: null,
        maxPrice: null,
        productCategory: [],
        productSubCategory: [],
        productFor: [],
      },
    });
    await this.expectOk(response, 'get all products');
    return (await response.json()).data;
  }

  async findProduct(productName: string): Promise<Product> {
    const product = (await this.getProducts()).find((p) => p.productName === productName);
    if (!product) {
      throw new Error(`Product "${productName}" not found in the shop`);
    }
    return product;
  }

  async addToCart(productName: string) {
    const product = await this.findProduct(productName);
    // The API wants the whole product object, exactly as get-all-products returned it
    const response = await this.request.post('/api/ecom/user/add-to-cart', {
      headers: this.headers,
      data: { _id: this.userId, product },
    });
    await this.expectOk(response, `add "${productName}" to the cart`);
  }

  async getCartProducts(): Promise<Product[]> {
    const response = await this.request.get(`/api/ecom/user/get-cart-products/${this.userId}`, {
      headers: this.headers,
    });
    await this.expectOk(response, 'get cart products');
    // An empty cart has no "products" field, only the message "No Product in Cart"
    return (await response.json()).products ?? [];
  }

  async emptyCart() {
    for (const product of await this.getCartProducts()) {
      const response = await this.request.delete(
        `/api/ecom/user/remove-from-cart/${this.userId}/${product._id}`,
        { headers: this.headers },
      );
      await this.expectOk(response, `remove "${product.productName}" from the cart`);
    }
  }

  /**
   * Creates an order directly and returns its id. Unlike the checkout page, the API needs no
   * card details and no cart (and it empties the cart afterwards).
   */
  async createOrder(productName: string, country: string): Promise<string> {
    const product = await this.findProduct(productName);
    const response = await this.request.post('/api/ecom/order/create-order', {
      headers: this.headers,
      data: { orders: [{ country, productOrderedId: product._id }] },
    });
    await this.expectOk(response, `create an order for "${productName}"`);
    return (await response.json()).orders[0];
  }

  async getOrders(): Promise<Order[]> {
    const response = await this.request.get(
      `/api/ecom/order/get-orders-for-customer/${this.userId}`,
      { headers: this.headers },
    );
    await this.expectOk(response, 'get my orders');
    return (await response.json()).data ?? [];
  }

  async deleteAllOrders() {
    for (const order of await this.getOrders()) {
      const response = await this.request.delete(`/api/ecom/order/delete-order/${order._id}`, {
        headers: this.headers,
      });
      await this.expectOk(response, `delete order ${order._id}`);
    }
  }
}
