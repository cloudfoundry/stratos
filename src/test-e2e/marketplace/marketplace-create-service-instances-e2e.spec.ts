import { browser } from 'protractor';

import { e2e, E2ESetup } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { CreateMarketplaceServiceInstance } from './create-marketplace-service-instance.po';
import { MarketplaceInstancesPage } from './marketplace-instances.po';
import { MarketplaceSummaryPage } from './marketplace-summary.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';

describe('Service Instance from Marketplace', () => {
  let setup: E2ESetup;
  const servicesWall = new ServicesWallPage();
  let servicesInstances: MarketplaceInstancesPage;
  const timeout = 60000;
  let serviceInstanceName: string;

  beforeAll(() => {
    setup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo();
  });

  describe('Create Public Service Instance', () => {
    let servicesHelperE2E: ServicesHelperE2E;
    let marketplaceSummaryPage: MarketplaceSummaryPage;
    const serviceName = e2e.secrets.getDefaultCFEndpoint().services.publicService.name;
    beforeAll(() => init(setup, serviceName).then(res => {
      servicesHelperE2E = res.servicesHelper;
      marketplaceSummaryPage = res.summaryPage;
    }));

    beforeEach(() => {
      marketplaceSummaryPage.navigateTo();
      marketplaceSummaryPage.waitForPage();
    });

    describe('Long running test', () => {
      extendE2ETestTime(timeout);
      it('- should be able to create a new service instance', () => {
        serviceInstanceName = servicesHelperE2E.createServiceInstanceName();
        createService(marketplaceSummaryPage, servicesHelperE2E, serviceName, servicesWall, serviceInstanceName);
      }, timeout);
    });

    afterAll(() => servicesHelperE2E.cleanUpServiceInstance(serviceInstanceName));
  });

  describe('Create Private Service Instance', () => {
    let servicesHelperE2E: ServicesHelperE2E;
    let marketplaceSummaryPage: MarketplaceSummaryPage;
    const serviceName = e2e.secrets.getDefaultCFEndpoint().services.privateService.name;
    beforeAll(() => init(setup, serviceName).then(res => {
      servicesHelperE2E = res.servicesHelper;
      marketplaceSummaryPage = res.summaryPage;
    }));

    beforeEach(() => {
      marketplaceSummaryPage.navigateTo();
      marketplaceSummaryPage.waitForPage();
    });

    describe('Long running test', () => {
      extendE2ETestTime(timeout);
      it('- should be able to create a new service instance', () => {
        serviceInstanceName = servicesHelperE2E.createServiceInstanceName();
        createService(marketplaceSummaryPage, servicesHelperE2E, serviceName, servicesWall, serviceInstanceName);
      }, timeout);
    });

    afterAll(() => servicesHelperE2E.cleanUpServiceInstance(serviceInstanceName));
  });

  describe('Create Space Scoped Service Instance', () => {
    let servicesHelperE2E: ServicesHelperE2E;
    let marketplaceSummaryPage: MarketplaceSummaryPage;
    const serviceName = e2e.secrets.getDefaultCFEndpoint().services.spaceScopedService.name;
    beforeAll(() => init(setup, serviceName).then(res => {
      servicesHelperE2E = res.servicesHelper;
      marketplaceSummaryPage = res.summaryPage;
    }));

    beforeEach(() => {
      marketplaceSummaryPage.navigateTo();
      marketplaceSummaryPage.waitForPage();
    });

    describe('Long running test', () => {

      extendE2ETestTime(timeout);
      it('- should be able to create a new service instance', () => {
        serviceInstanceName = servicesHelperE2E.createServiceInstanceName();
        createService(marketplaceSummaryPage, servicesHelperE2E, serviceName, servicesWall, serviceInstanceName);
      }, timeout);
    });

    afterAll(() => servicesHelperE2E.cleanUpServiceInstance(serviceInstanceName));
  });

  function createService(
    marketplaceSummaryPage: MarketplaceSummaryPage,
    servicesHelperE2E: ServicesHelperE2E,
    serviceName: string,
    servicesWall: ServicesWallPage,
    serviceInstanceName: string
  ) {
    expect(marketplaceSummaryPage.getAddServiceInstanceButton().isPresent()).toBeTruthy();
    marketplaceSummaryPage.getAddServiceInstanceButton().click();
    servicesHelperE2E.createServiceInstance.waitForPage();
    browser.getCurrentUrl().then(url => {
      expect(url.indexOf('isSpaceScoped=false') >= 0).toBeTruthy();
      // Proceed to create a service instance
      servicesHelperE2E.createService(serviceName, serviceInstanceName, true);

      servicesInstances.waitForPage();
      servicesInstances.list.header.setSearchText(serviceInstanceName);
      servicesInstances.list.table.findRow('name', serviceInstanceName, true);
    });
  }

  function init(
    setup: E2ESetup,
    serviceName: string,
  ) {
    const defaultCf = e2e.secrets.getDefaultCFEndpoint();
    const endpointGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);

    const servicesHelperE2E = new ServicesHelperE2E(setup);
    return servicesHelperE2E.fetchServices(endpointGuid).then(response => {
      serviceName = e2e.secrets.getDefaultCFEndpoint().services.publicService.name;
      const service = response.resources.find(e => e.entity.label === serviceName);
      const serviceGuid = service.metadata.guid;
      servicesHelperE2E.setCreateServiceInstance(
        new CreateMarketplaceServiceInstance('/marketplace/' + endpointGuid + '/' + serviceGuid + '/create')
      );
      servicesInstances = new MarketplaceInstancesPage(endpointGuid, serviceGuid);
      const marketplaceSummaryPage = new MarketplaceSummaryPage(endpointGuid, serviceGuid);
      return { servicesHelper: servicesHelperE2E, summaryPage: marketplaceSummaryPage };
    });
  }
});
