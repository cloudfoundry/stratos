import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Service Instance Data
 */
export interface ServiceInstance {
  serviceInstanceName: string;
  spaceName: string;
  serviceName: string;
  planName: string;
  tags?: string;
  applicationsAttached?: string;
  creationDate?: string;
}

/**
 * Services Wall Page
 * Service instances wall/list across all CF endpoints
 */
export class ServicesWallPage extends BasePage {
  public static FilterIds = {
    cf: 'cf'
  };

  public serviceInstancesList: Locator;

  constructor(page: Page) {
    super(page);
    this.serviceInstancesList = page.locator('app-list');
  }

  async navigateTo(): Promise<void> {
    await this.page.goto('/services');
  }

  async clickCreateServiceInstance(): Promise<void> {
    const addButton = this.page.locator('button[aria-label="add"], button').filter({ hasText: /add/i });
    await addButton.waitFor({ state: 'visible' });
    await addButton.click();
  }

  getServiceInstances(): Locator {
    return this.serviceInstancesList.locator('app-card, mat-card');
  }

  async getServiceInstancesCount(): Promise<number> {
    return await this.getServiceInstances().count();
  }

  /**
   * Get service instance data from a card
   */
  async getServiceInstanceFromCard(cardLocator: Locator): Promise<ServiceInstance> {
    const title = await cardLocator.locator('mat-card-title, .meta-card__title').textContent() || '';

    const metadataItems = cardLocator.locator('.meta-card-item-row, app-metadata-item');
    const count = await metadataItems.count();

    const items: string[] = [];
    for (let i = 0; i < count && i < 4; i++) {
      const value = await metadataItems.nth(i).locator('.meta-card-item__value, .metadata-item__value').textContent() || '';
      items.push(value);
    }

    return {
      serviceInstanceName: title,
      spaceName: items[0] || '',
      serviceName: items[1] || '',
      planName: items[2] || '',
      applicationsAttached: items[3] || ''
    };
  }

  async isActivePage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/services') && !url.includes('/services/new');
  }

  async waitForPage(): Promise<void> {
    await this.page.waitForURL(/\/services[^/]*$/, { timeout: 20000 });
  }
}
