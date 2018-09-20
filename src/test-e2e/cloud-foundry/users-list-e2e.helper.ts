import { browser, promise } from 'protractor';
import { protractor } from 'protractor/built/ptor';

import { e2e } from '../e2e';
import { E2EConfigCloudFoundry } from '../e2e.types';
import { CFHelpers } from '../helpers/cf-helpers';
import { ConsoleUserType } from '../helpers/e2e-helpers';

export function setUpTestOrgSpaceE2eTest(
  orgName: string,
  spaceName: string,
  userName: string,
  dropBillingManager = false
) {
  const e2eSetup = e2e.setup(ConsoleUserType.admin)
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
      new CFHelpers(e2eSetup),
      dropBillingManager));
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
  let orgGuid, spaceGuid;
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
