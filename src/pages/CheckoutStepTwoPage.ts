import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';

function parseMoney(text: string): number {
  const match = text.match(/[\d.]+/);
  return match ? Number(match[0]) : NaN;
}

export class CheckoutStepTwoPage extends BasePage {
  private readonly itemTotalLabel = this.page.locator('.summary_subtotal_label');
  private readonly taxLabel = this.page.locator('.summary_tax_label');
  private readonly totalLabel = this.page.locator('.summary_total_label');
  private readonly finishButton = this.page.locator('[data-test="finish"]');
  private readonly cancelButton = this.page.locator('[data-test="cancel"]');

  constructor(page: Page) {
    super(page);
  }

  async getItemTotal(): Promise<number> {
    return parseMoney((await this.itemTotalLabel.textContent()) ?? '');
  }

  async getTax(): Promise<number> {
    return parseMoney((await this.taxLabel.textContent()) ?? '');
  }

  async getTotal(): Promise<number> {
    return parseMoney((await this.totalLabel.textContent()) ?? '');
  }

  async clickFinish(): Promise<void> {
    await this.finishButton.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
