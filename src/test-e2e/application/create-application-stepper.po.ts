import { StepperComponent } from '../po/stepper.po';
import { promise } from 'protractor';

export class CreateApplicationStepper extends StepperComponent {

  private cfFieldName = 'cf';
  private orgFieldName = 'org';
  private spaceFieldName = 'space';
  private appNameFieldName = 'appname';
  private routeHostNameFieldName = 'hostname';

  isStepCloudFoundry = () => {
    super.isStep('Cloud Foundry');
  }

  isStepName = () => {
    super.isStep('Name');
  }

  isStepRoute = () => {
    super.isStep('Create Route');
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

  setAppName(appName: string) {
    return this.getStepperForm().fill({ [this.appNameFieldName]: appName });
  }

  setRouteHostName(hostName: string) {
    return this.getStepperForm().fill({ [this.routeHostNameFieldName]: hostName });
  }

  isRouteHostValue(hostName: string) {
    // const formField = this.getStepperForm().getFormField(this.routeHostNameFieldName);
    expect(this.getStepperForm().getText(this.routeHostNameFieldName, true)).toBe(hostName);
  }

  fixRouteHost(hostName: string): promise.Promise<void> {
    const fixedHostName = hostName.replace(/[\.:-]/g, '');
    return this.setRouteHostName(fixedHostName);
  }
}
