import { Page, Locator } from '@playwright/test';
import { FormComponent } from './form.component';

/**
 * Stacked Input Actions Component
 * Dynamic list of input fields with add/remove capabilities
 */
export class StackedInputActionsComponent {
  private readonly container: Locator;

  constructor(private page: Page, container: Locator) {
    this.container = container;
  }

  async getInputCount(): Promise<number> {
    return await this.container.locator('app-stacked-input-action').count();
  }

  async setInput(values: { [index: number]: string }): Promise<void> {
    for (const [indexStr, value] of Object.entries(values)) {
      const index = parseInt(indexStr);
      const form = this.getInputForm(index);
      await form.fill({ [index]: value });
    }
  }

  async getInputValue(index: number): Promise<string> {
    const form = this.getInputForm(index);
    return await form.getText(index.toString());
  }

  async isFieldInvalid(index: number): Promise<boolean> {
    const form = this.getInputForm(index);
    return await form.isFieldInvalid(index.toString());
  }

  async fieldInvalidMessage(index: number): Promise<string> {
    const form = this.getInputForm(index);
    return await form.getFieldErrorText(index.toString());
  }

  async clearInput(index: number): Promise<void> {
    const field = this.getField(index);
    await field.click();
    await field.fill('');
  }

  async addInput(): Promise<void> {
    const addButton = this.container.locator('.stacked-input__add');
    await addButton.click();
  }

  async removeInput(index: number): Promise<void> {
    const input = this.getInput(index);
    const removeButton = input.locator('.input-action__detail__remove');
    await removeButton.click();
  }

  async isInputSuccess(index: number): Promise<boolean> {
    const input = this.getInput(index);
    const icon = input.locator('.input-action__detail .boolean-indicator__container mat-icon');
    const iconText = await icon.textContent() || '';
    return iconText === 'check_circle';
  }

  async getInputMessage(index: number): Promise<string> {
    const input = this.getInput(index);
    const message = input.locator('.input-action__detail > span');
    return await message.textContent() || '';
  }

  private getInput(index: number): Locator {
    return this.container.locator('app-stacked-input-action').nth(index);
  }

  private getInputForm(index: number): FormComponent {
    const input = this.getInput(index);
    const formLocator = input.locator('.input-action__form');
    return new FormComponent(this.page, formLocator);
  }

  private getField(index: number): Locator {
    const form = this.getInputForm(index);
    return form.getField(index.toString());
  }

  async waitUntilShown(): Promise<void> {
    await this.container.waitFor({ state: 'visible', timeout: 5000 });
  }
}
