import { MarketplaceSummaryPage } from './marketplace-summary.po';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { e2e, E2ESetup } from '../e2e';
import { browser, ElementFinder, promise } from 'protractor';
import { ServicesHelperE2E } from './services-helper-e2e';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesWallPage } from './services-wall.po';
import { MetaCard } from '../po/meta-card.po';

describe('Marketplace', () => {
  let setup: E2ESetup;
  const servicesWall = new ServicesWallPage();
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
    const serviceName =  e2e.secrets.getDefaultCFEndpoint().services.publicService.name;
    beforeAll((done) => {
      init(setup, serviceName).then(res => {
        servicesHelperE2E = res.servicesHelper;
        marketplaceSummaryPage = res.summaryPage;
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

  fit('- should be able to create a new service instance', () => {
    createService(marketplaceSummaryPage, servicesHelperE2E, serviceName, servicesWall);
  });
  afterAll((done) => {
    // Sleeping because the service instance may not be listed in the `get services` request
    browser.sleep(1000);
    servicesHelperE2E.cleanUpServiceInstance(servicesHelperE2E.serviceInstanceName).then(() => done());
  });
});

describe('Create Private Service Instance', () => {
  let servicesHelperE2E: ServicesHelperE2E;
  let marketplaceSummaryPage: MarketplaceSummaryPage;
  const serviceName =  e2e.secrets.getDefaultCFEndpoint().services.privateService.name;
  beforeAll((done) => {
    init(setup, serviceName).then(res => {
      servicesHelperE2E = res.servicesHelper;
      marketplaceSummaryPage = res.summaryPage;
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
    createService(marketplaceSummaryPage, servicesHelperE2E, serviceName, servicesWall);
  });
  afterAll((done) => {
    // Sleeping because the service instance may not be listed in the `get services` request
    browser.sleep(1000);
    servicesHelperE2E.cleanUpServiceInstance(servicesHelperE2E.serviceInstanceName).then(() => done());
  });
});

  describe('Create Space Scoped Service Instance', () => {
    let servicesHelperE2E: ServicesHelperE2E;
    let marketplaceSummaryPage: MarketplaceSummaryPage;
    const serviceName =  e2e.secrets.getDefaultCFEndpoint().services.spaceScopedService.name;
    beforeAll((done) => {
      init(setup, serviceName).then(res => {
        servicesHelperE2E = res.servicesHelper;
        marketplaceSummaryPage = res.summaryPage;
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
      createService(marketplaceSummaryPage, servicesHelperE2E, serviceName, servicesWall);
    });
    afterAll((done) => {
      // Sleeping because the service instance may not be listed in the `get services` request
      browser.sleep(1000);
      servicesHelperE2E.cleanUpServiceInstance(servicesHelperE2E.serviceInstanceName).then(() => done());
    });
  });
});

function createService(marketplaceSummaryPage: MarketplaceSummaryPage,
  servicesHelperE2E: ServicesHelperE2E, serviceName: string, servicesWall: ServicesWallPage) {
  const button = marketplaceSummaryPage.header.getIconButton('add');
  expect(button).toBeDefined();
  button.then(bt => bt.click());
  browser.getCurrentUrl().then(url => {
    expect(url.endsWith('create?isSpaceScoped=false')).toBeTruthy();
    // Proceeed to create a service instance
    console.log("Service NAme: " + serviceName + " is true: " + true)
    servicesHelperE2E.createService(serviceName, true);

    servicesWall.isActivePage();

    const createdServiceInstanceName = servicesHelperE2E.serviceInstanceName;

    servicesWall.serviceInstancesList.cards.getCards().then(
      (cards: ElementFinder[]) => {
        return cards.map(card => {
          const metaCard = new MetaCard(card);
          return metaCard.getTitle();
        });
      }).then(cardTitles => {
        promise.all(cardTitles).then(titles => {
          expect(titles.filter(t => t === createdServiceInstanceName).length).toBe(1);
        });
      }).catch(e => fail(e));
  });
}

function init(
  setup: E2ESetup,
  serviceName: string,
) {
  const servicesHelperE2E = new ServicesHelperE2E(setup, new CreateServiceInstance());
  const defaultCf = e2e.secrets.getDefaultCFEndpoint();
  const endpointGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);
  console.log('#############################' + endpointGuid + '##################')
  return servicesHelperE2E.fetchServices(endpointGuid).then(response => {
    serviceName = e2e.secrets.getDefaultCFEndpoint().services.publicService.name;
    const service = response.resources.find(e => e.entity.label === serviceName);
    const serviceGuid = service.metadata.guid;
    const marketplaceSummaryPage = new MarketplaceSummaryPage(endpointGuid, serviceGuid);
    return { servicesHelper: servicesHelperE2E, summaryPage: marketplaceSummaryPage };
  });
}

