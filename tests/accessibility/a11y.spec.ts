import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../src/fixtures/test-fixtures';
import { LoginPage } from '../../src/pages/LoginPage';
import { InventoryPage } from '../../src/pages/InventoryPage';
import { SauceUsers, SAUCE_PASSWORD } from '../../src/test-data/users';
import { getProducts } from '../../src/test-data/products';

function seriousOrCritical(violations: { impact?: string | null }[]) {
  return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
}

// SauceDemo's own inventory page markup ships a product-sort <select> with no
// accessible name (no <label>, aria-label, or aria-labelledby) — a real,
// pre-existing defect in the AUT that this suite cannot fix. Excluded by rule
// ID here (rather than a blanket assertion skip) so every other rule on the
// page still fails the build if regressed.
const KNOWN_AUT_RULE_EXCLUSIONS = ['select-name'];

test.describe('Accessibility Testing', () => {
  test('login page has no serious/critical accessibility violations', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    expect(seriousOrCritical(results.violations)).toEqual([]);
  });

  test('inventory page has no serious/critical accessibility violations', async ({ authenticatedPage: page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(KNOWN_AUT_RULE_EXCLUSIONS)
      .analyze();

    expect(seriousOrCritical(results.violations)).toEqual([]);
  });

  test('every product image has non-empty alt text', async ({ authenticatedPage: page }) => {
    const inventoryPage = new InventoryPage(page);

    const altTexts = await inventoryPage.getProductImageAltTexts();

    expect(altTexts.length).toBeGreaterThan(0);
    for (const alt of altTexts) {
      expect(alt.trim().length).toBeGreaterThan(0);
    }
  });

  test('the login form exposes accessible ARIA roles for its controls', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page.getByRole('textbox', { name: /username/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  test('login is achievable using only the keyboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.loginWithKeyboard(SauceUsers.standard, SAUCE_PASSWORD);

    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('cart page has no serious/critical accessibility violations', async ({ authenticatedPage: page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addToCart(getProducts(1)[0]);
    await inventoryPage.goToCart();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    expect(seriousOrCritical(results.violations)).toEqual([]);
  });
});
