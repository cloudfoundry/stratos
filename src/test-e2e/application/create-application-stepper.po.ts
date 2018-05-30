import { StepperComponent } from '../po/stepper.po';

export class CreateApplicationStepper extends StepperComponent {

  private cfFieldName = 'cf';
  private orgFieldName = 'org';
  private spaceFieldName = 'space';
  private appNameFieldName = 'appName';
  private routeHostNameFieldName = 'hostName';

  setCf = (cfName: string) => {
    this.getStepperForm().fill({ [this.cfFieldName]: cfName });
  }

  setOrg = (orgName: string) => {
    this.getStepperForm().fill({ [this.orgFieldName]: orgName });
  }

  setSpace = (spaceName: string) => {
    this.getStepperForm().fill({ [this.spaceFieldName]: spaceName });
  }

  setAppName(appName: string) {
    this.getStepperForm().fill({ [this.appNameFieldName]: appName });
  }

  isRouteHostValue(hostName: string) {
    expect(this.getStepperForm().getField(this.routeHostNameFieldName)).toBe(hostName);
  }
}
