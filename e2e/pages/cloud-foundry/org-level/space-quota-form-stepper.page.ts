import { Page } from '@playwright/test';
import { QuotaFormStepperBase } from '../quota-form-stepper-base.page';

/**
 * Space Quota Form Stepper
 * Stepper for space quota creation/edit
 */
export class SpaceQuotaFormStepper extends QuotaFormStepperBase {
  constructor(page: Page) {
    super(page);
  }
}
