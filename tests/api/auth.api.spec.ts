import { test, expect } from '@playwright/test';
import apiData from '../../test-data/apiData.json';
import { getCredentials } from '../../utils/testUsers';
import { ApiClient } from '../../utils/apiClient';

// API tests talk to the server directly: no browser, no screens.
// `request` is Playwright's HTTP client; it uses baseURL from playwright.config.ts.

const productsBody = {
  productName: '',
  minPrice: null,
  maxPrice: null,
  productCategory: [],
  productSubCategory: [],
  productFor: [],
};

test.describe('API: login and tokens', () => {
  test('TC_API_01: login with valid credentials returns a token @api', async ({ request }) => {
    const { email, password } = getCredentials('main');

    const response = await request.post('/api/ecom/auth/login', {
      data: { userEmail: email, userPassword: password },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.message).toBe(apiData.messages.loginSuccess);
    expect(body.userId).toMatch(/^[a-f0-9]{24}$/);

    // A JWT is header.payload.signature; the payload is readable JSON
    const payload = JSON.parse(Buffer.from(body.token.split('.')[1], 'base64url').toString());
    expect(payload.userEmail).toBe(email);
    expect(payload._id).toBe(body.userId);
  });

  test('TC_API_02: login with a wrong password returns 400 @api', async ({ request }) => {
    const response = await request.post('/api/ecom/auth/login', {
      data: { userEmail: getCredentials('main').email, userPassword: 'Wrong@999' },
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).message).toBe(apiData.messages.loginFailed);
  });

  test('TC_API_03: a request without a token is refused with 401 @api', async ({ request }) => {
    const response = await request.post('/api/ecom/product/get-all-products', {
      data: productsBody,
    });

    expect(response.status()).toBe(401);
    expect((await response.json()).message).toBe(apiData.messages.noToken);
  });

  test('TC_API_04: a request with a fake token is refused with 401 @api', async ({ request }) => {
    const response = await request.post('/api/ecom/product/get-all-products', {
      headers: { Authorization: 'not-a-real-token' },
      data: productsBody,
    });

    expect(response.status()).toBe(401);
    expect((await response.json()).message).toBe(apiData.messages.invalidToken);
  });

  test('TC_API_05: a token sent as "Bearer <token>" is refused with 401 @api', async ({
    request,
  }) => {
    // The site expects the bare token; the common "Bearer " format is not accepted
    const { email, password } = getCredentials('main');
    const api = await ApiClient.login(request, email, password);

    const response = await request.post('/api/ecom/product/get-all-products', {
      headers: { Authorization: `Bearer ${api.authHeaders.Authorization}` },
      data: productsBody,
    });

    expect(response.status()).toBe(401);
  });
});
