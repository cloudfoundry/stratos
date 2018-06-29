import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by, ElementArrayFinder } from 'protractor';
import { CFPage } from '../po/cf-page.po';
import { ListComponent } from '../po/list.po';
import { id } from '@swimlane/ngx-charts/release/utils';

export class ApplicationsPage extends CFPage {

  appList = new ListComponent();

  constructor() {
    super('/applications');
  }

  clickCreateApp(): any {
    this.helpers.waitForElementAndClick(element(by.id('appwall-create-application')));
  }
}
