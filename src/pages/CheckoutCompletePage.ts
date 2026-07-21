import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutCompletePage extends BasePage {
  private readonly completeHeader = this.page.locator('.complete-header');

  constructor(page: Page) {
    super(page);
  }

  getConfirmationHeader(): Promise<string | null> {
    return this.completeHeader.textContent();
  }

  isVisible() {
    return this.completeHeader.isVisible();
  }
}
