import { test, expect } from '@playwright/test';
import apiData from '../../test-data/apiData.json';
import { getCredentials } from '../../utils/testUsers';
import { ApiClient } from '../../utils/apiClient';

test.describe('API: products', () => {
  let api: ApiClient;

  test.beforeEach(async ({ request }) => {
    const { email, password } = getCredentials('main');
    api = await ApiClient.login(request, email, password);
  });

  test('TC_API_06: product list returns products with the expected fields @api', async ({
    request,
  }) => {
    const response = await request.post('/api/ecom/product/get-all-products', {
      headers: api.authHeaders,
      data: { productName: '', productCategory: [], productSubCategory: [], productFor: [] },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.count).toBe(body.data.length);

    // Every product has an id, a name and a numeric price
    for (const product of body.data) {
      expect(product).toEqual(
        expect.objectContaining({
          _id: expect.stringMatching(/^[a-f0-9]{24}$/),
          productName: expect.any(String),
          productPrice: expect.any(Number),
        }),
      );
    }
  });

  test('TC_API_07: search returns only products starting with the search text @api', async ({
    request,
  }) => {
    const response = await request.post('/api/ecom/product/get-all-products', {
      headers: api.authHeaders,
      data: { productName: apiData.searchText },
    });

    expect(response.status()).toBe(200);
    const names: string[] = (await response.json()).data.map(
      (product: { productName: string }) => product.productName,
    );
    expect(names).toContain(apiData.product);
    for (const name of names) {
      expect(name.startsWith(apiData.searchText)).toBe(true);
    }
  });

  test('TC_API_08: product details match the product list @api', async ({ request }) => {
    const fromList = await api.findProduct(apiData.product);

    const response = await request.get(`/api/ecom/product/get-product-detail/${fromList._id}`, {
      headers: api.authHeaders,
    });

    expect(response.status()).toBe(200);
    const details = (await response.json()).data;
    expect(details._id).toBe(fromList._id);
    expect(details.productName).toBe(fromList.productName);
    expect(details.productPrice).toBe(fromList.productPrice);
  });
});
