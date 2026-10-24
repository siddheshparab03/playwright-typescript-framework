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
pages/                 Page Objects: locators and actions for each page
test-data/             JSON test data for data-driven tests
utils/                 Small shared helpers (e.g. reading .env values)
playwright.config.ts   Playwright settings (browser, base URL, reports)
.env.example           Template for environment variables
```

## Test accounts

The site empties an account's cart whenever that account logs in. Tests that use the cart
therefore have their own account, so other tests logging in cannot wipe their cart.

| Account (`.env`) | Used by |
| --- | --- |
| `USER_EMAIL` / `USER_PASSWORD` | Login and product tests |
| `CART_USER_EMAIL` / `CART_USER_PASSWORD` | Cart tests only |

Do not log in to the site with the cart account while the cart tests are running.
