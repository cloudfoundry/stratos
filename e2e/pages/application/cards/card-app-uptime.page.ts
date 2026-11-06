import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * Card: Application Uptime
 * Displays application uptime information
 */
export class CardAppUptime extends BasePage {
  private readonly card: Locator;

  constructor(page: Page, locator?: string) {
    super(page);
    this.card = page.locator(locator || '.card-app-uptime');
  }

  /**
   * Get uptime element
   */
  getUptime(): Locator {
    return this.card.locator('mat-card-content');
  }

  async getUptimeText(): Promise<string> {
    return await this.getUptime().textContent() || '';
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
