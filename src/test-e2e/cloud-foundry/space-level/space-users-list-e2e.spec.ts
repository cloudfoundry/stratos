import { CfUserTableTestLevel, setupCfUserTableTests } from '../users-list-e2e.helper';
import { CfSpaceLevelPage } from './cf-space-level-page.po';

describe('Space Users List -', () => {
  setupCfUserTableTests(CfUserTableTestLevel.Space, (cfGuid, orgGuid, spaceGuid) => {
    const spacePage = CfSpaceLevelPage.forEndpoint(cfGuid, orgGuid, spaceGuid);
    spacePage.navigateTo();
    spacePage.waitForPageOrChildPage();
    spacePage.loadingIndicator.waitUntilNotShown();
    return spacePage.goToUsersTab();
  });
});
