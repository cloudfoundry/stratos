import { LoadingIndicatorComponent } from './../../po/loading-indicator.po';
import { CfUserTableTestLevel, setupCfUserTableTests } from '../users-list-e2e.helper';
import { CfOrgLevelPage } from './cf-org-level-page.po';
import { by, element } from 'protractor';

describe('Org Users List -', () => {
  setupCfUserTableTests(CfUserTableTestLevel.Org, (cfGuid, orgGuid) => {
    const orgPage = CfOrgLevelPage.forEndpoint(cfGuid, orgGuid);
    orgPage.navigateTo();
    orgPage.waitForPageOrChildPage();
    orgPage.loadingIndicator.waitUntilNotShown();
    // Wait until the loading indicator for the bottom tile grid has gone as well
    //const tileLoadingIndicator = new LoadingIndicatorComponent(element(by.css('app-tile-grid')));
    //tileLoadingIndicator.waitUntilNotShown();
    // Just wait until the users tab is visible
    orgPage.waitForTab('Users');
    return orgPage.goToUsersTab();
  });
});
