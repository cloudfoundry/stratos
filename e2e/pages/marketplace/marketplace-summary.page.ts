import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Marketplace Summary Page
 * Individual service summary page in marketplace
 */
export class MarketplaceSummaryPage extends BasePage {
  private readonly container: Locator;

  constructor(page: Page, public cfGuid: string, public serviceGuid: string) {
    super(page);
    this.container = page.locator('.summary');
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(`/marketplace/${this.cfGuid}/${this.serviceGuid}/summary`);
  }

  getServiceSummaryCard(): Locator {
    return this.container.locator('.service-summary');
  }

  getServiceBrokerCard(): Locator {
    return this.page.locator('app-service-broker-card');
  }

  getAuthUsernameTristate(): Locator {
    return this.getServiceBrokerCard().locator('app-tristate-value span.tristate-value');
  }

  getRecentInstances(): Locator {
    return this.container.locator('.recent-instances');
  }

  getAddServiceInstanceButton(): Locator {
    return this.page.locator('button[name="add-service-instance"]');
  }

  async clickAddServiceInstance(): Promise<void> {
    await this.getAddServiceInstanceButton().click();
  }
}
