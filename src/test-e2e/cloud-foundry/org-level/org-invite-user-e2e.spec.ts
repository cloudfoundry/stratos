import { E2EConfigCloudFoundry } from '../../e2e.types';
import { CFHelpers } from '../../helpers/cf-helpers';
import { setupInviteUserTests } from '../invite-users-e2e.helper';
import { CfOrgLevelPage } from './cf-org-level-page.po';

describe('CF - Org - Invite User - ', () => {
  let orgPage: CfOrgLevelPage;

  const navToOrgUserList = (cfHelper: CFHelpers, defaultCf: E2EConfigCloudFoundry) => {
    return cfHelper.navFromCfToOrg(defaultCf.testOrg).then(o => {
      orgPage = o;
      return orgPage.goToUsersTab();
    });
  };

  const navToCfSummary = () => orgPage.breadcrumbs.getBreadcrumbs().then(breadcrumbs => breadcrumbs[0].click());

  setupInviteUserTests(false, navToOrgUserList, navToCfSummary);

});
