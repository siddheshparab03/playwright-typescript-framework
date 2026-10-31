import { test, expect } from '@playwright/test';
import apiData from '../../test-data/apiData.json';
import { getCredentials } from '../../utils/testUsers';
import { ApiClient } from '../../utils/apiClient';

// Uses the main account: the browser tests that use it (login, products) never look at orders,
// so creating and deleting orders here cannot disturb them.
// The two tests below share that account's order list, so they run one after another.
test.describe.configure({ mode: 'default' });

test.describe('API: orders', () => {
  let api: ApiClient;

  test.beforeEach(async ({ request }) => {
    const { email, password } = getCredentials('main');
    api = await ApiClient.login(request, email, password);
    await api.deleteAllOrders();
  });

  test.afterEach(async () => {
    await api.deleteAllOrders();
  });

  test('TC_API_09: an order can be created, read, listed and deleted @api', async ({ request }) => {
    const product = await api.findProduct(apiData.product);

    // Create
    const created = await request.post('/api/ecom/order/create-order', {
      headers: api.authHeaders,
      data: { orders: [{ country: apiData.country, productOrderedId: product._id }] },
    });
    expect(created.status()).toBe(201);
    const createdBody = await created.json();
    expect(createdBody.message).toBe(apiData.messages.orderPlaced);
    const orderId: string = createdBody.orders[0];

    // Read
    const details = await request.get(`/api/ecom/order/get-orders-details?id=${orderId}`, {
      headers: api.authHeaders,
    });
    expect(details.status()).toBe(200);
    expect((await details.json()).data).toEqual(
      expect.objectContaining({
        _id: orderId,
        productOrderedId: product._id,
        productName: product.productName,
        country: apiData.country,
        orderBy: getCredentials('main').email,
      }),
    );

    // List
    const orderIds = (await api.getOrders()).map((order) => order._id);
    expect(orderIds).toContain(orderId);

    // Delete
    const deleted = await request.delete(`/api/ecom/order/delete-order/${orderId}`, {
      headers: api.authHeaders,
    });
    expect(deleted.status()).toBe(200);
    expect((await deleted.json()).message).toBe(apiData.messages.orderDeleted);
    expect(await api.getOrders()).toHaveLength(0);
  });

  test('TC_API_10: "my orders" returns the product id of each order @api', async ({ request }) => {
    // Known bug: in this list, productOrderedId holds the order DATE (e.g. "Sat Oct 31")
    // instead of the product id. get-orders-details returns the id correctly.
    test.fail(true, 'Bug: get-orders-for-customer returns a date in productOrderedId');

    const product = await api.findProduct(apiData.product);
    await api.createOrder(apiData.product, apiData.country);

    const response = await request.get(`/api/ecom/order/get-orders-for-customer/${api.userId}`, {
      headers: api.authHeaders,
    });

    expect(response.status()).toBe(200);
    expect((await response.json()).data[0].productOrderedId).toBe(product._id);
  });
});
