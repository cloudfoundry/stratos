import { CfRolesRemovalLevel, CfUserRemovalTestLevel, setupCfUserRemovalTests } from '../users-removal-e2e.helper';
import { CfOrgLevelPage } from './cf-org-level-page.po';

describe('CF - Org Level - Remove user roles', () => {
  setupCfUserRemovalTests(CfUserRemovalTestLevel.Org, CfRolesRemovalLevel.OrgsSpaces, (cfGuid, orgGuid) => {
    const orgPage = CfOrgLevelPage.forEndpoint(cfGuid, orgGuid);
    orgPage.navigateTo();
    orgPage.waitForPageOrChildPage();
    orgPage.loadingIndicator.waitUntilNotShown();
    return orgPage.goToUsersTab();
  });
});

describe('CF - Org Level - Remove user roles (only spaces)', () => {
  setupCfUserRemovalTests(CfUserRemovalTestLevel.Org, CfRolesRemovalLevel.Spaces, (cfGuid, orgGuid) => {
    const orgPage = CfOrgLevelPage.forEndpoint(cfGuid, orgGuid);
    orgPage.navigateTo();
    orgPage.waitForPageOrChildPage();
    orgPage.loadingIndicator.waitUntilNotShown();
    return orgPage.goToUsersTab();
  });
});
