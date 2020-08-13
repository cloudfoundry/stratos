import { browser, promise } from 'protractor';
import { protractor } from 'protractor/built/ptor';

import { e2e, E2ESetup } from '../e2e';
import { E2EConfigCloudFoundry } from '../e2e.types';
import { CFHelpers } from '../helpers/cf-e2e-helpers';
import { ConsoleUserType, E2EHelpers } from '../helpers/e2e-helpers';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { CFUsersListComponent, UserRoleChip } from '../po/cf-users-list.po';

export enum CfUserTableTestLevel {
  Cf = 1,
  Org = 2,
  Space = 3
}

export function setUpTestOrgSpaceE2eTest(
  orgName: string,
  spaceName: string,
  userName: string,
  dropBillingManager = false,
  e2eSetup?: E2ESetup
) {
  const pe2eSetup = e2eSetup || e2e.setup(ConsoleUserType.admin)
    .clearAllEndpoints()
    .registerDefaultCloudFoundry()
    .connectAllEndpoints(ConsoleUserType.admin)
    .loginAs(ConsoleUserType.admin)
    .getInfo(ConsoleUserType.admin);
  // Create a test org and space, start off with all roles
  return protractor.promise.controlFlow().execute(() => {
    const defaultCf = e2e.secrets.getDefaultCFEndpoint();
    // Only available until after `info` call has completed as part of setup
    const cfGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);
    return browser.wait(setUpTestOrgSpaceUserRoles(
      cfGuid,
      defaultCf,
      orgName,
      spaceName,
      userName,
      new CFHelpers(pe2eSetup),
      dropBillingManager), 25000, 'Did not complete "setUpTestOrgSpaceUserRoles" within 25 seconds');
  });
}

export function setUpTestOrgSpaceUserRoles(
  cfGuid: string,
  defaultCf: E2EConfigCloudFoundry,
  orgName: string,
  spaceName: string,
  userName: string,
  cfHelper: CFHelpers,
  dropBillingManager = false
): promise.Promise<{ cfGuid: string, orgGuid: string, spaceGuid: string, cfHelper: CFHelpers }> {
  let orgGuid;
  let spaceGuid;
  return cfHelper.addOrgIfMissingForEndpointUsers(cfGuid, defaultCf, orgName)
    .then(org => {
      orgGuid = org.metadata.guid;
      return cfHelper.addSpaceIfMissingForEndpointUsers(cfGuid, org.metadata.guid, spaceName, defaultCf, true);
    })
    .then(space => spaceGuid = space.metadata.guid)
    // Allow time for org/space to be created. In theory these requests should be synchronous but have seen failures related to missing
    // space
    .then(() => browser.sleep(500))
    .then(() => cfHelper.addOrgUserRole(cfGuid, orgGuid, userName))
    // Allow time for user to be added to org before applying other roles that are depending. Again should be synchronous but have seen
    // failures
    .then(() => browser.sleep(500))
    .then(() => promise.all([
      cfHelper.addOrgUserManager(cfGuid, orgGuid, userName),
      cfHelper.addOrgUserAuditor(cfGuid, orgGuid, userName),
      dropBillingManager ? promise.fullyResolved('') : cfHelper.addOrgUserBillingManager(cfGuid, orgGuid, userName),
      cfHelper.addSpaceDeveloper(cfGuid, spaceGuid, userName),
      cfHelper.addSpaceAuditor(cfGuid, spaceGuid, userName),
      cfHelper.addSpaceManager(cfGuid, spaceGuid, userName),
    ]))
    .then(() => ({
      cfGuid,
      orgGuid,
      spaceGuid,
      cfHelper
    }))
    .catch(e => {
      e2e.log(`Failed to setup new org, space or roles: '${e}'`);
      throw e;
    });
}

