import { browser } from 'protractor';

import { e2e, E2ESetup } from '../../e2e';
import { E2EConfigCloudFoundry } from '../../e2e.types';
import { CFHelpers } from '../../helpers/cf-helpers';
import { ConsoleUserType } from '../../helpers/e2e-helpers';
import { CfSpaceLevelPage } from './cf-space-level-page.po';


describe('CF - Space Level - ', () => {

  let spacePage: CfSpaceLevelPage;
  let e2eSetup: E2ESetup;
  let defaultCf: E2EConfigCloudFoundry;
  let cfHelper: CFHelpers;

  function setup(user: ConsoleUserType) {
    e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .connectAllEndpoints(ConsoleUserType.user)
      .loginAs(user)
      .getInfo();
    cfHelper = new CFHelpers(e2eSetup);
  }

  function testBreadcrumb() {
    spacePage.breadcrumbs.waitUntilShown();
    spacePage.breadcrumbs.getBreadcrumbs().then(breadcrumbs => {
      expect(breadcrumbs.length).toBe(2);
      expect(breadcrumbs[0].label).toBe(defaultCf.name);
      expect(breadcrumbs[1].label).toBe(defaultCf.testOrg);
    });
    expect(spacePage.header.getTitleText()).toBe(defaultCf.testSpace);
  }

  function testTabs() {
    spacePage.goToAppsTab();
    spacePage.goToSITab();
    spacePage.goToRoutesTab();
    spacePage.goToUsersTab();
    spacePage.goToSummaryTab();
  }

  function navToPage() {
    defaultCf = e2e.secrets.getDefaultCFEndpoint();
    const endpointGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);
    browser.wait(cfHelper.fetchSpace(endpointGuid, defaultCf.testSpace).then((space => {
      spacePage = CfSpaceLevelPage.forEndpoint(endpointGuid, space.entity.organization_guid, space.metadata.guid);
      spacePage.navigateTo();
      spacePage.waitForPageOrChildPage();
      spacePage.loadingIndicator.waitUntilNotShown();
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
