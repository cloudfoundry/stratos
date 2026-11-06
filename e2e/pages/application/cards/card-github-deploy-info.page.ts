import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * Card: GitHub Deployment Information
 * Displays repository, branch, commit, and deployment time
 */
export class CardGithubDeployInfo extends BasePage {
  private readonly card: Locator;

  constructor(page: Page, locator?: string) {
    super(page);
    this.card = page.locator(locator || 'app-tile-grid app-tile-group app-tile:nth-of-type(1)');
  }

  /**
   * Get repository metadata item
   */
  getRepoValue(): Locator {
    return this.card.locator('app-metadata-item[label="Repository"] .metadata-item__value');
  }

  async getRepoText(): Promise<string> {
    return await this.getRepoValue().textContent() || '';
  }

  /**
   * Get branch metadata item
   */
  getBranchValue(): Locator {
    return this.card.locator('app-metadata-item[label="Branch"] .metadata-item__value');
  }

  async getBranchText(): Promise<string> {
    return await this.getBranchValue().textContent() || '';
  }

  /**
   * Get commit metadata item
   */
  getCommitValue(): Locator {
    return this.card.locator('app-metadata-item[label="Commit"] .metadata-item__value');
  }

  async getCommitText(): Promise<string> {
    return await this.getCommitValue().textContent() || '';
  }

  /**
   * Get deployed timestamp metadata item
   */
  getDeployedValue(): Locator {
    return this.card.locator('app-metadata-item[label="Deployed"] .metadata-item__value');
  }

  async getDeployedText(): Promise<string> {
    return await this.getDeployedValue().textContent() || '';
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
