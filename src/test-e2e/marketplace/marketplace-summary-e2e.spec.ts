import { browser } from 'protractor';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { MarketplaceSummaryPage } from './marketplace-summary.po';
import { ServicesHelperE2E } from './services-helper-e2e';

describe('Marketplace Summary', () => {
  let marketplaceSummaryPage: MarketplaceSummaryPage;
  let cfGuid: string;
  let serviceGuid: string;
  let servicesHelperE2E: ServicesHelperE2E;

  beforeAll(() => {
    const setup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin);
    servicesHelperE2E = new ServicesHelperE2E(setup);
  });

  describe('', () => {
    beforeAll(() => {
      const getCfCnsi = servicesHelperE2E.cfRequestHelper.getCfInfo();
      return getCfCnsi.then(endpointModel => {
        cfGuid = endpointModel.guid;
        return servicesHelperE2E.fetchServices(cfGuid);
      }).then(response => {
        const service = response.resources[0];
        serviceGuid = service.metadata.guid;
        marketplaceSummaryPage = new MarketplaceSummaryPage(cfGuid, serviceGuid);
      });
    });

    beforeEach(() => {
      marketplaceSummaryPage.navigateTo();
      marketplaceSummaryPage.waitForPage();
    });

    it('- should reach marketplace summary page', () => {
      expect(marketplaceSummaryPage.isActivePage()).toBeTruthy();
    });

    it('- should have a service summary card', () => {
      expect(marketplaceSummaryPage.getServiceSummaryCard().isPresent()).toBeTruthy();
    });

    it('- should have a recent service instances card', () => {
      expect(marketplaceSummaryPage.getRecentInstances().isPresent()).toBeTruthy();
    });
    it('- should have an Add Service Instance button', () => {
      expect(marketplaceSummaryPage.getAddServiceInstanceButton().isPresent()).toBeTruthy();
    });

    it('- should be able to create a new service instance', () => {
      const button = marketplaceSummaryPage.header.getIconButton('add');
      expect(button).toBeDefined();
      button.then(bt => bt.click());
      browser.getCurrentUrl().then(url => {
        expect(url.indexOf('create?isSpaceScoped=false') >= 0).toBeTruthy();
      });
    });
  });

});
