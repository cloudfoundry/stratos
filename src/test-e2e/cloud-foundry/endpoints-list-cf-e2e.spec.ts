
import { CloudFoundryPage } from '../cloud-foundry/cloud-foundry.po';
import { e2e } from '../e2e';
import { EndpointsPage } from '../endpoints/endpoints.po';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { SideNavMenuItem, SideNavigation } from '../po/side-nav.po';

describe('CF Endpoints Dashboard', () => {
  const cloudFoundry = new CloudFoundryPage();
  const nav = new SideNavigation();
  const cfEndpoint = e2e.secrets.getDefaultCFEndpoint();

  describe('No endpoints', () => {
    beforeAll(() => {
      e2e.setup(ConsoleUserType.admin)
        .clearAllEndpoints();
    });

    beforeEach(() => {
      nav.goto(SideNavMenuItem.CloudFoundry);
    });

    it('should be the CF Endpoints page', () => {
      expect(cloudFoundry.isActivePage()).toBeTruthy();
    });

    it('should show the `no registered endpoints` message', () => {
      expect(cloudFoundry.hasNoCloudFoundryMesasge).toBeTruthy();
    });
  });

  describe('Single endpoint', () => {
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

  describe('Multiple endpoints', e2e.secrets.haveSingleCloudFoundryEndpoint, () => {
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
      cloudFoundry.list.cards.getCards().then(cards => {
        expect(cards.length).toBeGreaterThan(1);
        cards[0].click();
        expect(cloudFoundry.header.getTitleText()).toBe(cfEndpoint.name);
      });
    });
  });
});
