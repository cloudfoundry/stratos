import { CfSpaceLevelPage } from './cf-space-level-page.po';
import { setupCfUserRemovalTests, CfUserRemovalTestLevel, CfRolesRemovalLevel } from '../users-removal-e2e.helper';

describe('CF - Space Level - Remove user', () => {
  setupCfUserRemovalTests(CfUserRemovalTestLevel.Space, CfRolesRemovalLevel.Spaces, (cfGuid, orgGuid, spaceGuid) => {
    const spacePage = CfSpaceLevelPage.forEndpoint(cfGuid, orgGuid, spaceGuid);
    spacePage.navigateTo();
    spacePage.waitForPageOrChildPage();
    spacePage.loadingIndicator.waitUntilNotShown();
    return spacePage.goToUsersTab();
  });
});
