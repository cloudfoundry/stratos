import { by, element } from 'protractor';

import { DeployApplication } from '../application/po/deploy-app.po';
import { CFPage } from '../po/cf-page.po';
import { ListComponent } from '../po/list.po';

export class ApplicationsPage extends CFPage {

  appList = new ListComponent();

  constructor() {
    super('/applications');
  }

  clickCreateApp(): any {
    this.helpers.waitForElementAndClick(element(by.id('appwall-create-application')));
  }

  clickDeployApp(): DeployApplication {
    this.helpers.waitForElementAndClick(element(by.id('appwall-deploy-application')));
    const deployApp = new DeployApplication();
    deployApp.waitForPage();
    return deployApp;
  }

}
