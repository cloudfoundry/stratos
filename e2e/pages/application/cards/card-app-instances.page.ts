import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * Card: Application Instances
 * Displays running instances count with edit capabilities
 */
export class CardAppInstances extends BasePage {
  private readonly card: Locator;

  constructor(page: Page, locator?: string) {
    super(page);
    this.card = page.locator(locator || 'app-card-app-instances');
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

  async waitForRunningInstancesText(status: string): Promise<void> {
    await this.getRunningInstances().filter({ hasText: status }).waitFor({ timeout: 10000 });
  }

  /**
   * Edit count buttons
   */
  getEditCountButton(): Locator {
    return this.card.locator('.card-app-instances__actions button:first-of-type mat-icon:has-text("edit")');
  }

  getEditCountCancelButton(): Locator {
    return this.card.locator('.card-app-instances__actions button:first-of-type mat-icon:has-text("clear")');
  }

  getEditCountDoneButton(): Locator {
    return this.card.locator('.card-app-instances__actions button:nth-of-type(2) mat-icon:has-text("done")');
  }

  /**
   * Edit instance count
   * @param newInstanceCount New instance count (must be >= 1)
   */
  async editInstanceCount(newInstanceCount: number): Promise<void> {
    if (newInstanceCount < 1) {
      throw new Error('Instance count must be >= 1 (confirmation dialog not wired for 0)');
    }

    await this.getEditCountButton().click();

    const form = this.card.locator('form.card-app-instances__form');
    await form.waitFor({ state: 'visible' });

    const instancesInput = form.locator('input[name="instances"], input[formcontrolname="instances"]');
    await instancesInput.fill(newInstanceCount.toString());

    await this.getEditCountDoneButton().waitFor({ state: 'visible' });
    await this.getEditCountDoneButton().click();
  }

  /**
   * Increase/decrease count buttons
   */
  getDecreaseCountButton(): Locator {
    return this.card.locator('.card-app-instances__actions button:nth-of-type(2) mat-icon:has-text("remove_circle_outline")');
  }

  getIncreaseCountButton(): Locator {
    return this.card.locator('.card-app-instances__actions button:nth-of-type(3) mat-icon:has-text("add_circle_outline")');
  }

  async decreaseCount(): Promise<void> {
    await this.getDecreaseCountButton().click();
  }

  async increaseCount(): Promise<void> {
    await this.getIncreaseCountButton().click();
  }
}
