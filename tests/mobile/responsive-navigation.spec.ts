import { test, expect } from '../../src/fixtures/test-fixtures';
import { LoginPage } from '../../src/pages/LoginPage';
import { InventoryPage } from '../../src/pages/InventoryPage';
import { SauceUsers, SAUCE_PASSWORD } from '../../src/test-data/users';
import { getProducts } from '../../src/test-data/products';

test.describe('Mobile Emulation Testing', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(SauceUsers.standard, SAUCE_PASSWORD);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('responsive layout: inventory grid fits within the viewport with no horizontal overflow', async ({ page }) => {
    const bodyScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 0;

    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test('mobile navigation: burger menu opens and provides logout/all items links', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.openBurgerMenu();

    await expect(page.locator('#logout_sidebar_link')).toBeVisible();
    await expect(page.locator('#inventory_sidebar_link')).toBeVisible();
    await expect(page.locator('#reset_sidebar_link')).toBeVisible();
  });

  test('mobile navigation: logout via burger menu returns to the login page', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.logout();

    await expect(page).toHaveURL(/\/$|index\.html/);
    await expect(page.locator('#login-button')).toBeVisible();
  });

  test('touch interaction: tapping "Add to cart" updates the cart badge', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const [product] = getProducts(1);

    await page.locator('.inventory_item').filter({ hasText: product }).getByRole('button', { name: 'Add to cart' }).tap();

    expect(await inventoryPage.getCartBadgeCount()).toBe(1);
  });

  test('touch interaction: tapping the product sort dropdown changes ordering', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const namesBefore = await inventoryPage.getProductNames();

    await inventoryPage.sortBy('za');

    const namesAfter = await inventoryPage.getProductNames();
    expect(namesAfter).not.toEqual(namesBefore);
    expect([...namesAfter].sort().reverse()).toEqual(namesAfter);
  });
});
