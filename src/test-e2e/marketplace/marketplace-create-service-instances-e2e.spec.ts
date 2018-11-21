import { browser } from 'protractor';

import { e2e, E2ESetup } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { CreateServiceInstance } from './create-service-instance.po';
import { MarketplaceSummaryPage } from './marketplace-summary.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';

describe('Marketplace', () => {
  let setup: E2ESetup;
  const servicesWall = new ServicesWallPage();
  const timeout = 60000;

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

    it('- should have an Add Service Instance button', () => {
      expect(marketplaceSummaryPage.getAddServiceInstanceButton().isPresent()).toBeTruthy();
    });

    describe('Long running test', () => {
      extendE2ETestTime(timeout);
      it('- should be able to create a new service instance', () => {
        createService(marketplaceSummaryPage, servicesHelperE2E, serviceName, servicesWall);
      }, timeout);
    });

    afterAll(() => servicesHelperE2E.cleanUpServiceInstance(servicesHelperE2E.serviceInstanceName));
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

    it('- should have an Add Service Instance button', () => {
      expect(marketplaceSummaryPage.getAddServiceInstanceButton().isPresent()).toBeTruthy();
    });

    describe('Long running test', () => {
      extendE2ETestTime(timeout);
      it('- should be able to create a new service instance', () => {
        createService(marketplaceSummaryPage, servicesHelperE2E, serviceName, servicesWall);
      }, timeout);
    });

    afterAll(() => servicesHelperE2E.cleanUpServiceInstance(servicesHelperE2E.serviceInstanceName));
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

    it('- should have an Add Service Instance button', () => {
      expect(marketplaceSummaryPage.getAddServiceInstanceButton().isPresent()).toBeTruthy();
    });

    describe('Long running test', () => {
      extendE2ETestTime(timeout);
      it('- should be able to create a new service instance', () => {
        createService(marketplaceSummaryPage, servicesHelperE2E, serviceName, servicesWall);
      }, timeout);
    });

    afterAll(() => servicesHelperE2E.cleanUpServiceInstance(servicesHelperE2E.serviceInstanceName));
  });
});

function createService(
  marketplaceSummaryPage: MarketplaceSummaryPage,
  servicesHelperE2E: ServicesHelperE2E,
  serviceName: string,
  servicesWall: ServicesWallPage) {
  const button = marketplaceSummaryPage.header.getIconButton('add');
  expect(button).toBeDefined();
  button.then(bt => bt.click());
  browser.getCurrentUrl().then(url => {
    expect(url.endsWith('create?isSpaceScoped=false')).toBeTruthy();
    // Proceed to create a service instance
    servicesHelperE2E.createService(serviceName, true);

    servicesWall.waitForPage();

    servicesHelperE2E.getServiceCardWithTitle(servicesWall.serviceInstancesList, servicesHelperE2E.serviceInstanceName);

  });
}

function init(
  setup: E2ESetup,
  serviceName: string,
  spaceScoped = false
) {
  const defaultCf = e2e.secrets.getDefaultCFEndpoint();
  const endpointGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);

  const servicesHelperE2E = new ServicesHelperE2E(setup);
  return servicesHelperE2E.fetchServices(endpointGuid).then(response => {
    serviceName = e2e.secrets.getDefaultCFEndpoint().services.publicService.name;
    const service = response.resources.find(e => e.entity.label === serviceName);
    const serviceGuid = service.metadata.guid;
    servicesHelperE2E.setCreateServiceInstance(
      new CreateServiceInstance('/marketplace/' + endpointGuid + '/' + serviceGuid +
        '/create?isSpaceScoped=' + (spaceScoped ? 'true' : 'false')));
    const marketplaceSummaryPage = new MarketplaceSummaryPage(endpointGuid, serviceGuid);
    return { servicesHelper: servicesHelperE2E, summaryPage: marketplaceSummaryPage };
  });
}

