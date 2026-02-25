import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * Card: Application Status
 * Displays application status with label and sub-label
 */
export class CardAppStatus extends BasePage {
  private readonly card: Locator;

  constructor(page: Page, locator?: string) {
    super(page);
    this.card = page.locator(locator || 'app-card-app-status');
  }

  /**
   * Get status label
   */
  getStatusLabel(): Locator {
    return this.card.locator('.app-state__label');
  }

  async getStatusLabelText(): Promise<string> {
    return await this.getStatusLabel().textContent() || '';
  }

  /**
   * Get status sub-label
   */
  getStatusSubLabel(): Locator {
    return this.card.locator('.app-state__sub-label');
  }

  async getStatusSubLabelText(): Promise<string> {
    return await this.getStatusSubLabel().textContent() || '';
  }

  /**
   * Get full status (both label and sub-label)
   */
  async getStatus(): Promise<{ status: string; subStatus: string }> {
    const hasSubLabel = await this.getStatusSubLabel().isVisible().catch(() => false);

    const status = await this.getStatusLabelText();
    const subStatus = hasSubLabel ? await this.getStatusSubLabelText() : '';

    return { status, subStatus };
  }

  /**
   * Wait for specific status
   * @param status Expected status text
   * @param timeout Wait timeout in ms (default 40000)
   */
  async waitForStatus(status: string, timeout: number = 40000): Promise<void> {
    try {
      await this.getStatusLabel().filter({ hasText: status }).waitFor({ timeout });
    } catch (err) {
      const currentStatus = await this.getStatusLabelText();
      console.log(`Timed out waiting for status '${status}', last status was '${currentStatus}'`);
      throw err;
    }
  }

  /**
   * Wait for specific sub-status
   * @param subStatus Expected sub-status text
   * @param timeout Wait timeout in ms (default 40000)
   */
  async waitForSubStatus(subStatus: string, timeout: number = 40000): Promise<void> {
    await this.getStatusSubLabel().filter({ hasText: subStatus }).waitFor({ timeout });
  }
}
