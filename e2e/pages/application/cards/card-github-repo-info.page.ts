import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * Card: GitHub Repository Information
 * Displays repository full name, owner, and description
 */
export class CardGithubRepoInfo extends BasePage {
  private readonly card: Locator;

  constructor(page: Page, locator?: string) {
    super(page);
    this.card = page.locator(locator || 'app-tile-grid app-tile-group app-tile:nth-of-type(2)');
  }

  /**
   * Get full name metadata item
   */
  getNameValue(): Locator {
    return this.card.locator('app-metadata-item[label="Full Name"] .metadata-item__value');
  }

  async getNameText(): Promise<string> {
    return await this.getNameValue().textContent() || '';
  }

  /**
   * Get owner metadata item
   */
  getOwnerValue(): Locator {
    return this.card.locator('app-metadata-item[label="Owner"] .metadata-item__value');
  }

  async getOwnerText(): Promise<string> {
    return await this.getOwnerValue().textContent() || '';
  }

  /**
   * Get description metadata item
   */
  getDescriptionValue(): Locator {
    return this.card.locator('app-metadata-item[label="Description"] .metadata-item__value');
  }

  async getDescriptionText(): Promise<string> {
    return await this.getDescriptionValue().textContent() || '';
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