const customOrgSpacesLabel = E2EHelpers.e2eItemPrefix + (process.env.CUSTOM_APP_LABEL || process.env.USER) + '-cf-users';
export function setupCfUserTableTests(
  cfLevel: CfUserTableTestLevel,
  navToUserTableFn: (cfGuid: string, orgGuid: string, spaceGuid: string) => promise.Promise<any>
) {

  const orgName = E2EHelpers.createCustomName(customOrgSpacesLabel);
  const spaceName = E2EHelpers.createCustomName(customOrgSpacesLabel);
  const userName = e2e.secrets.getDefaultCFEndpoint().creds.nonAdmin.username;

  let cfGuid: string;
  let cfHelper: CFHelpers;

  beforeAll(() => {
    let orgGuid: string;
    let spaceGuid: string;

    // Be safe - ensure beforeAll responds with a promise chain with all promises
    return setUpTestOrgSpaceE2eTest(orgName, spaceName, userName)
      .then(res => {
        cfHelper = res.cfHelper;
        cfGuid = res.cfGuid;
        orgGuid = res.orgGuid;
        spaceGuid = res.spaceGuid;
      })
      .then(() => navToUserTableFn(cfGuid, orgGuid, spaceGuid));
  }, 75000);

  describe('Correct role pills shown, pills removed successfully', () => {
    // NOTE - Order is important

    const timeout = 60000;
    extendE2ETestTime(timeout);

    const usersTable = new CFUsersListComponent();
    let userRowIndex = 0;

    let orgUserChip: UserRoleChip;
    const testOrgName = cfLevel === CfUserTableTestLevel.Cf ? orgName : null;
    const testSpaceName = cfLevel === CfUserTableTestLevel.Cf ? spaceName : null;

    beforeAll(() => {
      usersTable.waitUntilShown();
      usersTable.waitForNoLoadingIndicator(20000);
      usersTable.header.waitUntilShown('User table header');
      usersTable.header.setSearchText(userName);
      return usersTable.table.findRow('username', userName).then(row => {
        userRowIndex = row;
        expect(usersTable.table.getCell(userRowIndex, 1).getText()).toBe(userName);

        orgUserChip = usersTable.getPermissionChip(userRowIndex, testOrgName, null, true, 'User');
        usersTable.expandOrgsChips(userRowIndex);
        return usersTable.expandSpaceChips(userRowIndex);
      });
    });

    it('Check org user pill is present and cannot be removed', () => {
      expect(orgUserChip.isPresent()).toBeTruthy();
      orgUserChip.check(false);
    });

    it('Check space pills are present, can be removed and then remove', () => {
      const spaceDeveloperChip = usersTable.getPermissionChip(userRowIndex, testOrgName, testSpaceName, false, 'Developer');
      spaceDeveloperChip.check(true);
      spaceDeveloperChip.remove();
      const spaceAuditorChip = usersTable.getPermissionChip(userRowIndex, testOrgName, testSpaceName, false, 'Auditor');
      spaceAuditorChip.check(true);
      spaceAuditorChip.remove();
      const spaceManagerChip = usersTable.getPermissionChip(userRowIndex, testOrgName, testSpaceName, false, 'Manager');
      spaceManagerChip.check(true);
      spaceManagerChip.remove();
    });

    // If we're at space level, as soon as the space roles are removed the user is not visible

    if (cfLevel === CfUserTableTestLevel.Space) {
      it('Check user is not visible if they have no space roles', () => {
        usersTable.empty.waitUntilShown('`No users` message');
      });
    } else {
      it('Check org pills are present, can be removed and then remove', () => {
        const orgBillingManagerChip = usersTable.getPermissionChip(userRowIndex, testOrgName, null, true, 'Billing Manager');
        orgBillingManagerChip.check(true);
        orgBillingManagerChip.remove();
        const orgAuditorChip = usersTable.getPermissionChip(userRowIndex, testOrgName, null, true, 'Auditor');
        orgAuditorChip.check(true);
        orgAuditorChip.remove();
        const orgManagerChip = usersTable.getPermissionChip(userRowIndex, testOrgName, null, true, 'Manager');
        orgManagerChip.check(true);
        orgManagerChip.remove();
      });

      it('Check org user pill can now be removed and remove it', () => {
        // Requires all previous tests
        orgUserChip.check(true);
        orgUserChip.remove();
      });
    }
  });

  afterAll(() => cfHelper.deleteOrgIfExisting(cfGuid, orgName));
}
