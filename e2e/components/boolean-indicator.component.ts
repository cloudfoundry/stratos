import { Page, Locator } from '@playwright/test';

/**
 * Boolean Indicator Component
 * Displays boolean status with icon and optional label
 */
export class BooleanIndicatorComponent {
  private readonly indicator: Locator;

  constructor(private page: Page, parent: Locator) {
    this.indicator = parent.locator('.boolean-indicator__container');
  }

  async getLabel(): Promise<string> {
    const label = this.indicator.locator('div');
    return await label.textContent() || '';
  }

  async getIcon(): Promise<string> {
    const icon = this.indicator.locator('mat-icon');
    return await icon.textContent() || '';
  }

  async isSuccess(): Promise<boolean> {
    const icon = await this.getIcon();
    return icon === 'check_circle' || icon === 'check';
  }

  async isError(): Promise<boolean> {
    const icon = await this.getIcon();
    return icon === 'error' || icon === 'cancel';
  }

  async isWarning(): Promise<boolean> {
    const icon = await this.getIcon();
    return icon === 'warning';
  }

  async waitUntilShown(): Promise<void> {
    await this.indicator.waitFor({ state: 'visible', timeout: 5000 });
  }
}
