import { e2e } from '../../e2e';
import { E2EConfigCloudFoundry } from '../../e2e.types';
import { ConsoleUserType } from '../../helpers/e2e-helpers';
import { CFPage } from '../../po/cf-page.po';
import { ListComponent } from '../../po/list.po';
import { MetaCardTitleType } from '../../po/meta-card.po';
import { SideNavMenuItem } from '../../po/side-nav.po';
import { CfTopLevelPage } from '../cf-level/cf-top-level-page.po';
import { CfOrgLevelPage } from './cf-org-level-page.po';

describe('CF - Org Level - ', () => {

  let orgPage: CfOrgLevelPage;
  let defaultCf: E2EConfigCloudFoundry;

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
    const page = new CFPage();
    page.sideNav.goto(SideNavMenuItem.CloudFoundry);
    return CfTopLevelPage.detect().then(cfPage => {
      cfPage.waitForPageOrChildPage();
      cfPage.loadingIndicator.waitUntilNotShown();
      cfPage.goToOrgTab();

      // Find the Org and click on it
      const list = new ListComponent();
      return list.cards.findCardByTitle(defaultCf.testOrg, MetaCardTitleType.CUSTOM, true).then(card => {
        expect(card).toBeDefined();
        card.click();

        return CfOrgLevelPage.detect().then(o => {
          orgPage = o;
          orgPage.waitForPageOrChildPage();
          orgPage.loadingIndicator.waitUntilNotShown();
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

  describe('As Admin', () => {
    beforeAll(() => {
      e2e.setup(ConsoleUserType.admin)
        .loginAs(ConsoleUserType.admin);
    });

    describe('Basic Tests - ', () => {
      it('Nav to org', navToPage);

      it('Breadcrumb', testBreadcrumb);

      it('Walk Tabs', testTabs);

    });

  });

  describe('As User', () => {
    beforeAll(() => {
      e2e.setup(ConsoleUserType.user)
        .loginAs(ConsoleUserType.user);
    });

    describe('Basic Tests - ', () => {
      it('Nav to org', navToPage);

      it('Breadcrumb', testBreadcrumb);

      it('Walk Tabs', testTabs);

    });
  });

});
