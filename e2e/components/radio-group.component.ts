import { Page, Locator } from '@playwright/test';

/**
 * Radio Group Component
 * Material radio button group
 */
export class RadioGroupComponent {
  constructor(private page: Page, private radioGroup: Locator) {}

  async selectByLabel(label: string): Promise<void> {
    const radio = this.radioGroup.locator('mat-radio-button, .mat-mdc-radio-button').filter({ hasText: label });
    await radio.click();
  }

  async selectByIndex(index: number): Promise<void> {
    const radio = this.radioGroup.locator('mat-radio-button, .mat-mdc-radio-button').nth(index);
    await radio.click();
  }

  async getSelectedValue(): Promise<string> {
    const selectedRadio = this.radioGroup.locator('mat-radio-button[aria-checked="true"], .mat-mdc-radio-button[aria-checked="true"]');
    return await selectedRadio.textContent() || '';
  }

  async isSelected(label: string): Promise<boolean> {
    const radio = this.radioGroup.locator('mat-radio-button, .mat-mdc-radio-button').filter({ hasText: label });
    const ariaChecked = await radio.getAttribute('aria-checked');
    return ariaChecked === 'true';
  }
}
