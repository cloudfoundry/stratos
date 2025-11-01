import { Page } from '@playwright/test';
import { QuotaFormStepperBase } from '../quota-form-stepper-base.page';

/**
 * Quota Form Stepper
 * Stepper for quota creation/edit
 */
export class QuotaFormStepper extends QuotaFormStepperBase {
  constructor(page: Page) {
    super(page);
  }
}
