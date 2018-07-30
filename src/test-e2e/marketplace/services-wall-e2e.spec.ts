import { MarketplacePage } from './marketplace.po';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { e2e } from '../e2e';
import { SecretsHelpers } from '../helpers/secrets-helpers';
import { browser } from 'protractor';
import { ServicesWallPage } from './services-wall.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { CreateServiceInstance } from './create-service-instance.po';
import { MetaCard } from '../po/meta-card.po';

describe('Service Instances Wall', () => {
  const servicesWallPage = new ServicesWallPage();
  const secretsHelper = new SecretsHelpers();
  let servicesHelperE2E: ServicesHelperE2E;
  beforeAll(() => {
    const e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin);

    // Create service instance
    const createServiceInstance = new CreateServiceInstance();
    servicesHelperE2E = new ServicesHelperE2E(e2eSetup, new CreateServiceInstance());
    createServiceInstance.navigateTo();
    createServiceInstance.waitForPage();
    servicesHelperE2E.createService();
  });

  beforeEach(() => {
    servicesWallPage.navigateTo();
    servicesWallPage.waitForPage();
  });

  it('- should reach service instannces wall page', () => {
    expect(servicesWallPage.isActivePage()).toBeTruthy();
  });

  it('- should have correct title', () => {
    expect(servicesWallPage.header.getTitleText()).toEqual('Services');
  });

  it('- should have visible services', () => {
    servicesWallPage.getServiceInstances().then(services => {
      expect(services.length).toBeGreaterThan(0);
    });
  });

  it('- should have filters', () => {
    servicesWallPage.serviceInstancesList.header.getFilterOptions(0).then(options => {
      expect(options.length).toBeGreaterThan(0);
    });
    // Commenting out tests due to Issue #2720
    // servicesWallPage.serviceInstancesList.header.getPlaceholderText(0).then(text => {
    //   expect(text).toEqual('Cloud Foundry');
    // });

  });

  it('- should change filter text when an option is selected', () => {
    servicesWallPage.serviceInstancesList.header.selectFilterOption(1);
    servicesWallPage.serviceInstancesList.header.getFilterText().then(text => {
      expect(text).toEqual(secretsHelper.getDefaultCFEndpoint().name);
    });
  });

  it('- should have a search box', () => {
    expect(servicesWallPage.serviceInstancesList.header.getSearchInputField()).toBeDefined();
  });

  it('- should be able to search', () => {

    servicesWallPage.serviceInstancesList.header.setSearchText(servicesHelperE2E.serviceInstanceName).then(
      () => {
        expect(servicesWallPage.serviceInstancesList.header.getSearchText()).toEqual(servicesHelperE2E.serviceInstanceName);
        servicesWallPage.getServiceInstances().then(s => {
          expect(s.length).toEqual(1);
        });
      }
    );
  });

  it('- should have a refresh button', () => {
    expect(servicesWallPage.serviceInstancesList.header.getRefreshListButton().isPresent()).toBeTruthy();
  });

  it('- should be able to refresh list', () => {
    servicesWallPage.serviceInstancesList.header.getRefreshListButton().click();
    expect(servicesWallPage.serviceInstancesList.header.getRefreshListButton().isPresent()).toBeTruthy();
  });

  it('- should be a card view', () => {
    expect(servicesWallPage.serviceInstancesList.cards.isPresent()).toBeTruthy();
  });

  it('- should be able to Edit Service Instance', () => {
    servicesWallPage.serviceInstancesList.cards.getCards().then(
      cards => {
        const metaCard = new MetaCard(cards[0]);
        const actionMenu = metaCard.openActionMenu();
        actionMenu.then(menu => {
          const editMenuItem = menu.getItem('Edit');
          expect(editMenuItem.getText()).toEqual('Edit');
          expect(editMenuItem.isEnabled()).toBeTruthy();
          editMenuItem.click();
          browser.getCurrentUrl().then(url => {
            expect(url.endsWith('edit')).toBeTruthy();
          });
          const createServiceInstance = new CreateServiceInstance();
          createServiceInstance.stepper.cancel();
          servicesWallPage.isActivePage();
        });
      }
    );
  });

  it('- should be able to  delete Service Instance', () => {
    servicesWallPage.serviceInstancesList.cards.getCards().then(
      cards => {
        const metaCard = new MetaCard(cards[0]);
        const actionMenu = metaCard.openActionMenu();
        actionMenu.then(menu => {
          const deleteMenuItem = menu.getItem('Delete');
          expect(deleteMenuItem.getText()).toEqual('Delete');
          expect(deleteMenuItem.isEnabled()).toBeTruthy();
        });
      }
    );
  });

  afterAll((done) => {
    servicesHelperE2E.cleanupServiceInstance(servicesHelperE2E.serviceInstanceName).then(() => done());
  });
});
