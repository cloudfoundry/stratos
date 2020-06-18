import { promise } from 'protractor';

import { E2EConfigCloudFoundry } from '../../e2e.types';
import { CFHelpers } from '../../helpers/cf-e2e-helpers';
import { setupInviteUserTests } from '../invite-users-e2e.helper';
import { CfSpaceLevelPage } from './cf-space-level-page.po';

describe('CF - Space - Invite User - ', () => {
  let spacePage: CfSpaceLevelPage;

  const navToSpaceUserList = (cfHelper: CFHelpers, defaultCf: E2EConfigCloudFoundry) => {
    return promise.all([
      cfHelper.fetchDefaultCfGuid(true),
      cfHelper.fetchDefaultOrgGuid(true),
      cfHelper.fetchDefaultSpaceGuid(true)
    ])
      .then(([cfGuid, orgGuid, spaceGuid]) => {
        spacePage = CfSpaceLevelPage.forEndpoint(cfGuid, orgGuid, spaceGuid);
        return spacePage.navigateTo();
      })
      .then(() => spacePage.goToUsersTab());
  };

  const navToCfSummary = () => spacePage.breadcrumbs.getBreadcrumbs().then(breadcrumbs => breadcrumbs[0].click());

  setupInviteUserTests(true, navToSpaceUserList, navToCfSummary);

});
