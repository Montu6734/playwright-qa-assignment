import { test, expect } from '../../../src/fixtures/test-fixtures';
import { LoginPage } from '../../../src/pages/LoginPage';
import { SauceUsers, SAUCE_PASSWORD, emptyCredentialsCases } from '../../../src/test-data/users';
import { config } from '../../../src/config/env';

test.describe('Authentication Flow', () => {
  test('valid login navigates to the inventory page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(SauceUsers.standard, SAUCE_PASSWORD);

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('invalid login (locked out user) shows a specific error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(SauceUsers.lockedOut, SAUCE_PASSWORD);

    await expect(page).toHaveURL(config.baseURL + '/');
    await expect(loginPage.isErrorVisible()).resolves.toBe(true);
    expect(await loginPage.getErrorText()).toContain('locked out');
  });

  test('invalid login (wrong password) shows a generic error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(SauceUsers.standard, 'wrong-password');

    expect(await loginPage.getErrorText()).toContain('do not match');
  });

  for (const { label, username, password } of emptyCredentialsCases) {
    test(`empty credentials validation: ${label}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(username, password);

      await expect(loginPage.isErrorVisible()).resolves.toBe(true);
      expect(await loginPage.getErrorText()).toContain('required');
    });
  }

  test('session persists across a page reload', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(SauceUsers.standard, SAUCE_PASSWORD);
    await expect(page).toHaveURL(/inventory\.html/);

    await page.reload();

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('a fresh context without a session is redirected away from the inventory page', async ({ browser }) => {
    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();

    await freshPage.goto(`${config.baseURL}/inventory.html`);

    await expect(freshPage).toHaveURL(config.baseURL + '/');
    await expect(freshPage.locator('[data-test="error"]')).toContainText('logged in');

    await freshContext.close();
  });
});
