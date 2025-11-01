import { Page } from '@playwright/test';
import { StepperBase } from '../../../helpers/stepper-base';

/**
 * Space Form Stepper
 * Stepper for space creation/edit
 */
export class SpaceFormStepper extends StepperBase {
  private spaceFieldName = 'spacename';
  private quotaFieldName = 'quotadefinition';

  constructor(page: Page) {
    super(page);
  }

  async setSpaceName(spaceName: string): Promise<void> {
    await this.fillStepperField(this.spaceFieldName, spaceName);
  }

  async setQuotaDefinition(quotaDefinition: string): Promise<void> {
    await this.fillStepperField(this.quotaFieldName, quotaDefinition);
  }
}
