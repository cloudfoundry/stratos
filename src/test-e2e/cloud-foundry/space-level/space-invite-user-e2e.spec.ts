import { promise } from 'protractor';

import { E2EConfigCloudFoundry } from '../../e2e.types';
import { CFHelpers } from '../../helpers/cf-helpers';
import { setupInviteUserTests } from '../invite-users-e2e.helper';
import { CfSpaceLevelPage } from './cf-space-level-page.po';

fdescribe('CF - Space - Invite User - ', () => {
  let spacePage: CfSpaceLevelPage;

  const navToSpaceUserList = (cfHelper: CFHelpers, defaultCf: E2EConfigCloudFoundry) => {
    return promise.all([
      cfHelper.fetchDefaultCfGuid(true),
      cfHelper.fetchDefaultOrgGuid(true),
      cfHelper.fetchDefaultSpaceGuid(true)
    ]).then(([cfGuid, orgGuid, spaceGuid]) => {
      spacePage = CfSpaceLevelPage.forEndpoint(cfGuid, orgGuid, spaceGuid);
      spacePage.navigateTo();
      return spacePage.goToUsersTab();
    });
  };

  const navToCfSummary = () => spacePage.breadcrumbs.getBreadcrumbs().then(breadcrumbs => breadcrumbs[0].click());

  setupInviteUserTests(true, navToSpaceUserList, navToCfSummary);

});


// fdescribe('test', () => {

//   beforeAll(() => {
//     const defaultCf = e2e.secrets.getDefaultCFEndpoint();
//     const setup = e2e.setup(ConsoleUserType.admin)
//       .clearAllEndpoints()
//       .registerDefaultCloudFoundry()
//       .connectAllEndpoints(ConsoleUserType.admin)
//       .connectAllEndpoints(ConsoleUserType.user);
//     const page = new CFPage();
//     page.sideNav.goto(SideNavMenuItem.CloudFoundry);

//     return promise.fullyResolved(true).then(() => promise.rejected('REASON'));
//   });

//   it('1', () => {
//     console.log('1');
//   });

//   it('2', () => {
//     console.log('2');
//   });


//   // it('long', () => {
//   //   return promise.defer().promise;
//   // });
// });
