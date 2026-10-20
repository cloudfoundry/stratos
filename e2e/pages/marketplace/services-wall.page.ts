import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Services Wall Page
 * Service instances wall/list across all CF endpoints
 */
export class ServicesWallPage extends BasePage {
  public serviceInstancesList: Locator;

  constructor(page: Page) {
    super(page);
    this.serviceInstancesList = page.locator('app-signal-list');
  }

  async navigateTo(): Promise<void> {
    await this.page.goto('/services');
  }

  async waitForPage(): Promise<void> {
    await this.page.waitForURL(/\/services[^/]*$/, { timeout: 20000 });
  }
}
