# Playwright Automation – Let's Shop

UI automation framework built with [Playwright](https://playwright.dev) and TypeScript for the
[Let's Shop](https://rahulshettyacademy.com/client/#/auth/login) practice e-commerce app.

## Prerequisites

- Node.js 18 or later
- Git

## Setup

```bash
npm install                      # install project packages
npx playwright install chromium  # download the browser
cp .env.example .env             # then put your login details in .env
```

## Running tests

| Command | What it does |
| --- | --- |
| `npm test` | Run all tests (headless) |
| `npm run test:headed` | Run tests with the browser visible |
| `npm run test:smoke` | Run only tests tagged `@smoke` |
| `npm run test:regression` | Run only tests tagged `@regression` |
| `npx playwright test tests/cart.spec.ts` | Run only the cart tests |
| `npm run typecheck` | Check TypeScript for errors without running tests |
| `npm run test:ui` | Open Playwright UI mode |
| `npm run report` | Open the last HTML report |

## Project structure

```
tests/                 Test files (*.spec.ts): what to check
tests/auth.setup.ts    Logs in once per test account before the tests run
pages/                 Page Objects: locators and actions for each page
fixtures/pages.ts      Gives tests their page objects, e.g. async ({ cartPage }) => ...
test-data/             JSON test data for data-driven tests
utils/                 Small shared helpers (reading .env values, test accounts)
playwright.config.ts   Playwright settings (browser, base URL, reports, setup project)
playwright/.auth/      Saved logins created by the setup (git-ignored: contains tokens)
.env.example           Template for environment variables
```

## How a run works

1. The `setup` project (`tests/auth.setup.ts`) logs in once with each account in `.env` and
   saves the logged-in browser state to `playwright/.auth/`.
2. The `chromium` project then runs the tests. Product, cart and order tests load their
   account's saved login with `test.use({ storageState })`, so they start already logged in.
   Login tests start logged out, because they test the login screen itself.
3. A failed test is retried once (twice on CI); a test that passes on retry is reported as flaky.

## Continuous integration (GitHub Actions)

`.github/workflows/playwright.yml` runs the type check and all tests on GitHub for every pull
request and every push to `main`. It can also be started by hand from the **Actions** tab.

- **Accounts:** read from repository secrets (Settings > Secrets and variables > Actions):
  `USER_EMAIL`, `USER_PASSWORD`, `CART_USER_EMAIL`, `CART_USER_PASSWORD`, `ORDER_USER_EMAIL`,
  `ORDER_USER_PASSWORD`.
- **Retries:** 2 on CI (1 locally).
- **Report:** download `playwright-report` from the run's **Artifacts**, unzip it, and run
  `npx playwright show-report <folder>`.
- **One run at a time:** CI runs use the same accounts, so a new run waits for the previous one.
  Avoid running the tests locally while a CI run is in progress, for the same reason.

## Test accounts

The site empties an account's cart whenever that account logs in. Tests that use the cart
therefore have their own account, so other tests logging in cannot wipe their cart.

| Account (`.env`) | Used by |
| --- | --- |
| `USER_EMAIL` / `USER_PASSWORD` | Login and product tests |
| `CART_USER_EMAIL` / `CART_USER_PASSWORD` | Cart tests only |
| `ORDER_USER_EMAIL` / `ORDER_USER_PASSWORD` | Checkout and order tests only (their orders are deleted after each test) |

Do not log in to the site with the cart or order account while their tests are running.

## Known bugs covered by `test.fail()`

| Test | Bug |
| --- | --- |
| TC_PROD_05 | Product search is case-sensitive ("zara" does not find "ZARA COAT 3") |
| TC_ORDER_07 | Checkout places the order with CVV and Name on Card empty |

These tests are expected to fail. If one starts passing, the bug was fixed: remove `test.fail()`.
