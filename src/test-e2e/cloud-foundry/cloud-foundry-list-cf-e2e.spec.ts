import { CF_ENDPOINT_TYPE } from '../../frontend/packages/cloud-foundry/src/cf-types';
import { E2E, e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { ListComponent } from '../po/list.po';
import { SideNavigation, SideNavMenuItem } from '../po/side-nav.po';
import { CfTopLevelPage } from './cf-level/cf-top-level-page.po';

describe('CF Endpoints Dashboard - ', () => {
  const cloudFoundry = new CfTopLevelPage();
  const nav = new SideNavigation();
  const cfEndpoint = e2e.secrets.getDefaultCFEndpoint();

  describe('No endpoints - ', () => {
    beforeAll(() => {
      e2e.setup(ConsoleUserType.admin)
        .clearAllEndpoints();
    });

    if (!E2E.customization.alwaysShowNavForEndpointTypes || E2E.customization.alwaysShowNavForEndpointTypes(CF_ENDPOINT_TYPE)) {
      beforeEach(() => {
        nav.goto(SideNavMenuItem.CloudFoundry);
        cloudFoundry.loadingIndicator.waitUntilNotShown();
      });

      it('should be the Endpoints page', () => {
        expect(cloudFoundry.isActivePage()).toBeTruthy();
      });

      it('should show the `no registered endpoints` message', () => {
        expect(cloudFoundry.hasNoCloudFoundryMessage).toBeTruthy();
      });
    } else {
      it('No CF side nav when no CF connected', () => {
        expect(nav.isMenuItemPresent(SideNavMenuItem.CloudFoundry)).toBeFalsy();
      });
    }
  });

  describe('Single endpoint - ', () => {
    beforeAll(() => {
      // Only register and connect a single Cloud Foundry endpoint
      e2e.setup(ConsoleUserType.admin)
        .clearAllEndpoints()
        .registerDefaultCloudFoundry()
        .connectAllEndpoints();
    });

    beforeEach(() => {
      nav.goto(SideNavMenuItem.CloudFoundry);
    });

    it('should be the CF Summary tab', () => {
      expect(cloudFoundry.isSummaryView()).toBeTruthy();
    });

    it('should not have any breadcrumbs', () => {
      expect(cloudFoundry.header.getTitleText()).toBe(cfEndpoint.name);
      expect(cloudFoundry.breadcrumbs.waitUntilNotShown());
    });
  });

  describe('Multiple endpoints - ', () => {
    if (!e2e.secrets.haveSingleCloudFoundryEndpoint) {
      beforeAll(() => {
        e2e.setup(ConsoleUserType.admin)
          .clearAllEndpoints()
          .registerMultipleCloudFoundries()
          .connectAllEndpoints();
      });

      beforeEach(() => {
        nav.goto(SideNavMenuItem.CloudFoundry);
        cloudFoundry.waitForPage();
      });

      it('should be the CF Endpoints page', () => {
        const list = new ListComponent();
        list.cards.getCards().then(cards => {
          expect(cards.length).toBeGreaterThan(1);
          cards[0].click();
          expect(cloudFoundry.header.getTitleText()).toBe(cfEndpoint.name);
        });
      });
    }
  });
});
