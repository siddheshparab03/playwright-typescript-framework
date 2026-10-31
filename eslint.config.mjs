// ESLint checks the code for mistakes before it runs (run it with: npm run lint).
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default defineConfig(
  // Folders that are generated or not ours
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'playwright/', 'postman/'] },

  // General JavaScript and TypeScript rules
  js.configs.recommended,
  tseslint.configs.recommended,

  // Rules that need TypeScript's type information (reads tsconfig.json)
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // A Promise that is not awaited: e.g. `page.click()` without `await` runs in the background
      // and the test moves on too early. This is the most common Playwright beginner bug.
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },

  // Playwright's own rules: missing await on expect(), page.pause() left in, test.only, ...
  {
    files: ['tests/**/*.ts', 'pages/**/*.ts', 'fixtures/**/*.ts'],
    ...playwright.configs['flat/recommended'],
  },

  // Turns off style rules that Prettier handles, so the two tools never disagree. Keep it last.
  prettier,
);
