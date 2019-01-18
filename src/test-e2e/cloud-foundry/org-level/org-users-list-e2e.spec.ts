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
    const pageLevelLoadingIndicator = new LoadingIndicatorComponent(element(by.id('cf-org-summary-loading')));
    pageLevelLoadingIndicator.waitUntilNotShown();
    return orgPage.goToUsersTab();
  });
});
