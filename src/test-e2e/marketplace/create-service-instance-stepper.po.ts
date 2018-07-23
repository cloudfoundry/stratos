import { StepperComponent } from '../po/stepper.po';

export class CreateServiceInstanceStepper extends StepperComponent {

  private cfFieldName = 'cf';
  private orgFieldName = 'org';
  private spaceFieldName = 'space';
  private serviceFieldName = 'service';
  private serviceNameFieldName = 'name';
  public serviceInstanceName;

  constructor() {
    super();
    const testTime = (new Date()).toISOString();
    this.serviceInstanceName = `serviceInstance-${testTime}`;
  }

  waitForStepCloudFoundry = () => {
    return super.waitForStep('Cloud Foundry');
  }

  setCf = (cfName: string) => {
    return this.getStepperForm().fill({ [this.cfFieldName]: cfName });
  }

  setOrg = (orgName: string) => {
    return this.getStepperForm().fill({ [this.orgFieldName]: orgName });
  }

  setSpace = (spaceName: string) => {
    return this.getStepperForm().fill({ [this.spaceFieldName]: spaceName });
  }
  setService = (serviceName: string) => {
    return this.getStepperForm().fill({ [this.serviceFieldName]: serviceName });
  }

  setServiceName = () => {

    return this.getStepperForm().fill({ [this.serviceNameFieldName]: this.serviceInstanceName });
  }

}
