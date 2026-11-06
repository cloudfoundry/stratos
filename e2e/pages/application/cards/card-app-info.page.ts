import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * Card: Application Information
 * Displays memory quota, disk quota, app state, package state, services, and routes
 */
export class CardAppInfo extends BasePage {
  private readonly card: Locator;

  constructor(page: Page, locator?: string) {
    super(page);
    this.card = page.locator(locator || 'app-build-tab app-tile-grid app-tile-group:nth-of-type(2)');
  }

  /**
   * Get memory quota metadata item
   */
  getMemQuotaValue(): Locator {
    return this.card.locator('app-metadata-item[label="Memory Quota"] .metadata-item__value');
  }

  async getMemQuotaText(): Promise<string> {
    return await this.getMemQuotaValue().textContent() || '';
  }

  /**
   * Get disk quota metadata item
   */
  getDiskQuotaValue(): Locator {
    return this.card.locator('app-metadata-item[label="Disk Quota"] .metadata-item__value');
  }

  async getDiskQuotaText(): Promise<string> {
    return await this.getDiskQuotaValue().textContent() || '';
  }

  /**
   * Get app state metadata item
   */
  getAppStateValue(): Locator {
    return this.card.locator('app-metadata-item[label="App State"] .metadata-item__value');
  }

  async getAppStateText(): Promise<string> {
    return await this.getAppStateValue().textContent() || '';
  }

  /**
   * Get package state metadata item
   */
  getPackageStateValue(): Locator {
    return this.card.locator('app-metadata-item[label="Package State"] .metadata-item__value');
  }

  async getPackageStateText(): Promise<string> {
    return await this.getPackageStateValue().textContent() || '';
  }

  /**
   * Get services metadata item
   */
  getServicesValue(): Locator {
    return this.card.locator('app-metadata-item[label="Services"] .metadata-item__value');
  }

  async getServicesText(): Promise<string> {
    return await this.getServicesValue().textContent() || '';
  }

  /**
   * Get routes metadata item
   */
  getRoutesValue(): Locator {
    return this.card.locator('app-metadata-item[label="Routes"] .metadata-item__value');
  }

  async getRoutesText(): Promise<string> {
    return await this.getRoutesValue().textContent() || '';
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
