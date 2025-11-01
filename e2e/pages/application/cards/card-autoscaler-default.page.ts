import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * Card: Autoscaler Default Settings
 * Displays autoscaler running instances and min/max configuration
 */
export class CardAutoscalerDefault extends BasePage {
  private readonly card: Locator;

  constructor(page: Page, public cfGuid: string, public appGuid: string, locator?: string) {
    super(page);
    this.card = page.locator(locator || 'app-card-autoscaler-default');
  }

  /**
   * Get running instances element
   */
  getRunningInstances(): Locator {
    return this.card.locator('app-running-instances');
  }

  async getRunningInstancesText(): Promise<string> {
    return await this.getRunningInstances().textContent() || '';
  }

  /**
   * Get default minimum instances
   */
  getDefaultMin(): Locator {
    return this.card.locator('.card-autoscaler-default__min-max .metadata-item__value').nth(0);
  }

  async getDefaultMinText(): Promise<string> {
    return await this.getDefaultMin().textContent() || '';
  }

  /**
   * Get default maximum instances
   */
  getDefaultMax(): Locator {
    return this.card.locator('.card-autoscaler-default__min-max .metadata-item__value').nth(1);
  }

  async getDefaultMaxText(): Promise<string> {
    return await this.getDefaultMax().textContent() || '';
  }
}
