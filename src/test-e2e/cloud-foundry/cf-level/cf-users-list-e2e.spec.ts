import { browser, promise, protractor } from 'protractor';

import { e2e } from '../../e2e';
import { CFHelpers } from '../../helpers/cf-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { CFUsersListComponent } from '../../po/cf-users-list.po';
import { CfTopLevelPage } from './cf-top-level-page.po';

const customOrgSpacesLabel = E2EHelpers.e2eItemPrefix + (process.env.CUSTOM_APP_LABEL || process.env.USER) + '-cf-users';


fdescribe('Cf Users List -', () => {


  let cfHelper: CFHelpers, cfGuid, defaultCf, cfPage: CfTopLevelPage;
  let orgGuid, spaceGuid;

  const orgName = E2EHelpers.createCustomName(customOrgSpacesLabel);
  const spaceName = E2EHelpers.createCustomName(customOrgSpacesLabel);
  const userName = e2e.secrets.getDefaultCFEndpoint().creds.nonAdmin.username;

  function setUpTestOrgSpaceUserRoles(): promise.Promise<any> {
    return cfHelper.addOrgIfMissingForEndpointUsers(cfGuid, defaultCf, orgName)
      .then(org => {
        orgGuid = org.metadata.guid;
        return cfHelper.addSpaceIfMissingForEndpointUsers(cfGuid, org.metadata.guid, orgName, spaceName, defaultCf, true);
      })
      .then(space => spaceGuid = space.metadata.guid)
      .then(() => cfHelper.addOrgUserRole(cfGuid, orgGuid, userName))
      .then(() => promise.all([
        cfHelper.addOrgUserManager(cfGuid, orgGuid, userName),
        cfHelper.addOrgUserAuditor(cfGuid, orgGuid, userName),
        cfHelper.addOrgUserBillingManager(cfGuid, orgGuid, userName),
        cfHelper.addSpaceDeveloper(cfGuid, spaceGuid, userName),
        cfHelper.addSpaceAuditor(cfGuid, spaceGuid, userName),
        cfHelper.addSpaceManager(cfGuid, spaceGuid, userName),
      ])
      )
      .catch(e => {
        console.log(`Failed to setup new org, space or roles: '${e}'`);
        throw e;
      });
  }

  beforeAll(() => {
    const e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      // .connectAllEndpoints(ConsoleUserType.user)
      .loginAs(ConsoleUserType.admin)
      .getInfo(ConsoleUserType.admin);
    // Create a test org and space, start off with all roles
    protractor.promise.controlFlow().execute(() => {
      defaultCf = e2e.secrets.getDefaultCFEndpoint();
      // Only available until after `info` call has completed as part of setup
      cfGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);

      cfHelper = new CFHelpers(e2eSetup);

      browser.wait(setUpTestOrgSpaceUserRoles());

      cfPage = CfTopLevelPage.forEndpoint(cfGuid);
      cfPage.navigateTo();
      cfPage.waitForPageOrChildPage();
      cfPage.loadingIndicator.waitUntilNotShown();
      return cfPage.goToUsersTab();
    });
  });

  it('Test initial state', () => {
    expect(cfPage.isActivePageOrChildPage()).toBeTruthy();
    const usersTable = new CFUsersListComponent();
    usersTable.header.setSearchText(userName);
    expect(usersTable.getTotalResults()).toBe(1);
    usersTable.getUserRoles(0).then(userRoles => {
      const users = userRoles.filter(userRole => userRole.username === userName);
      expect(users).toBeTruthy();
      expect(users.length).toBe(1);
      expect(users[0][CFUsersListComponent.orgHeader][orgName]).toBeTruthy('Unable to find roles for org: ' + orgName);
      const orgRoles: string[] = users[0][CFUsersListComponent.orgHeader][orgName].roles;
      expect(orgRoles).toBeTruthy();
      expect(orgRoles.indexOf('Manager')).toBeGreaterThanOrEqual(0);
      expect(orgRoles.indexOf('User')).toBeGreaterThanOrEqual(0);
      expect(orgRoles.indexOf('Billing Manager')).toBeGreaterThanOrEqual(0);
      expect(orgRoles.indexOf('Auditor')).toBeGreaterThanOrEqual(0);
      const spaceRoles: string[] = users[0][CFUsersListComponent.spaceHeader][orgName].spaces[spaceName];
      expect(spaceRoles).toBeTruthy();
      expect(spaceRoles.indexOf('Manager')).toBeGreaterThanOrEqual(0);
      expect(spaceRoles.indexOf('Developer')).toBeGreaterThanOrEqual(0);
      expect(spaceRoles.indexOf('Auditor')).toBeGreaterThanOrEqual(0);
    });
  });

  afterAll(() => {
    return cfHelper.deleteOrgIfExisting(cfGuid, orgName);
  });
});
