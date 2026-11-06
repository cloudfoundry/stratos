import { Page } from '@playwright/test';
import { StepperBase } from '../../../helpers/stepper-base';

/**
 * Organization Form Stepper
 * Stepper for organization creation/edit
 */
export class OrgFormStepper extends StepperBase {
  private orgFieldName = 'orgname';
  private quotaFieldName = 'quotadefinition';

  constructor(page: Page) {
    super(page);
  }

  async setOrg(orgName: string): Promise<void> {
    await this.fillStepperField(this.orgFieldName, orgName);
  }

  async setQuotaDefinition(quotaDefinition: string): Promise<void> {
    await this.fillStepperField(this.quotaFieldName, quotaDefinition);
  }
}
