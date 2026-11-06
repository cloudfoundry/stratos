import { Page } from '@playwright/test';
import { BasePage } from '../../base.page';
import { SpaceFormStepper } from './space-form-stepper.page';

/**
 * Space Form Page
 * Create/edit space with stepper
 */
export class SpaceFormPage extends BasePage {
  public stepper: SpaceFormStepper;

  constructor(page: Page, url?: string) {
    super(page);
    this.stepper = new SpaceFormStepper(page);
  }

  async submit(): Promise<void> {
    if (await this.stepper.canNext()) {
      await this.stepper.next();
    }
  }
}
