import { browser } from 'protractor';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { SecretsHelpers } from '../helpers/secrets-helpers';
import { SideNavMenuItem } from '../po/side-nav.po';
import { CreateMarketplaceServiceInstance } from './create-marketplace-service-instance.po';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';

describe('Service Instances Wall', () => {
  const servicesWallPage = new ServicesWallPage();
  const secretsHelper = new SecretsHelpers();

  // When there's only one CF connected no filter is shown, hence we can't test the filter.
  // Ideally we should test with both one and more than one cf's connected, however for the moment we're just testing without
  const hasCfFilter = false; // e2e.secrets.getCloudFoundryEndpoints().length > 1;, registerMultipleCloudFoundries()

  const createServiceInstance = new CreateServiceInstance();
  let e2eSetup;
  let servicesHelperE2E: ServicesHelperE2E;
  let serviceInstanceName: string;

  beforeAll(() => {
    e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo();
  });

  beforeEach(() => {
    servicesWallPage.sideNav.goto(SideNavMenuItem.Services);
    servicesWallPage.waitForPage();
    servicesHelperE2E = new ServicesHelperE2E(e2eSetup, new CreateMarketplaceServiceInstance(), servicesHelperE2E);
  });

  describe('', () => {
    const timeout = 60000;
    extendE2ETestTime(timeout);

    it('- should create service instance all tests depend on', () => {
      // FIXME: To save time the service should be created via api call
      createServiceInstance.navigateTo();
      createServiceInstance.waitForPage();
      createServiceInstance.selectMarketplace();
      serviceInstanceName = servicesHelperE2E.createServiceInstanceName();
      servicesHelperE2E.createService(e2e.secrets.getDefaultCFEndpoint().services.publicService.name, serviceInstanceName);
    });
  });

  it('- should reach service instances wall page', () => {
    servicesWallPage.sideNav.goto(SideNavMenuItem.Services);
    servicesWallPage.waitForPage();
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

  if (hasCfFilter) {
    it('- should have filters', () => {
      servicesWallPage.serviceInstancesList.header.getFilterOptions(ServicesWallPage.FilterIds.cf).then(options => {
        expect(options.length).toBeGreaterThan(0);
        // Select the 'All' option to ensure we close the filter dropdown
        options[0].click();
      });
      // Commenting out tests due to Issue #2720
      // servicesWallPage.serviceInstancesList.header.getPlaceholderText(0).then(text => {
      //   expect(text).toEqual('Cloud Foundry');
      // });

    });

    it('- should change filter text when an option is selected', () => {
      servicesWallPage.navigateTo();
      servicesWallPage.waitForPage();
      servicesWallPage.serviceInstancesList.header.selectFilterOption(ServicesWallPage.FilterIds.cf, 1);
      servicesWallPage.serviceInstancesList.header.getFilterText(ServicesWallPage.FilterIds.cf).then(text => {
        expect(text).toEqual(secretsHelper.getDefaultCFEndpoint().name);
      });
    });
  }


  it('- should have a search box', () => {
    expect(servicesWallPage.serviceInstancesList.header.getSearchInputField()).toBeDefined();
  });

  it('- should be able to search', () => {
    servicesWallPage.serviceInstancesList.header.setSearchText(serviceInstanceName).then(
      () => {
        expect(servicesWallPage.serviceInstancesList.header.getSearchText()).toEqual(serviceInstanceName);
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
    servicesHelperE2E.getServiceCardWithTitle(servicesWallPage.serviceInstancesList, serviceInstanceName, false)
      .then(metaCard => metaCard.openActionMenu())
      .then(menu => {
        const editMenuItem = menu.getItem('Edit');
        expect(editMenuItem.getText()).toEqual('Edit');
        expect(editMenuItem.isEnabled()).toBeTruthy();
        editMenuItem.click();

        browser.getCurrentUrl().then(url => {
          const query = url.indexOf('?');
          const urlWithoutQuery = query >= 0 ? url.substring(0, query) : url;
          expect(urlWithoutQuery.endsWith('edit')).toBeTruthy();
        });
        const createMarketplaceServiceInstance = new CreateMarketplaceServiceInstance();
        createMarketplaceServiceInstance.stepper.cancel();
        servicesWallPage.isActivePage();
      });
  });

  it('- should be able to delete Service Instance', () => {
    servicesHelperE2E.getServiceCardWithTitle(servicesWallPage.serviceInstancesList, serviceInstanceName, false)
      .then(metaCard => metaCard.openActionMenu())
      .then(menu => {
        const deleteMenuItem = menu.getItem('Delete');
        expect(deleteMenuItem.getText()).toEqual('Delete');
        expect(deleteMenuItem.isEnabled()).toBeTruthy();
      });
  });

  afterAll(() => servicesHelperE2E.cleanUpServiceInstance(serviceInstanceName));
});
