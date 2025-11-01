import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Marketplace Instances Page
 * Service instances list for a specific marketplace service
 */
export class MarketplaceInstancesPage extends BasePage {
  public list: Locator;

  constructor(page: Page, public cfGuid: string, public serviceGuid: string) {
    super(page);
    this.list = page.locator('app-list');
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(`/marketplace/${this.cfGuid}/${this.serviceGuid}/instances`);
  }
}
