import { promise } from 'protractor';

import { StepperComponent } from '../../po/stepper.po';
import { ApplicationE2eHelper } from '../application-e2e-helpers';


export class CreateApplicationShellStepper extends StepperComponent {

  private cfFieldName = 'cf';
  private orgFieldName = 'org';
  private spaceFieldName = 'space';
  private appNameFieldName = 'appname';
  private routeHostNameFieldName = 'hostname';

  waitForStepCloudFoundry = () => {
    return super.waitForStep('Cloud Foundry');
  }

  waitForStepName = () => {
    return super.waitForStep('Name');
  }

  waitForStepRoute = () => {
    return super.waitForStep('Create Route');
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
    expect(this.getStepperForm().getText(this.routeHostNameFieldName)).toBe(hostName);
  }

  fixRouteHost(hostName: string): promise.Promise<void> {
    const fixedHostName = ApplicationE2eHelper.getHostName(hostName);
    return this.setRouteHostName(fixedHostName);
  }
}
