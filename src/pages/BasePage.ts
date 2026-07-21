import type { Page } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {
    // Safety net: no known native dialog() calls in the AUT's core flows, but an
    // unhandled dialog would otherwise hang a test indefinitely.
    this.page.on('dialog', (dialog) => dialog.accept());
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }
}
