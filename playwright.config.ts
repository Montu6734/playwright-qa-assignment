import { defineConfig, devices } from '@playwright/test';
import { config } from './src/config/env';

/**
 * Each project owns its own `testDir` (instead of one shared testDir + regex
 * filtering) so a spec can never accidentally run under the wrong project.
 * See README for the full part-to-project mapping.
 */
export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: process.env.CI
    ? [['list'], ['blob'], ['allure-playwright', { resultsDir: 'allure-results', detail: true, suiteTitle: true }]]
    : [
        ['list'],
        ['html', { open: 'never' }],
        ['allure-playwright', { resultsDir: 'allure-results', detail: true, suiteTitle: true }],
      ],

  use: {
    baseURL: config.baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
  },

  projects: [
    // Part 1 (Authentication / Shopping / Checkout) + Part 3 (cross-browser)
    { name: 'chromium', testDir: './tests/ui', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testDir: './tests/ui', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testDir: './tests/ui', use: { ...devices['Desktop Safari'] } },

    // Part 4 — mobile emulation
    { name: 'Mobile Safari - iPhone 14', testDir: './tests/mobile', use: { ...devices['iPhone 14'] } },
    { name: 'Mobile Chrome - Pixel 7', testDir: './tests/mobile', use: { ...devices['Pixel 7'] } },

    // Part 6 — accessibility
    { name: 'accessibility', testDir: './tests/accessibility', use: { ...devices['Desktop Chrome'] } },

    // Part 5 — performance & network monitoring
    { name: 'performance', testDir: './tests/performance', use: { ...devices['Desktop Chrome'] } },

    // Part 2 — API (no browser device needed)
    { name: 'api', testDir: './tests/api', use: { baseURL: config.apiBaseURL } },
  ],
});
