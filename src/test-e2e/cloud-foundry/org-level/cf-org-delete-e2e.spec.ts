import { by, element, protractor } from 'protractor';

import { e2e } from '../../e2e';
import { CFHelpers } from '../../helpers/cf-e2e-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { CFPage } from '../../po/cf-page.po';
import { SideNavMenuItem } from '../../po/side-nav.po';
import { CfTopLevelPage } from '../cf-level/cf-top-level-page.po';

describe('Delete Organization', () => {
  let e2eSetup;
  let cfGuid: string;
  let orgGuid: string;
  let orgName: string;
  let spaceName: string;

  beforeAll(() => {
    e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .loginAs(ConsoleUserType.admin)
      .getInfo(ConsoleUserType.admin);
  });

  beforeAll(() => {
    return protractor.promise.controlFlow().execute(() => {
      const defaultCf = e2e.secrets.getDefaultCFEndpoint();
      // Only available until after `info` call has completed as part of setup
      cfGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);
      orgName = E2EHelpers.createCustomName(E2EHelpers.e2eItemPrefix + 'org');
      spaceName = E2EHelpers.createCustomName(E2EHelpers.e2eItemPrefix + 'space');
      const cfHelper = new CFHelpers(e2eSetup);
      return cfHelper.baseAddOrg(cfGuid, orgName).then(org => {
        orgGuid = org.metadata.guid;
        return cfHelper.baseAddSpace(cfGuid, orgGuid, spaceName);
      });
    });
  });

  afterAll(() => {
    const cfHelper = new CFHelpers(e2eSetup);
    // Delete org and space (in case the test errored)
    return cfHelper.deleteSpaceIfExisting(cfGuid, orgGuid, spaceName).then(() => cfHelper.deleteOrgIfExisting(cfGuid, orgName));
  });

  it('Should be able to delete org that contains a space', () => {
    const page = new CFPage();
    page.sideNav.goto(SideNavMenuItem.CloudFoundry);
    return CfTopLevelPage.detect().then(cfPage => {
      cfPage.waitForPageOrChildPage();
      cfPage.loadingIndicator.waitUntilNotShown();
      cfPage.goToOrgTab();
      cfPage.deleteOrg(orgName);
      expect(element(by.tagName('app-cards')).getText()).not.toContain(orgName);
    });
  });
});
