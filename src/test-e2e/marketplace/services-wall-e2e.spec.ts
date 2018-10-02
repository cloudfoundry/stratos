import { browser, protractor } from 'protractor';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { SecretsHelpers } from '../helpers/secrets-helpers';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';

describe('Service Instances Wall', () => {
  const servicesWallPage = new ServicesWallPage();
  const secretsHelper = new SecretsHelpers();
  let servicesHelperE2E: ServicesHelperE2E;
  beforeAll(() => {
    const e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo();

    // Ensure setup executes before creating the instance, or adding to exec stack
    protractor.promise.controlFlow().execute(() => {
      // Create service instance
      const createServiceInstance = new CreateServiceInstance();
      servicesHelperE2E = new ServicesHelperE2E(e2eSetup, createServiceInstance);
      // FIXME: To save time the service should be created via api call
      createServiceInstance.navigateTo();
      createServiceInstance.waitForPage();
      servicesHelperE2E.createService(e2e.secrets.getDefaultCFEndpoint().services.publicService.name);
    });

  });

  beforeEach(() => {
    servicesWallPage.navigateTo();
    servicesWallPage.waitForPage();
  });

  it('- should reach service instances wall page', () => {
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
    servicesWallPage.serviceInstancesList.header.selectFilterOption(0, 1);
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
    servicesHelperE2E.getServiceCardWithTitle(servicesWallPage.serviceInstancesList, servicesHelperE2E.serviceInstanceName, false)
      .then(metaCard => metaCard.openActionMenu())
      .then(menu => {
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
  });

  it('- should be able to delete Service Instance', () => {
    servicesHelperE2E.getServiceCardWithTitle(servicesWallPage.serviceInstancesList, servicesHelperE2E.serviceInstanceName, false)
      .then(metaCard => metaCard.openActionMenu())
      .then(menu => {
        const deleteMenuItem = menu.getItem('Delete');
        expect(deleteMenuItem.getText()).toEqual('Delete');
        expect(deleteMenuItem.isEnabled()).toBeTruthy();
      });
  });

  afterAll((done) => {
    servicesHelperE2E.cleanUpServiceInstance(servicesHelperE2E.serviceInstanceName).then(() => done());
  });
});
