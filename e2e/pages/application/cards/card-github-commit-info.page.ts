import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * Card: GitHub Commit Information
 * Displays commit message, SHA, and author
 */
export class CardGithubCommitInfo extends BasePage {
  private readonly card: Locator;

  constructor(page: Page, locator?: string) {
    super(page);
    this.card = page.locator(locator || 'app-tile-grid app-tile-group app-tile:nth-of-type(3)');
  }

  /**
   * Get message metadata item
   */
  getMessageValue(): Locator {
    return this.card.locator('app-metadata-item[label="Message"] .metadata-item__value');
  }

  async getMessageText(): Promise<string> {
    return await this.getMessageValue().textContent() || '';
  }

  /**
   * Get SHA metadata item
   */
  getShaValue(): Locator {
    return this.card.locator('app-metadata-item[label="SHA"] .metadata-item__value');
  }

  async getShaText(): Promise<string> {
    return await this.getShaValue().textContent() || '';
  }

  /**
   * Get author metadata item
   */
  getAuthorValue(): Locator {
    return this.card.locator('app-metadata-item[label="Author"] .metadata-item__value');
  }

  async getAuthorText(): Promise<string> {
    return await this.getAuthorValue().textContent() || '';
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
