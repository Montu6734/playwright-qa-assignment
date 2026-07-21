import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { config } from '../config/env';

export class LoginPage extends BasePage {
  private readonly usernameInput = this.page.locator('#user-name');
  private readonly passwordInput = this.page.locator('#password');
  private readonly loginButton = this.page.locator('#login-button');
  private readonly errorMessage = this.page.locator('[data-test="error"]');

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(config.baseURL);
    await this.waitForLoad();
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginWithKeyboard(username: string, password: string): Promise<void> {
    await this.usernameInput.click();
    await this.usernameInput.fill(username);
    await this.page.keyboard.press('Tab');
    await this.passwordInput.fill(password);
    await this.page.keyboard.press('Enter');
  }

  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }

  isErrorVisible() {
    return this.errorMessage.isVisible();
  }
}
