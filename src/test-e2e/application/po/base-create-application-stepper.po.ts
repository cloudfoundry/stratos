import { TileSelector } from '../../po/tile-selector.po';
import { CreateApplicationShellStepper } from './create-application-shell-stepper.po';
import { DeployApplication } from './deploy-app.po';

export enum APPLICATION_CREATION_TYPES {
  DEPLOY = 'application-deploy',
  DEPLOY_URL = 'application-deploy-url',
  SHELL = 'application-shell',
  DOCKER = 'application-docker'
}
export class BaseCreateApplicationStepper {
  public tiles = new TileSelector();
  public selectCreationType(type: APPLICATION_CREATION_TYPES) {
    switch (type) {
      case APPLICATION_CREATION_TYPES.SHELL:
        this.tiles.select('Application Shell');
        return new CreateApplicationShellStepper();
      case APPLICATION_CREATION_TYPES.DEPLOY:
        this.tiles.select('Public GitHub');
        return new DeployApplication();
      case APPLICATION_CREATION_TYPES.DEPLOY_URL:
        this.tiles.select('Public Git URL');
        return new DeployApplication();
      case APPLICATION_CREATION_TYPES.DOCKER:
        this.tiles.select('Docker Image');
        return new DeployApplication();
    }
  }
}
