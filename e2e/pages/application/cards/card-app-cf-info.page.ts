import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * Card: Application Cloud Foundry Information
 * Displays CF name, organization, and space
 */
export class CardAppCfInfo extends BasePage {
  private readonly card: Locator;

  constructor(page: Page, locator?: string) {
    super(page);
    this.card = page.locator(locator || 'app-build-tab app-tile-grid app-tile-group:nth-of-type(2)');
  }

  /**
   * Get CF name metadata item
   */
  getCfLabel(): Locator {
    return this.card.locator('app-metadata-item[label="Name"] .metadata-item__label');
  }

  getCfValue(): Locator {
    return this.card.locator('app-metadata-item[label="Name"] .metadata-item__value');
  }

  async getCfText(): Promise<string> {
    return await this.getCfValue().textContent() || '';
  }

  /**
   * Get organization metadata item
   */
  getOrgLabel(): Locator {
    return this.card.locator('app-metadata-item[label="Organization"] .metadata-item__label');
  }

  getOrgValue(): Locator {
    return this.card.locator('app-metadata-item[label="Organization"] .metadata-item__value');
  }

  async getOrgText(): Promise<string> {
    return await this.getOrgValue().textContent() || '';
  }

  /**
   * Get space metadata item
   */
  getSpaceLabel(): Locator {
    return this.card.locator('app-metadata-item[label="Space"] .metadata-item__label');
  }

  getSpaceValue(): Locator {
    return this.card.locator('app-metadata-item[label="Space"] .metadata-item__value');
  }

  async getSpaceText(): Promise<string> {
    return await this.getSpaceValue().textContent() || '';
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
