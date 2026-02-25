import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * Card: Application Usage
 * Displays application resource usage table
 */
export class CardAppUsage extends BasePage {
  private readonly card: Locator;

  constructor(page: Page, locator?: string) {
    super(page);
    this.card = page.locator(locator || 'app-card-app-usage');
  }

  /**
   * Get usage table
   */
  getUsageTable(): Locator {
    return this.card.locator('.instances__detail');
  }

  async isUsageTableVisible(): Promise<boolean> {
    return await this.getUsageTable().isVisible();
  }

  /**
   * Get card title
   */
  getTitle(): Locator {
    return this.card.locator('mat-card-title');
  }

  async getTitleText(): Promise<string> {
    return await this.getTitle().textContent() || '';
  }
}
