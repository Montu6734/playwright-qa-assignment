import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class InventoryPage extends BasePage {
  private readonly cartBadge = this.page.locator('.shopping_cart_badge');
  private readonly cartLink = this.page.locator('.shopping_cart_link');
  private readonly burgerMenuButton = this.page.locator('#react-burger-menu-btn');
  private readonly logoutLink = this.page.locator('#logout_sidebar_link');
  private readonly allItemsLink = this.page.locator('#inventory_sidebar_link');
  private readonly resetAppStateLink = this.page.locator('#reset_sidebar_link');
  private readonly sortDropdown = this.page.locator('[data-test="product-sort-container"]');
  private readonly productNames = this.page.locator('.inventory_item_name');
  private readonly productImages = this.page.locator('.inventory_item_img img');

  constructor(page: Page) {
    super(page);
  }

  isLoaded() {
    return this.page.locator('.inventory_list').isVisible();
  }

  private itemCard(productName: string) {
    return this.page.locator('.inventory_item').filter({ hasText: productName });
  }

  async addToCart(productName: string): Promise<void> {
    await this.itemCard(productName).getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.itemCard(productName).getByRole('button', { name: 'Remove' }).click();
  }

  async getCartBadgeCount(): Promise<number> {
    if (!(await this.cartBadge.isVisible())) return 0;
    return Number(await this.cartBadge.textContent());
  }

  async goToCart(): Promise<void> {
    await this.cartLink.click();
  }

  async sortBy(option: string): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  async openBurgerMenu(): Promise<void> {
    await this.burgerMenuButton.click();
  }

  async logout(): Promise<void> {
    await this.openBurgerMenu();
    await this.logoutLink.click();
  }

  async goToAllItems(): Promise<void> {
    await this.allItemsLink.click();
  }

  async resetAppState(): Promise<void> {
    await this.resetAppStateLink.click();
  }

  async getProductNames(): Promise<string[]> {
    return this.productNames.allTextContents();
  }

  async getProductImageAltTexts(): Promise<string[]> {
    return this.productImages.evaluateAll((imgs) => imgs.map((img) => img.getAttribute('alt') ?? ''));
  }
}
