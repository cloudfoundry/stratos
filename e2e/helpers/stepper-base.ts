import { Page, Locator } from '@playwright/test';

/**
 * Stepper Base Helper
 * Base class for all stepper components
 */
export class StepperBase {
  protected stepper: Locator;

  constructor(protected page: Page) {
    this.stepper = page.locator('app-steppers');
  }

  /**
   * Get stepper form for current step
   */
  getStepperForm(): Locator {
    return this.stepper.locator('form').first();
  }

  /**
   * Fill a field in the stepper form
   */
  async fillStepperField(fieldName: string, value: string): Promise<void> {
    const form = this.getStepperForm();
    const field = form.locator(`[name="${fieldName}"], [formcontrolname="${fieldName}"]`).first();

    const tagName = await field.evaluate((el) => el.tagName.toLowerCase());

    if (tagName === 'mat-select' || tagName === 'select') {
      await field.click();
      const option = this.page.locator('mat-option, option').filter({ hasText: value });
      await option.click();
    } else if (tagName === 'input' || tagName === 'textarea') {
      await field.fill(value);
    } else {
      // A wrapper component carrying the name (app-unlimited-input: a number
      // field plus an "Unlimited" checkbox): fill the text field inside it.
      await field.locator('input:not([type="checkbox"])').first().fill(value);
    }
  }

  /**
   * Get next button
   */
  getNextButton(): Locator {
    return this.stepper.locator('#stepper_next');
  }

  /**
   * Get previous button
   */
  getPreviousButton(): Locator {
    return this.stepper.locator('#stepper_previous');
  }

  /**
   * Get cancel button
   */
  getCancelButton(): Locator {
    return this.stepper.locator('#stepper_cancel');
  }

  /**
   * Check if can go to next step
   */
  async canNext(): Promise<boolean> {
    const nextButton = this.getNextButton();
    return await nextButton.isEnabled();
  }

  /**
   * Go to next step
   */
  async next(): Promise<void> {
    const nextButton = this.getNextButton();
    await nextButton.click();
  }

  /**
   * Go to previous step
   */
  async previous(): Promise<void> {
    const previousButton = this.getPreviousButton();
    await previousButton.click();
  }

  /**
   * Cancel stepper
   */
  async cancel(): Promise<void> {
    const cancelButton = this.getCancelButton();
    await cancelButton.click();
  }

  /**
   * Wait for stepper to be visible
   */
  async waitUntilShown(): Promise<void> {
    await this.stepper.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Get current step index (0-based)
   */
  async getCurrentStepIndex(): Promise<number> {
    const activeStep = this.stepper.locator('.mat-step-header[aria-selected="true"], .mat-stepper-horizontal-line-active').first();
    const allSteps = this.stepper.locator('.mat-step-header');
    const count = await allSteps.count();

    for (let i = 0; i < count; i++) {
      const step = allSteps.nth(i);
      const isActive = await step.getAttribute('aria-selected') === 'true';
      if (isActive) {
        return i;
      }
    }

    return 0;
  }
}
