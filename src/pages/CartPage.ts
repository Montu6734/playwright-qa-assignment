import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  private readonly cartItems = this.page.locator('.cart_item');
  private readonly itemNames = this.page.locator('.inventory_item_name');
  private readonly itemPrices = this.page.locator('.inventory_item_price');
  private readonly checkoutButton = this.page.locator('[data-test="checkout"]');
  private readonly continueShoppingButton = this.page.locator('[data-test="continue-shopping"]');

  constructor(page: Page) {
    super(page);
  }

  getItemCount() {
    return this.cartItems.count();
  }

  getItemNames(): Promise<string[]> {
    return this.itemNames.allTextContents();
  }

  async getItemPrices(): Promise<number[]> {
    const texts = await this.itemPrices.allTextContents();
    return texts.map((t) => Number(t.replace('$', '')));
  }

  async removeItem(productName: string): Promise<void> {
    await this.cartItems
      .filter({ hasText: productName })
      .getByRole('button', { name: 'Remove' })
      .click();
  }

  async clickCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async clickContinueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }
}
