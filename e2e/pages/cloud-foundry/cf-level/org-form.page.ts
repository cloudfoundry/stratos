import { Page } from '@playwright/test';
import { BasePage } from '../../base.page';
import { OrgFormStepper } from './org-form-stepper.page';

/**
 * Organization Form Page
 * Create/edit organization with stepper
 */
export class OrgFormPage extends BasePage {
  public stepper: OrgFormStepper;

  constructor(page: Page, url?: string) {
    super(page);
    this.stepper = new OrgFormStepper(page);
  }

  async submit(): Promise<void> {
    if (await this.stepper.canNext()) {
      await this.stepper.next();
    }
  }
}
