import { by, element, protractor } from 'protractor';

import { e2e } from '../../e2e';
import { E2EConfigCloudFoundry } from '../../e2e.types';
import { CFHelpers } from '../../helpers/cf-e2e-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { extendE2ETestTime } from '../../helpers/extend-test-helpers';
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
  let cfGuid: string;
  let orgGuid: string;
  let spaceGuid: string;
  let spaceName: string;
  let cfHelper: CFHelpers;

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
    spacePage.goToUPSITab();
    spacePage.goToRoutesTab();
    spacePage.goToUsersTab();
    spacePage.goToSummaryTab();
  }

  function navToPage() {
    describe('', () => {

      // Allow additional time for navigation
      extendE2ETestTime(70000);

      // Tests that the given users can navigate through the org and space lists
      it('Nav to Space', () => {
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
      });
    });
  }

  beforeAll(() => {
    defaultCf = e2e.secrets.getDefaultCFEndpoint();
    const e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .connectAllEndpoints(ConsoleUserType.user)
      .getInfo(ConsoleUserType.admin);

    return protractor.promise.controlFlow().execute(() => {
      cfHelper = new CFHelpers(e2eSetup);
      cfGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);
      spaceName = E2EHelpers.createCustomName(E2EHelpers.e2eItemPrefix + 'space');

      return cfHelper.fetchDefaultOrgGuid(true)
        .then((oGuid) => {
          orgGuid = oGuid;
          return cfHelper.baseAddSpace(cfGuid, orgGuid, spaceName);
        })
        .then(space => spaceGuid = space.metadata.guid);
    });
  });

  describe('As Admin -', () => {
    beforeAll(() => {
      e2e.setup(ConsoleUserType.admin)
        .loginAs(ConsoleUserType.admin);
    });

    describe('Basic Tests -', () => {
      navToPage();

      it('Breadcrumb', testBreadcrumb);

      it('Walk Tabs', testTabs);
    });

    describe('#destroy', () => {
      beforeEach(() => {
        spacePage = CfSpaceLevelPage.forEndpoint(cfGuid, orgGuid, spaceGuid);
        spacePage.navigateTo();
      });

      it('- should delete space', () => {
        spacePage.deleteSpace(spaceName);
        expect(element(by.tagName('app-cards')).getText()).not.toContain(spaceName);
      });
    });

  });

  describe('As User -', () => {
    beforeAll(() => {
      e2e.setup(ConsoleUserType.user)
        .loginAs(ConsoleUserType.user);
    });

    describe('Basic Tests -', () => {
      navToPage();

      it('Breadcrumb', testBreadcrumb);

      it('Walk Tabs', testTabs);
    });
  });

  afterAll(() => {
    return cfHelper.deleteSpaceIfExisting(cfGuid, orgGuid, spaceName);
  });
});
