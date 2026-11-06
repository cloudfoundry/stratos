import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * Card: Application Build Information
 * Displays buildpack and stack information
 */
export class CardAppBuildInfo extends BasePage {
  private readonly card: Locator;

  constructor(page: Page, locator?: string) {
    super(page);
    this.card = page.locator(locator || 'app-build-tab app-tile-grid app-tile-group:nth-of-type(3)');
  }

  /**
   * Get buildpack metadata item
   */
  getBuildPackLabel(): Locator {
    return this.card.locator('app-metadata-item[label="Buildpack"] .metadata-item__label');
  }

  getBuildPackValue(): Locator {
    return this.card.locator('app-metadata-item[label="Buildpack"] .metadata-item__value');
  }

  async getBuildPackText(): Promise<string> {
    return await this.getBuildPackValue().textContent() || '';
  }

  /**
   * Get stack metadata item
   */
  getStackLabel(): Locator {
    return this.card.locator('app-metadata-item[label="Stack"] .metadata-item__label');
  }

  getStackValue(): Locator {
    return this.card.locator('app-metadata-item[label="Stack"] .metadata-item__value');
  }

  async getStackText(): Promise<string> {
    return await this.getStackValue().textContent() || '';
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
