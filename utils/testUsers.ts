import { getRequiredEnv } from './env';

/**
 * The test accounts and the file where each one's saved login is stored.
 * Each group of tests that changes shared data (cart, orders) has its own account,
 * because the site empties an account's cart whenever that account logs in.
 */
export const testUsers = {
  main: {
    emailVariable: 'USER_EMAIL',
    passwordVariable: 'USER_PASSWORD',
    storageStateFile: 'playwright/.auth/main-user.json',
  },
  cart: {
    emailVariable: 'CART_USER_EMAIL',
    passwordVariable: 'CART_USER_PASSWORD',
    storageStateFile: 'playwright/.auth/cart-user.json',
  },
  order: {
    emailVariable: 'ORDER_USER_EMAIL',
    passwordVariable: 'ORDER_USER_PASSWORD',
    storageStateFile: 'playwright/.auth/order-user.json',
  },
} as const;

export type TestUserName = keyof typeof testUsers;

/** Email and password of one account, read from .env. */
export function getCredentials(userName: TestUserName) {
  const user = testUsers[userName];
  return {
    email: getRequiredEnv(user.emailVariable),
    password: getRequiredEnv(user.passwordVariable),
  };
}
