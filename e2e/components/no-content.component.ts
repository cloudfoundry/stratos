import { Page, Locator } from '@playwright/test';

/**
 * No Content Component
 * Empty state display with first and second line messages
 */
export class NoContentComponent {
  private readonly container: Locator;

  constructor(private page: Page) {
    this.container = page.locator('.app-no-content-container');
  }

  async checkFirstLineMessage(msg: string): Promise<boolean> {
    const firstLine = this.container.locator('.first-line');
    const text = await firstLine.textContent() || '';
    return text.trim().indexOf(msg) === 0;
  }

  async checkSecondLineMessage(msg: string): Promise<boolean> {
    const secondLine = this.container.locator('.second-line');
    const text = await secondLine.textContent() || '';
    return text.trim().indexOf(msg) === 0;
  }

  async getFirstLineMessage(): Promise<string> {
    const firstLine = this.container.locator('.first-line');
    return await firstLine.textContent() || '';
  }

  async getSecondLineMessage(): Promise<string> {
    const secondLine = this.container.locator('.second-line');
    return await secondLine.textContent() || '';
  }

  async isPresent(): Promise<boolean> {
    return await this.container.isVisible().catch(() => false);
  }

  async waitUntilShown(): Promise<void> {
    await this.container.waitFor({ state: 'visible', timeout: 5000 });
  }
}
