import { Page } from '../../po/page.po';
import { APPLICATION_CREATION_TYPES, BaseCreateApplicationStepper } from './base-create-application-stepper.po';
import { CreateApplicationShellStepper } from './create-application-shell-stepper.po';
import { DeployApplication } from './deploy-app.po';



export class CreateApplication extends Page {

  private baseStepper = new BaseCreateApplicationStepper();

  public selectShell() {
    return this.baseStepper.selectCreationType(APPLICATION_CREATION_TYPES.SHELL) as CreateApplicationShellStepper;
  }

  public selectDeploy() {
    return this.baseStepper.selectCreationType(APPLICATION_CREATION_TYPES.DEPLOY) as DeployApplication;
  }

  public selectDeployUrl() {
    return this.baseStepper.selectCreationType(APPLICATION_CREATION_TYPES.DEPLOY_URL) as DeployApplication;
  }

  public selectDeployDocker() {
    return this.baseStepper.selectCreationType(APPLICATION_CREATION_TYPES.DOCKER) as DeployApplication;
  }

  constructor(url = '/applications/new') {
    super(url);
  }

}
