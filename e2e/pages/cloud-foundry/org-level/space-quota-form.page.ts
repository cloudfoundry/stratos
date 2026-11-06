import { Page } from '@playwright/test';
import { BasePage } from '../../base.page';
import { SpaceQuotaFormStepper } from './space-quota-form-stepper.page';

/**
 * Space Quota Form Page
 * Create/edit space quota with stepper
 */
export class SpaceQuotaFormPage extends BasePage {
  public stepper: SpaceQuotaFormStepper;

  constructor(page: Page, url?: string) {
    super(page);
    this.stepper = new SpaceQuotaFormStepper(page);
  }

  async submit(): Promise<void> {
    if (await this.stepper.canNext()) {
      await this.stepper.next();
    }
  }
}
