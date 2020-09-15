import { e2e, E2ESetup } from '../../e2e';
import { E2EConfigCloudFoundry } from '../../e2e.types';
import { ConsoleUserType } from '../../helpers/e2e-helpers';
import { SideNavMenuItem } from '../../po/side-nav.po';
import { CfTopLevelPage } from './cf-top-level-page.po';

describe('CF - Top Level - ', () => {

  let cfPage: CfTopLevelPage;
  let e2eSetup: E2ESetup;
  let defaultCf: E2EConfigCloudFoundry;

  function navToCfPage() {
    // There is only one CF endpoint registered (since that is what we setup)
    const page = new CfTopLevelPage();
    page.sideNav.goto(SideNavMenuItem.CloudFoundry);
    CfTopLevelPage.detect().then(p => {
      cfPage = p;
      cfPage.waitForPageOrChildPage();
      cfPage.loadingIndicator.waitUntilNotShown();
    });
  }

  beforeAll(() => {
    defaultCf = e2e.secrets.getDefaultCFEndpoint();
    e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .connectAllEndpoints(ConsoleUserType.user);
  });

  describe('As Admin -', () => {
    beforeAll(() => {
      e2eSetup.loginAs(ConsoleUserType.admin);
    });

    describe('Basic Tests -', () => {
      it('Nav to CF Page', navToCfPage);

      it('Breadcrumb', () => {
        expect(cfPage.header.getTitleText()).toBe(defaultCf.name);
      });

      it('Summary Panel', () => {
        expect(cfPage.waitForInstanceAddressValue()).toBe(defaultCf.url);
        expect(cfPage.waitForUsername().getValue()).toBe(`${defaultCf.creds.admin.username} (Administrator)`);
        expect(cfPage.isUserInviteConfigured(true)).toBeFalsy();
        expect(cfPage.canConfigureUserInvite()).toBeTruthy();
      });

      it('Walk Tabs', () => {
        cfPage.goToOrgTab();
        cfPage.goToRoutesTab();
        cfPage.goToUsersTab();
        cfPage.goToFeatureFlagsTab();
        cfPage.goToBuildPacksTab();
        cfPage.goToStacksTab();
        cfPage.goToSecurityGroupsTab();
        cfPage.goToSummaryTab();
        cfPage.goToFirehoseTab();
      });

    });

  });

  describe('As User', () => {
    beforeAll(() => {
      e2eSetup = e2e.setup(ConsoleUserType.admin)
        .loginAs(ConsoleUserType.user);
    });

    describe('Basic Tests -', () => {

      it('Nav to CF Page', navToCfPage);

      it('Breadcrumb', () => {
        expect(cfPage.header.getTitleText()).toBe(defaultCf.name);
      });

      it('Summary Panel', () => {
        expect(cfPage.waitForInstanceAddressValue()).toBe(defaultCf.url);
        expect(cfPage.waitForUsername().getValue()).toBe(defaultCf.creds.nonAdmin.username);
        expect(cfPage.isUserInviteConfigured(false)).toBeFalsy();
        expect(cfPage.canConfigureUserInvite()).toBeFalsy();
      });

      it('Walk Tabs', () => {
        cfPage.goToOrgTab();
        // cfPage.goToUsersTab();// Is not shown to non-admins
        cfPage.goToRoutesTab();
        // cfPage.goToFirehoseTab();// Is not shown to non-admins
        cfPage.goToFeatureFlagsTab();
        cfPage.goToBuildPacksTab();
        cfPage.goToStacksTab();
        cfPage.goToSecurityGroupsTab();
        cfPage.goToSummaryTab();
      });
    });
  });

});
