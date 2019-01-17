import { LoadingIndicatorComponent } from './../../po/loading-indicator.po';
import { CfUserTableTestLevel, setupCfUserTableTests } from '../users-list-e2e.helper';
import { CfOrgLevelPage } from './cf-org-level-page.po';
import { by, element } from 'protractor';
import { e2e } from '../../e2e';

describe('Org Users List -', () => {
  setupCfUserTableTests(CfUserTableTestLevel.Org, (cfGuid, orgGuid) => {
    const orgPage = CfOrgLevelPage.forEndpoint(cfGuid, orgGuid);
    orgPage.navigateTo();
    orgPage.waitForPageOrChildPage();
    orgPage.loadingIndicator.waitUntilNotShown();
    e2e.log('Waiting for org detail...');
    // Wait until the loading indicator for the bottom tile grid has gone as well
    // const tileLoadingIndicator = new LoadingIndicatorComponent(element(by.css('app-tile-grid')));
    // tileLoadingIndicator.waitUntilNotShown('Org detaal loading indicator', 10000);
    // Just wait until the users tab is visible
    e2e.log('Wait for user tab');
    e2e.sleep(5000);
    e2e.log('Go to user tab');
    return orgPage.goToUsersTab();
  });
});
