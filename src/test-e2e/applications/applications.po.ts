import { by, element, protractor } from 'protractor';

import { ApplicationPageSummaryTab } from '../application/po/application-page-summary.po';
import { CreateApplication } from '../application/po/create-application.po';
import { CFPage } from '../po/cf-page.po';
import { ListComponent } from '../po/list.po';
import { SideNavMenuItem } from '../po/side-nav.po';

export class ApplicationsPage extends CFPage {

  static FilterIds = {
    cf: 'cf',
    org: 'org',
    space: 'space'
  };

  appList = new ListComponent();

  static goToAppSummary(appName: string, cfGuid: string, appGuid: string): ApplicationPageSummaryTab {
    const appsPage = new ApplicationsPage();
    // Find app card
    appsPage.sideNav.goto(SideNavMenuItem.Applications);
    appsPage.appList.header.setSearchText(appName);

    // Check for single card
    expect(appsPage.appList.header.getSearchText()).toEqual(appName);
    expect(appsPage.appList.cards.getCardCount()).toBe(1);
    const cardP = appsPage.appList.cards.findCardByTitle(appName);

    // Go to summary
    protractor.promise.controlFlow().execute(() => cardP.then(card => card.click()));
    const appSummary = new ApplicationPageSummaryTab(cfGuid, appGuid);
    appSummary.waitForPage();
    return appSummary;
  }


  constructor() {
    super('/applications');
  }

  clickCreateApp() {
    this.helpers.waitForElementAndClick(element(by.id('appwall-create-application')));
    return new CreateApplication();
  }


}
