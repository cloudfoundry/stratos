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

  constructor(page: Page) {
    super(page);
    this.list = new ListComponent(page);
  }

  /**
   * Get the add key button
   */
  getAddKeyButton(): Locator {
    return this.page.locator('#stratos-api-key');
  }
}
