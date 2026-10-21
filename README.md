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
| `npm run test:ui` | Open Playwright UI mode |
| `npm run report` | Open the last HTML report |

## Project structure

```
tests/                 Test files (*.spec.ts)
playwright.config.ts   Playwright settings (browser, base URL, reports)
.env.example           Template for environment variables
```
