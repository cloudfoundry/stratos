import { Locator } from '@playwright/test';

/**
 * Checkbox Component
 * Wrapper for mat-checkbox interactions
 */
export class CheckboxComponent {
  constructor(private checkbox: Locator) {}

  async check(): Promise<void> {
    const isChecked = await this.isChecked();
    if (!isChecked) {
      await this.checkbox.click();
    }
  }

  async uncheck(): Promise<void> {
    const isChecked = await this.isChecked();
    if (isChecked) {
      await this.checkbox.click();
    }
  }

  async toggle(): Promise<void> {
    await this.checkbox.click();
  }

  async isChecked(): Promise<boolean> {
    const ariaChecked = await this.checkbox.getAttribute('aria-checked');
    return ariaChecked === 'true';
  }

  async isDisabled(): Promise<boolean> {
    return await this.checkbox.isDisabled();
  }

  async waitUntilShown(): Promise<void> {
    await this.checkbox.waitFor({ state: 'visible', timeout: 5000 });
  }
}
