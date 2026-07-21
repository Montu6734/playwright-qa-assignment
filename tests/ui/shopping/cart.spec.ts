import { test, expect } from '../../../src/fixtures/test-fixtures';
import { InventoryPage } from '../../../src/pages/InventoryPage';
import { CartPage } from '../../../src/pages/CartPage';
import { CheckoutStepOnePage } from '../../../src/pages/CheckoutStepOnePage';
import { CheckoutStepTwoPage } from '../../../src/pages/CheckoutStepTwoPage';
import { getProducts } from '../../../src/test-data/products';
import { validCheckoutInfo } from '../../../src/test-data/checkout';

test.describe('Product / Shopping Flow', () => {
  test('add multiple products to cart updates the cart badge', async ({ authenticatedPage: page }) => {
    const inventoryPage = new InventoryPage(page);
    const products = getProducts(3);

    for (const product of products) {
      await inventoryPage.addToCart(product);
    }

    expect(await inventoryPage.getCartBadgeCount()).toBe(products.length);
  });

  test('remove a product from the cart decrements the badge', async ({ authenticatedPage: page }) => {
    const inventoryPage = new InventoryPage(page);
    const products = getProducts(2);

    for (const product of products) {
      await inventoryPage.addToCart(product);
    }
    expect(await inventoryPage.getCartBadgeCount()).toBe(2);

    await inventoryPage.removeFromCart(products[0]);
    expect(await inventoryPage.getCartBadgeCount()).toBe(1);
  });

  test('checkout item total equals the sum of individual cart item prices', async ({ authenticatedPage: page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutStepOne = new CheckoutStepOnePage(page);
    const checkoutStepTwo = new CheckoutStepTwoPage(page);
    const products = getProducts(3);

    for (const product of products) {
      await inventoryPage.addToCart(product);
    }
    await inventoryPage.goToCart();

    expect(await cartPage.getItemCount()).toBe(products.length);
    const prices = await cartPage.getItemPrices();
    const expectedSum = prices.reduce((total, price) => total + price, 0);

    await cartPage.clickCheckout();
    await checkoutStepOne.fillInfo(validCheckoutInfo);
    await checkoutStepOne.clickContinue();

    const itemTotal = await checkoutStepTwo.getItemTotal();
    expect(itemTotal).toBeCloseTo(expectedSum, 2);

    const tax = await checkoutStepTwo.getTax();
    const total = await checkoutStepTwo.getTotal();
    expect(total).toBeCloseTo(itemTotal + tax, 2);
  });

  test('cart reflects removal performed from the cart page itself', async ({ authenticatedPage: page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const products = getProducts(2);

    for (const product of products) {
      await inventoryPage.addToCart(product);
    }
    await inventoryPage.goToCart();
    await cartPage.removeItem(products[0]);

    expect(await cartPage.getItemCount()).toBe(1);
    expect(await cartPage.getItemNames()).toEqual([products[1]]);
  });
});
