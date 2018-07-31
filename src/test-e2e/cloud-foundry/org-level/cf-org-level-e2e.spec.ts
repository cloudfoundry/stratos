import { browser } from 'protractor';

import { ApplicationE2eHelper } from '../../application/application-e2e-helpers';
import { e2e, E2ESetup } from '../../e2e';
import { E2EConfigCloudFoundry } from '../../e2e.types';
import { ConsoleUserType } from '../../helpers/e2e-helpers';
import { CfOrgLevelPage } from './cf-org-level-page.po';


describe('CF - Org Level - ', () => {

  let orgPage: CfOrgLevelPage;
  let e2eSetup: E2ESetup;
  let defaultCf: E2EConfigCloudFoundry;
  let applicationE2eHelper: ApplicationE2eHelper;

  function setup(user: ConsoleUserType) {
    e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .connectAllEndpoints(ConsoleUserType.user)
      .loginAs(user)
      .getInfo();
    applicationE2eHelper = new ApplicationE2eHelper(e2eSetup);
  }

  function testBreadcrumb() {
    orgPage.breadcrumbs.waitUntilShown();
    orgPage.breadcrumbs.getBreadcrumbs().then(breadcrumbs => {
      expect(breadcrumbs.length).toBe(1);
      expect(breadcrumbs[0].label).toBe(defaultCf.name);
    });
    expect(orgPage.header.getTitleText()).toBe(defaultCf.testOrg);
  }

  function testTabs() {
    orgPage.goToSpacesTab();
    orgPage.goToUsersTab();
    orgPage.goToSummaryTab();
  }

  function navToPage() {
    defaultCf = e2e.secrets.getDefaultCFEndpoint();
    const endpointGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);
    browser.wait(applicationE2eHelper.cfHelper.fetchOrg(endpointGuid, defaultCf.testOrg).then((org => {
      orgPage = CfOrgLevelPage.forEndpoint(endpointGuid, org.metadata.guid);
      orgPage.navigateTo();
      orgPage.waitForPageOrChildPage();
      orgPage.loadingIndicator.waitUntilNotShown();
    })));
  }

  describe('As Admin', () => {
    beforeEach(() => {
      setup(ConsoleUserType.admin);
    });

    describe('Basic Tests - ', () => {
      beforeEach(navToPage);

      it('Breadcrumb', testBreadcrumb);

      it('Walk Tabs', testTabs);

    });

  });

  describe('As User', () => {
    beforeEach(() => {
      setup(ConsoleUserType.user);
    });

    describe('Basic Tests - ', () => {
      beforeEach(navToPage);

      it('Breadcrumb', testBreadcrumb);

      it('Walk Tabs', testTabs);

    });
  });

});
