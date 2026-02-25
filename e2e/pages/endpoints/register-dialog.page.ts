import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Register Endpoint Stepper Page Object
 * Migrated from src/test-e2e/endpoints/register-dialog.po.ts
 *
 * Handles the endpoint registration stepper workflow
 */
export class RegisterStepperPage extends BasePage {
  private readonly stepper: Locator;
  private readonly form: Locator;
  private readonly pageHeader: Locator;
  private readonly nameField: Locator;
  private readonly addressField: Locator;
  private readonly nextButton: Locator;
  private readonly cancelButton: Locator;
  private readonly finishButton: Locator;

  constructor(page: Page) {
    super(page);

    this.stepper = page.locator('app-steppers, mat-horizontal-stepper');
    this.form = page.locator('form');
    this.pageHeader = page.locator('app-page-header');
    this.nameField = page.locator('input[name="name"], input[formcontrolname="name"]').first();
    this.addressField = page.locator('input[name="url"], input[formcontrolname="url"]').first();
    this.nextButton = page.locator('button').filter({ hasText: /next/i });
    this.cancelButton = page.locator('button').filter({ hasText: /cancel/i });
    this.finishButton = page.locator('button').filter({ hasText: /finish/i });
  }

  /**
   * Navigate to register endpoint page
   */
  async navigateTo(): Promise<void> {
    await this.page.goto('/endpoints/register');
  }

  /**
   * Check if on register dialog page
   */
  async isRegisterDialog(): Promise<boolean> {
    const titleText = await this.getTitleText();
    return titleText === 'Register Endpoint';
  }

  /**
   * Get page title text
   */
  async getTitleText(): Promise<string> {
    const titleElement = this.pageHeader.locator('h1, .page-header__title');
    return await titleElement.textContent() || '';
  }

  /**
   * Get name field locator
   */
  getName(): Locator {
    return this.nameField;
  }

  /**
   * Get address/URL field locator
   */
  getAddress(): Locator {
    return this.addressField;
  }

  /**
   * Fill name field
   */
  async fillName(name: string): Promise<void> {
    await this.nameField.fill(name);
  }

  /**
   * Fill address field
   */
  async fillAddress(address: string): Promise<void> {
    await this.addressField.fill(address);
  }

  /**
   * Click next button in stepper
   */
  async clickNext(): Promise<void> {
    await this.nextButton.click();
  }

  /**
   * Click cancel button
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Click finish button
   */
  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  /**
   * Check if next button is enabled
   */
  async canGoNext(): Promise<boolean> {
    return await this.nextButton.isEnabled();
  }

  /**
   * Check if finish button is enabled
   */
  async canFinish(): Promise<boolean> {
    return await this.finishButton.isEnabled();
  }

  /**
   * Get current step index
   */
  async getCurrentStep(): Promise<number> {
    const steps = this.stepper.locator('.mat-step-header');
    const count = await steps.count();

    for (let i = 0; i < count; i++) {
      const step = steps.nth(i);
      const isSelected = await step.getAttribute('aria-selected');
      if (isSelected === 'true') {
        return i;
      }
    }

    return 0;
  }

  /**
   * Wait for stepper to be visible
   */
  async waitForStepper(): Promise<void> {
    await this.stepper.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Get form locator
   */
  getForm(): Locator {
    return this.form;
  }
}
