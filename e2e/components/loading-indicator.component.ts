import { Page, Locator } from '@playwright/test';

/**
 * Loading Indicator Component
 * Full page loading indicator
 */
export class LoadingIndicatorComponent {
  private indicator: Locator;

  constructor(private page: Page) {
    this.indicator = page.locator('app-loading-page, .loading-page');
  }

  async waitForNotShown(timeout = 20000): Promise<void> {
    await this.indicator.waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  async isShown(): Promise<boolean> {
    return await this.indicator.isVisible().catch(() => false);
  }
}
