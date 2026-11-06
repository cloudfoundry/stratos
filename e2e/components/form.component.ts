import { Page, Locator } from '@playwright/test';

/**
 * Form Item
 */
export interface FormItem {
  index: number;
  name: string;
  formControlName: string;
  placeholder: string;
  value: string;
  checked: boolean;
  type: string;
  tag: string;
  valid: boolean;
  id: string;
  multiple: boolean;
}

/**
 * Form Item Map
 */
export interface FormItemMap {
  [k: string]: FormItem;
}

/**
 * Form Field
 * Wrapper for individual form field operations
 */
export class FormField {
  private field: Locator;

  constructor(private form: FormComponent, public name: string) {
    this.field = this.form.getField(name);
  }

  async set(value: string): Promise<void> {
    await this.form.fill({ [this.name]: value });
  }

  async clear(): Promise<void> {
    await this.form.clearField(this.name);
  }

  async isDisabled(): Promise<boolean> {
    return await this.form.isFieldDisabled(this.name);
  }

  async isInvalid(): Promise<boolean> {
    return await this.form.isFieldInvalid(this.name);
  }

  async getError(): Promise<string> {
    return await this.form.getFieldErrorText(this.name);
  }

  async focus(): Promise<void> {
    await this.form.focusField(this.name);
  }
}

/**
 * Form Component
 * Handles form interactions and field operations
 */
export class FormComponent {
  private form: Locator;

  constructor(private page: Page, locator?: Locator) {
    this.form = locator || page.locator('form').first();
  }

  getFields(): Locator {
    return this.form.locator('input, mat-select, textarea, select');
  }

  async getFieldsCount(): Promise<number> {
    return await this.getFields().count();
  }

  /**
   * Get form field by name, formcontrolname, or id
   */
  getField(ctrlName: string): Locator {
    const normalizedName = ctrlName.toLowerCase();

    return this.form.locator(`
      input[name="${normalizedName}"],
      input[formcontrolname="${normalizedName}"],
      input[id="${normalizedName}"],
      mat-select[name="${normalizedName}"],
      mat-select[formcontrolname="${normalizedName}"],
      mat-select[id="${normalizedName}"],
      select[name="${normalizedName}"],
      select[formcontrolname="${normalizedName}"],
      select[id="${normalizedName}"],
      textarea[name="${normalizedName}"],
      textarea[formcontrolname="${normalizedName}"],
      textarea[id="${normalizedName}"]
    `).first();
  }

  getFormField(ctrlName: string): FormField {
    return new FormField(this, ctrlName);
  }

  async isFieldDisabled(ctrlName: string): Promise<boolean> {
    const field = this.getField(ctrlName);
    return await field.isDisabled();
  }

  async isFieldInvalid(ctrlName: string): Promise<boolean> {
    const field = this.getField(ctrlName);
    const ariaInvalid = await field.getAttribute('aria-invalid');
    return ariaInvalid === 'true';
  }

  async getFieldErrorText(ctrlName: string): Promise<string> {
    const field = this.getField(ctrlName);
    const errorId = await field.getAttribute('aria-describedby');

    if (errorId) {
      const errorElement = this.page.locator(`#${errorId}`);
      return await errorElement.textContent() || '';
    }

    return '';
  }

  async getText(ctrlName: string): Promise<string> {
    const field = this.getField(ctrlName);
    const tagName = await field.evaluate((el) => el.tagName.toLowerCase());

    if (tagName === 'input' || tagName === 'textarea') {
      return await field.inputValue();
    } else if (tagName === 'mat-select' || tagName === 'select') {
      return await field.textContent() || '';
    }

    return '';
  }

  async focusField(ctrlName: string): Promise<void> {
    const field = this.getField(ctrlName);
    await field.click();
  }

  /**
   * Fill form fields
   */
  async fill(fields: { [fieldKey: string]: string | boolean | number[] }, expectFailure = false): Promise<void> {
    for (const fieldName of Object.keys(fields)) {
      const value = fields[fieldName];
      const field = this.getField(fieldName);

      await field.waitFor({ state: 'visible', timeout: 5000 });

      const tagName = await field.evaluate((el) => el.tagName.toLowerCase());
      const type = await field.getAttribute('type') || tagName;

      switch (type) {
        case 'checkbox':
          const isChecked = await field.isChecked();
          if (isChecked !== value) {
            await field.click();
          }
          break;

        case 'mat-select':
        case 'select':
          await field.click();

          const isMultiple = await field.getAttribute('multiple') !== null;

          if (isMultiple && Array.isArray(value)) {
            // Handle multi-select
            for (const optionValue of value) {
              const option = this.page.locator('mat-option, option').filter({ hasText: String(optionValue) });
              await option.click();
            }
            // Press escape to close
            await this.page.keyboard.press('Escape');
          } else {
            // Single select
            const strValue = String(value);

            // Filter by typing
            const hasSpace = strValue.includes(' ');
            const searchText = hasSpace ? strValue.substring(0, strValue.indexOf(' ')) : strValue;
            await this.page.keyboard.type(searchText);

            // Wait a bit for filtering
            await this.page.waitForTimeout(100);

            // Click the option
            const option = this.page.locator('mat-option, option').filter({ hasText: strValue });
            await option.click();
          }

          if (!expectFailure) {
            const actualValue = await this.getText(fieldName);
            if (actualValue !== String(value)) {
              throw new Error(`Failed to set field '${fieldName}' to '${value}', got '${actualValue}'`);
            }
          }
          break;

        case 'date':
        case 'time':
        case 'datetime-local':
          await field.fill(String(value));
          break;

        default:
          await field.click();
          await field.fill('');
          await field.fill(String(value));

          if (!expectFailure) {
            const actualValue = await this.getText(fieldName);
            if (actualValue !== String(value)) {
              throw new Error(`Failed to set field '${fieldName}' to '${value}', got '${actualValue}'`);
            }
          }
          break;
      }
    }
  }

  async clearField(name: string): Promise<void> {
    const field = this.getField(name);
    await field.click();
    await field.fill('');
    // Type space and delete to trigger validation
    await field.type(' ');
    await this.page.keyboard.press('Backspace');
  }

  async isDisplayed(): Promise<boolean> {
    return await this.form.isVisible();
  }

  async waitUntilShown(): Promise<void> {
    await this.form.waitFor({ state: 'visible', timeout: 5000 });
  }
}
