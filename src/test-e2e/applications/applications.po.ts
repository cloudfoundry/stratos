import { by, element } from 'protractor';

import { DeployApplication } from '../application/po/deploy-app.po';
import { CFPage } from '../po/cf-page.po';
import { ListComponent } from '../po/list.po';
import { CreateApplication } from '../application/po/create-application.po';

export class ApplicationsPage extends CFPage {

  static FilterIds = {
    cf: 'cf',
    org: 'org',
    space: 'space'
  };

  appList = new ListComponent();

  constructor() {
    super('/applications');
  }

  clickCreateApp() {
    this.helpers.waitForElementAndClick(element(by.id('appwall-create-application')));
    return new CreateApplication();
  }
}
