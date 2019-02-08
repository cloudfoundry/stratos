import { e2e, E2ESetup } from '../../e2e';
import { E2EConfigCloudFoundry } from '../../e2e.types';
import { ConsoleUserType } from '../../helpers/e2e-helpers';
import { CfTopLevelPage } from './cf-top-level-page.po';
import { SideNavMenuItem } from '../../po/side-nav.po';
import { CFPage } from '../../po/cf-page.po';
import { ListComponent } from '../../po/list.po';

describe('CF - Top Level - ', () => {

  let cfPage: CfTopLevelPage;
  let e2eSetup: E2ESetup;
  let defaultCf: E2EConfigCloudFoundry;

  function navToCfPage() {
    // There is only one CF endpoint registered (since that is what we setup)
    const page = new CFPage();
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

  describe('As Admin', () => {
    beforeAll(() => {
      e2eSetup.loginAs(ConsoleUserType.admin);
    });

    describe('Basic Tests -', () => {
      beforeEach(navToCfPage);

      beforeEach(() => {
      });

      it('Breadcrumb', () => {
        expect(cfPage.header.getTitleText()).toBe(defaultCf.name);
      });

      it('Summary Panel', () => {
        expect(cfPage.waitForInstanceAddress().getValue()).toBe(defaultCf.url);
        expect(cfPage.waitForUsername().getValue()).toBe(defaultCf.creds.admin.username);
        expect(cfPage.waitForAdministrator().getBooleanIndicator().getLabel()).toBe('Yes');
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

      beforeEach(navToCfPage);

      it('Breadcrumb', () => {
        expect(cfPage.header.getTitleText()).toBe(defaultCf.name);
      });

      it('Summary Panel', () => {
        expect(cfPage.waitForInstanceAddress().getValue()).toBe(defaultCf.url);
        expect(cfPage.waitForUsername().getValue()).toBe(defaultCf.creds.nonAdmin.username);
        expect(cfPage.waitForAdministrator().getBooleanIndicator().getLabel()).toBe('No');
      });

      it('Walk Tabs', () => {
        cfPage.goToOrgTab();
        const orgs = new ListComponent();
        orgs.waitUntilShown();
        orgs.getTotalResults().then(totalOrgs => {
          if (totalOrgs <= 12) {
            cfPage.goToUsersTab();
          }
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

});
