import { test, expect } from '../../../src/fixtures/test-fixtures';
import { InventoryPage } from '../../../src/pages/InventoryPage';
import { CartPage } from '../../../src/pages/CartPage';
import { CheckoutStepOnePage } from '../../../src/pages/CheckoutStepOnePage';
import { CheckoutStepTwoPage } from '../../../src/pages/CheckoutStepTwoPage';
import { CheckoutCompletePage } from '../../../src/pages/CheckoutCompletePage';
import { getProducts } from '../../../src/test-data/products';
import { validCheckoutInfo, invalidCheckoutCases } from '../../../src/test-data/checkout';

test.describe('End-to-End Checkout Flow', () => {
  test('completes checkout end-to-end for a single product', async ({ authenticatedPage: page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutStepOne = new CheckoutStepOnePage(page);
    const checkoutStepTwo = new CheckoutStepTwoPage(page);
    const checkoutComplete = new CheckoutCompletePage(page);

    await inventoryPage.addToCart(getProducts(1)[0]);
    await inventoryPage.goToCart();
    await cartPage.clickCheckout();

    await checkoutStepOne.fillInfo(validCheckoutInfo);
    await checkoutStepOne.clickContinue();

    await expect(page).toHaveURL(/checkout-step-two\.html/);
    await checkoutStepTwo.clickFinish();

    await expect(page).toHaveURL(/checkout-complete\.html/);
    await expect(checkoutComplete.isVisible()).resolves.toBe(true);
    expect(await checkoutComplete.getConfirmationHeader()).toContain('Thank you for your order');
  });

  for (const { label, data, expectedError } of invalidCheckoutCases) {
    test(`mandatory field validation: ${label}`, async ({ authenticatedPage: page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);
      const checkoutStepOne = new CheckoutStepOnePage(page);

      await inventoryPage.addToCart(getProducts(1)[0]);
      await inventoryPage.goToCart();
      await cartPage.clickCheckout();

      await checkoutStepOne.fillInfo(data);
      await checkoutStepOne.clickContinue();

      await expect(page).toHaveURL(/checkout-step-one\.html/);
      expect(await checkoutStepOne.getErrorText()).toBe(expectedError);
    });
  }

  test('negative scenario: checking out with an empty cart yields a zero-item, zero-total order', async ({
    authenticatedPage: page,
  }) => {
    // SauceDemo does not block the checkout flow for an empty cart — this test
    // documents that known lack of server/UI-side validation rather than
    // assuming it's blocked.
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutStepOne = new CheckoutStepOnePage(page);
    const checkoutStepTwo = new CheckoutStepTwoPage(page);

    await inventoryPage.goToCart();
    await expect(page.locator('.cart_item')).toHaveCount(0);

    await cartPage.clickCheckout();
    await checkoutStepOne.fillInfo(validCheckoutInfo);
    await checkoutStepOne.clickContinue();

    await expect(page).toHaveURL(/checkout-step-two\.html/);
    expect(await checkoutStepTwo.getTotal()).toBe(0);
  });

  test('negative scenario: cancelling checkout returns to the inventory page', async ({ authenticatedPage: page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutStepOne = new CheckoutStepOnePage(page);

    await inventoryPage.addToCart(getProducts(1)[0]);
    await inventoryPage.goToCart();
    await cartPage.clickCheckout();
    await checkoutStepOne.fillInfo(validCheckoutInfo);
    await checkoutStepOne.clickContinue();

    const checkoutStepTwo = new CheckoutStepTwoPage(page);
    await checkoutStepTwo.clickCancel();

    await expect(page).toHaveURL(/inventory\.html/);
  });
});
