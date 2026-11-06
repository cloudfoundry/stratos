import { Page, Locator } from '@playwright/test';
import { ApplicationBasePage } from '../application.page';

/**
 * Application Events Tab Page Object
 * Migrated from src/test-e2e/application/po/application-page-events.po.ts
 *
 * Represents the application events tab with events list
 */
export class ApplicationPageEventsTab extends ApplicationBasePage {
  private readonly listComponent: Locator;

  constructor(page: Page, cfGuid: string, appGuid: string) {
    super(page, cfGuid, appGuid, 'events');

    this.listComponent = page.locator('app-list');
  }

  /**
   * Get list component
   */
  getList(): Locator {
    return this.listComponent;
  }
}
