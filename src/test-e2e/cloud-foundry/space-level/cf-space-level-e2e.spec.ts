import { e2e } from '../../e2e';
import { E2EConfigCloudFoundry } from '../../e2e.types';
import { ConsoleUserType } from '../../helpers/e2e-helpers';
import { CFPage } from '../../po/cf-page.po';
import { ListComponent } from '../../po/list.po';
import { MetaCardTitleType } from '../../po/meta-card.po';
import { SideNavMenuItem } from '../../po/side-nav.po';
import { CfTopLevelPage } from '../cf-level/cf-top-level-page.po';
import { CfOrgLevelPage } from '../org-level/cf-org-level-page.po';
import { CfSpaceLevelPage } from './cf-space-level-page.po';


describe('CF - Space Level -', () => {

  let spacePage: CfSpaceLevelPage;
  let defaultCf: E2EConfigCloudFoundry;
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
    const page = new CFPage();
    page.sideNav.goto(SideNavMenuItem.CloudFoundry);
    CfTopLevelPage.detect().then(cfPage => {
      cfPage.waitForPageOrChildPage();
      cfPage.loadingIndicator.waitUntilNotShown();
      cfPage.goToOrgTab();

      // Find the Org and click on it
      const list = new ListComponent();
      list.cards.findCardByTitle(defaultCf.testOrg, MetaCardTitleType.CUSTOM, true).then(card => {
        expect(card).toBeDefined();
        card.click();
      });
      CfOrgLevelPage.detect().then(orgPage => {
        orgPage.waitForPageOrChildPage();
        orgPage.loadingIndicator.waitUntilNotShown();
        orgPage.goToSpacesTab();

        // Find the Space and click on it
        const spaceList = new ListComponent();
        spaceList.cards.findCardByTitle(defaultCf.testSpace, MetaCardTitleType.CUSTOM, true).then(card => {
          expect(card).toBeDefined();
          card.click();
        });
        CfSpaceLevelPage.detect().then(s => {
          spacePage = s;
          spacePage.waitForPageOrChildPage();
          spacePage.loadingIndicator.waitUntilNotShown();
        });

      });
    });
  }


  beforeAll(() => {
    defaultCf = e2e.secrets.getDefaultCFEndpoint();
    e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .connectAllEndpoints(ConsoleUserType.user);
  });

  describe('As Admin -', () => {
    beforeAll(() => {
      e2e.setup(ConsoleUserType.admin)
        .loginAs(ConsoleUserType.admin);
    });

    describe('Basic Tests -', () => {
      beforeEach(navToPage);

      it('Breadcrumb', testBreadcrumb);

      it('Walk Tabs', testTabs);
    });

  });

  describe('As User -', () => {
    beforeAll(() => {
      e2e.setup(ConsoleUserType.admin)
        .loginAs(ConsoleUserType.admin);
    });

    describe('Basic Tests -', () => {
      beforeEach(navToPage);

      it('Breadcrumb', testBreadcrumb);

      it('Walk Tabs', testTabs);
    });
  });

});
