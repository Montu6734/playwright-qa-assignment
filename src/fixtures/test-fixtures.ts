import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SauceUsers, SAUCE_PASSWORD } from '../test-data/users';
import { PostsClient } from '../api/PostsClient';
import { config } from '../config/env';
import { createLogger, type Logger } from '../utils/logger';

interface Fixtures {
  authenticatedPage: Page;
  apiClient: PostsClient;
  logger: Logger;
}

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(SauceUsers.standard, SAUCE_PASSWORD);
    await expect(page.locator('.inventory_list')).toBeVisible();
    await use(page);
  },

  apiClient: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({
      baseURL: config.apiBaseURL,
      timeout: config.apiTimeoutMs,
    });
    await use(new PostsClient(request));
    await request.dispose();
  },

  logger: async ({}, use, testInfo) => {
    await use(createLogger(testInfo.title));
  },
});

export { expect };
