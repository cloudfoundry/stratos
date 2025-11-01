import { Page } from '@playwright/test';
import { BasePage } from '../../base.page';
import { QuotaFormStepper } from './quota-form-stepper.page';

/**
 * Quota Form Page
 * Create/edit quota with stepper
 */
export class QuotaFormPage extends BasePage {
  public stepper: QuotaFormStepper;

  constructor(page: Page, url?: string) {
    super(page);
    this.stepper = new QuotaFormStepper(page);
  }

  async submit(): Promise<void> {
    if (await this.stepper.canNext()) {
      await this.stepper.next();
    }
  }
}
