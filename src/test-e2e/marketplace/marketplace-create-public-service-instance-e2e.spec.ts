import { MarketplaceSummaryPage } from './marketplace-summary.po';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { e2e, E2ESetup } from '../e2e';
import { browser } from 'protractor';
import { ServicesHelperE2E } from './services-helper-e2e';
import { CreateServiceInstance } from './create-service-instance.po';

fdescribe('Marketplace', () => {
  let marketplaceSummaryPage: MarketplaceSummaryPage;
  let cfGuid: string;
  let serviceGuid: string;
  let serviceName: string;
  let setup: E2ESetup;
  const createServiceInstance = new CreateServiceInstance();
  beforeAll(() => {
    setup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin);

  });

  describe('Create Public Service Instance', () => {
    let servicesHelperE2E: ServicesHelperE2E;
    beforeAll((done) => {
      init(setup, serviceName, serviceGuid, marketplaceSummaryPage, done); );

  });

  beforeEach(() => {
    marketplaceSummaryPage.navigateTo();
    marketplaceSummaryPage.waitForPage();

  });
  it('- should have an Add Service Instance button', () => {
    expect(marketplaceSummaryPage.getAddServiceInstanceButton().isPresent()).toBeTruthy();
  });

  it('- should be able to create a new service instance', () => {
    const button = marketplaceSummaryPage.header.getIconButton('add');
    expect(button).toBeDefined();
    button.then(bt => bt.click());
    browser.getCurrentUrl().then(url => {
      expect(url.endsWith('create?isSpaceScoped=false')).toBeTruthy();
      // Proceeed to create a service instance
      servicesHelperE2E.createService(serviceName, true);
    });
  });
  afterAll((done) => {
    // Sleeping because the service instance may not be listed in the `get services` request
    browser.sleep(1000);
    servicesHelperE2E.cleanupServiceInstance(servicesHelperE2E.serviceInstanceName).then(() => done());
  });
});

describe('Create Private Service Instance', () => {
  beforeAll((done) => {
    const getCfCnsi = servicesHelperE2E.cfRequestHelper.getCfCnsi();
    getCfCnsi.then(endpointModel => {
      cfGuid = endpointModel.guid;
      return servicesHelperE2E.fetchServices(cfGuid);
    }).then(response => {
      serviceName = e2e.secrets.getDefaultCFEndpoint().services.privateService.name;
      const service = response.resources.find(e => e.entity.label === serviceName);
      serviceGuid = service.metadata.guid;
      marketplaceSummaryPage = new MarketplaceSummaryPage(cfGuid, serviceGuid);
      done();
    });

  });

  beforeEach(() => {
    marketplaceSummaryPage.navigateTo();
    marketplaceSummaryPage.waitForPage();

  });
  it('- should have an Add Service Instance button', () => {
    expect(marketplaceSummaryPage.getAddServiceInstanceButton().isPresent()).toBeTruthy();
  });

  it('- should be able to create a new service instance', () => {
    const button = marketplaceSummaryPage.header.getIconButton('add');
    expect(button).toBeDefined();
    button.then(bt => bt.click());
    browser.getCurrentUrl().then(url => {
      expect(url.endsWith('create?isSpaceScoped=false')).toBeTruthy();
      // Proceeed to create a service instance
      servicesHelperE2E.createService(serviceName, true);
    });
  });
  afterAll((done) => {
    // Sleeping because the service instance may not be listed in the `get services` request
    browser.sleep(1000);
    servicesHelperE2E.cleanupServiceInstance(servicesHelperE2E.serviceInstanceName).then(() => done());
  });
});

  // describe('Create Space Scoped Service Instance', () => {
  //   beforeAll((done) => {
  //     const getCfCnsi = servicesHelperE2E.cfRequestHelper.getCfCnsi();
  //     getCfCnsi.then(endpointModel => {
  //       cfGuid = endpointModel.guid;
  //       return servicesHelperE2E.fetchServices(cfGuid);
  //     }).then(response => {
  //       serviceName = e2e.secrets.getDefaultCFEndpoint().services.spaceScopedService.name;
  //       const service = response.resources.find(e => e.entity.label === serviceName);
  //       serviceGuid = service.metadata.guid;
  //       marketplaceSummaryPage = new MarketplaceSummaryPage(cfGuid, serviceGuid);
  //       done();
  //     });

  //   });

  //   beforeEach(() => {
  //     marketplaceSummaryPage.navigateTo();
  //     marketplaceSummaryPage.waitForPage();

  //   });
  //   it('- should have an Add Service Instance button', () => {
  //     expect(marketplaceSummaryPage.getAddServiceInstanceButton().isPresent()).toBeTruthy();
  //   });

  //   it('- should be able to create a new service instance', () => {
  //     const button = marketplaceSummaryPage.header.getIconButton('add');
  //     expect(button).toBeDefined();
  //     button.then(bt => bt.click());
  //     browser.getCurrentUrl().then(url => {
  //       expect(url.endsWith('create?isSpaceScoped=false')).toBeTruthy();
  //       // Proceeed to create a service instance
  //       servicesHelperE2E.createService(serviceName, true);
  //     });
  //   });
  //   afterAll((done) => {
  //     // Sleeping because the service instance may not be listed in the `get services` request
  //     browser.sleep(1000);
  //     servicesHelperE2E.cleanupServiceInstance(servicesHelperE2E.serviceInstanceName).then(() => done());
  //   });
  // });




})

function init(
  setup: E2ESetup,
  serviceName: string,
) {
  const servicesHelperE2E = new ServicesHelperE2E(setup, new CreateServiceInstance());
  const getCfCnsi = servicesHelperE2E.cfRequestHelper.getCfCnsi();
  let cfGuid;
  return getCfCnsi.then(endpointModel => {
    cfGuid = endpointModel.guid;
    return servicesHelperE2E.fetchServices(cfGuid);
  }).then(response => {
    serviceName = e2e.secrets.getDefaultCFEndpoint().services.publicService.name;
    const service = response.resources.find(e => e.entity.label === serviceName);
    const serviceGuid = service.metadata.guid;
    const marketplaceSummaryPage = new MarketplaceSummaryPage(cfGuid, serviceGuid);
    return { servicesHelperE2E, marketplaceSummaryPage };
  });
}
