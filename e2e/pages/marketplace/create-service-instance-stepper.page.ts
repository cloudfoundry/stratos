import { Page, Locator } from '@playwright/test';
import { StepperBase } from '../../helpers/stepper-base';

/**
 * Create Service Instance Stepper
 * Multi-step service instance creation wizard
 */
export class CreateServiceInstanceStepper extends StepperBase {
  private cfFieldName = 'cf';
  private orgFieldName = 'org';
  private spaceFieldName = 'space';
  private serviceFieldName = 'service';
  private serviceNameFieldName = 'name';
  private bindApp = 'apps';

  constructor(page: Page) {
    super(page);
  }

  async waitForStepCloudFoundry(): Promise<void> {
    await this.waitForStep('Cloud Foundry');
  }

  private async waitForStep(stepName: string): Promise<void> {
    const stepHeader = this.stepper.locator('.mat-step-label, .stepper-label').filter({ hasText: stepName });
    await stepHeader.waitFor({ state: 'visible', timeout: 10000 });
  }

  async setCf(cfName: string): Promise<void> {
    await this.fillStepperField(this.cfFieldName, cfName);
  }

  async setOrg(orgName: string): Promise<void> {
    await this.fillStepperField(this.orgFieldName, orgName);
  }

  async setSpace(spaceName: string): Promise<void> {
    await this.fillStepperField(this.spaceFieldName, spaceName);
  }

  async setService(serviceName: string, expectFailure: boolean = false): Promise<void> {
    if (expectFailure) {
      // For failure cases, just fill without waiting for success
      const form = this.getStepperForm();
      const field = form.locator(`[name="${this.serviceFieldName}"], [formcontrolname="${this.serviceFieldName}"]`);
      await field.fill(serviceName);
    } else {
      await this.fillStepperField(this.serviceFieldName, serviceName);
    }
  }

  async setServiceName(serviceInstanceName: string): Promise<void> {
    await this.fillStepperField(this.serviceNameFieldName, serviceInstanceName);
  }

  async setBindApp(bindAppName: string): Promise<void> {
    await this.fillStepperField(this.bindApp, bindAppName);
  }

  async isBindAppStepDisabled(): Promise<boolean> {
    return await this.isStepDisabled('Bind App (Optional)');
  }

  private async isStepDisabled(stepName: string): Promise<boolean> {
    const stepHeader = this.stepper.locator('.mat-step-header').filter({ hasText: stepName });
    const isDisabled = await stepHeader.getAttribute('aria-disabled') === 'true';
    return isDisabled;
  }
}
