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
| `npm test` | Run all tests (headless); cart tests run last |
| `npm run test:headed` | Run tests with the browser visible |
| `npm run test:smoke` | Run only tests tagged `@smoke`, one at a time |
| `npm run test:regression` | Run only tests tagged `@regression`, one at a time |
| `npx playwright test tests/cart.spec.ts --no-deps` | Run only the cart tests |
| `npm run typecheck` | Check TypeScript for errors without running tests |
| `npm run test:ui` | Open Playwright UI mode |
| `npm run report` | Open the last HTML report |

## Project structure

```
tests/                 Test files (*.spec.ts): what to check
pages/                 Page Objects: locators and actions for each page
test-data/             JSON test data for data-driven tests
playwright.config.ts   Playwright settings (browser, base URL, reports)
.env.example           Template for environment variables
```

## Known constraint: one shared cart

All tests use one account, and the site empties that account's cart whenever it logs in.
So the cart tests run in a separate project (`chromium-cart`) that starts after every other
test has finished, and the tag-based scripts run one test at a time. Logging in to the site
yourself while the cart tests run can also make them fail.
