import { browser } from 'protractor';

import { e2e, E2ESetup } from '../../e2e';
import { E2EConfigCloudFoundry } from '../../e2e.types';
import { CFHelpers } from '../../helpers/cf-helpers';
import { ConsoleUserType } from '../../helpers/e2e-helpers';
import { CfSpaceLevelPage } from './cf-space-level-page.po';


describe('CF - Space Level -', () => {

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
    browser.wait(
      cfHelper.fetchDefaultSpaceGuid(true)
        .then(spaceGuid => {
          spacePage = CfSpaceLevelPage.forEndpoint(
            cfHelper.cachedDefaultCfGuid,
            cfHelper.cachedDefaultOrgGuid,
            cfHelper.cachedDefaultSpaceGuid
          );
          return spacePage.navigateTo();
        })
        .then(() => spacePage.waitForPageOrChildPage())
        .then(() => spacePage.loadingIndicator.waitUntilNotShown())
    );
  }

  describe('As Admin -', () => {
    beforeEach(() => {
      setup(ConsoleUserType.admin);
    });

    describe('Basic Tests -', () => {
      beforeEach(navToPage);

      it('Breadcrumb', testBreadcrumb);

      it('Walk Tabs', testTabs);
    });

  });

  describe('As User -', () => {
    beforeEach(() => {
      setup(ConsoleUserType.user);
    });

    describe('Basic Tests -', () => {
      beforeEach(navToPage);

      it('Breadcrumb', testBreadcrumb);

      it('Walk Tabs', testTabs);
    });
  });

});
