import { StepperComponent } from '../po/stepper.po';


export class CreateServiceInstanceStepper extends StepperComponent {

  private cfFieldName = 'cf';
  private orgFieldName = 'org';
  private spaceFieldName = 'space';
  private serviceFieldName = 'service';
  private serviceNameFieldName = 'name';
  private bindApp = 'apps';

  constructor() {
    super();
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
  setService = (serviceName: string, expectFailure = false) => {
    return this.getStepperForm().fill({ [this.serviceFieldName]: serviceName }, expectFailure);
  }

  setServiceName = (serviceInstanceName: string) => {
    return this.getStepperForm().fill({ [this.serviceNameFieldName]: serviceInstanceName });
  }

  setBindApp = (bindAppName: string) => {
    return this.getStepperForm().fill({ [this.bindApp]: bindAppName });
  }

  isBindAppStepDisabled = () => {
    return this.isStepDisabled('Bind App (Optional)');
  }

}
