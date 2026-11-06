import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * Card: Application Deployment Information
 * Displays git commit and docker image information
 */
export class CardAppDeployInfo extends BasePage {
  private readonly card: Locator;

  constructor(page: Page, locator?: string) {
    super(page);
    this.card = page.locator(locator || '#app-build-tab-deployment-info');
  }

  /**
   * Get git commit metadata item (dynamic label)
   */
  getGitCommitValue(): Locator {
    return this.card.locator('.metadata-item__label:has-text("Commit")').locator('..').locator('.metadata-item__value');
  }

  async getGitCommitText(): Promise<string> {
    return await this.getGitCommitValue().textContent() || '';
  }

  /**
   * Get docker image metadata item (dynamic label)
   */
  getDockerValue(): Locator {
    return this.card.locator('.metadata-item__label:has-text("Docker Image")').locator('..').locator('.metadata-item__value');
  }

  async getDockerText(): Promise<string> {
    return await this.getDockerValue().textContent() || '';
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
