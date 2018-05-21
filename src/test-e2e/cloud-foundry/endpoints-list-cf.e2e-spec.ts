
import { CloudFoundryPage } from '../cloud-foundry/cloud-foundry.po';
import { EndpointsPage, resetToLoggedIn } from '../endpoints/endpoints.po';
import { ResetsHelpers } from '../helpers/reset-helpers';
import { SecretsHelpers } from '../helpers/secrets-helpers';
import { SideNavMenuItem, SideNavigation } from '../po/side-nav.po';

describe('CF Endpoints Dashboard', () => {
  const secrets = new SecretsHelpers();
  const resets = new ResetsHelpers();
  const endpointsPage = new EndpointsPage();
  const cloudFoundry = new CloudFoundryPage();
  const nav = new SideNavigation();

  describe('No endpoints', () => {
    beforeAll(() => {
      resetToLoggedIn(resets.resetAllEndpoints, false);
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
    const cfEndpoint = secrets.getDefaultCFEndpoint();
    beforeAll(() => {
      // Only register and connect a single Cloud Foundry endpoint
      resetToLoggedIn(resets.resetAndConnectEndpoints.bind(resets, null, null, false, cfEndpoint.name), true);
    });

    beforeEach(() => {
      nav.goto(SideNavMenuItem.CloudFoundry);
    });

    it('should be the CF Summary tab', () => {
      expect(cloudFoundry.isSummaryView()).toBeTruthy();
    });

    it('should not have any breadcrumbs', () => {
      expect(cloudFoundry.header.getTitle()).toBe(cfEndpoint.name);
      expect(cloudFoundry.breadcrumbs.isPresent()).toBeFalsy();
    });
  });

  describe('Multiple endpoints', () => {
    const cfEndpoint = secrets.getDefaultCFEndpoint();
    beforeAll(() => {
      resetToLoggedIn(resets.resetAndConnectEndpoints.bind(resets, null, null, true), true);
    });

    beforeEach(() => {
      nav.goto(SideNavMenuItem.CloudFoundry);
    });

    it('should be the CF Endpoints page', () => {
      cloudFoundry.list.cards.getCards().then(cards => {
        expect(cards.length).toBeGreaterThan(1);
        cards[0].click();
        expect(cloudFoundry.header.getTitle()).toBe(cfEndpoint.name);
      });
    });
  });
});
