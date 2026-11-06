import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';
import { ListComponent } from '../../components';

/**
 * API Keys List Page
 * Page object for the API keys management page
 * Migrated from src/test-e2e/apikeys/po/apikeys-list-page.po.ts
 */
export class APIKeysListPage extends BasePage {
  public readonly list: ListComponent;
  private readonly pageContainer: Locator;

  constructor(page: Page) {
    super(page);
    this.pageContainer = page.locator('app-api-keys-page');
    this.list = new ListComponent(page);
  }

  /**
   * Get the add key button
   */
  getAddKeyButton(): Locator {
    return this.page.locator('#stratos-api-key');
  }

  /**
   * Get the key secret display element
   */
  getKeySecret(): Locator {
    return this.pageContainer.locator('.keys-page__card li, .api-key-secret');
  }

  /**
   * Close the key secret display
   */
  async closeKeySecret(): Promise<void> {
    const closeButton = this.pageContainer.locator('.keys-page__card button, .api-key-secret button').first();
    await closeButton.click();
  }

  /**
   * Wait for key secret to be shown
   */
  async waitForSecret(): Promise<void> {
    await this.getKeySecret().waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Get the secret text
   */
  async getSecretText(): Promise<string> {
    return await this.getKeySecret().textContent() || '';
  }
}
