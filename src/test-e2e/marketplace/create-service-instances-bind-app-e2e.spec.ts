import { browser, by, ElementFinder } from 'protractor';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';

describe('Create Service Instance with binding', () => {
  const createServiceInstance = new CreateServiceInstance();
  let createMarketplaceServiceInstance;
  let e2eSetup;
  const servicesWall = new ServicesWallPage();
  let servicesHelperE2E: ServicesHelperE2E;
  let serviceInstanceName: string;

  beforeAll(() => {
    e2eSetup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo();

  });

  beforeAll(() => {
    createServiceInstance.navigateTo();
    createServiceInstance.waitForPage();
    createMarketplaceServiceInstance = createServiceInstance.selectMarketplace();
    servicesHelperE2E = new ServicesHelperE2E(e2eSetup, createMarketplaceServiceInstance, servicesHelperE2E);
    createMarketplaceServiceInstance.waitForPage();
  });

  describe('Long running tests - ', () => {
    extendE2ETestTime(100000);

    it('- should be able to to create a service instance with binding', () => {
      expect(createMarketplaceServiceInstance.isActivePage()).toBeTruthy();

      serviceInstanceName = servicesHelperE2E.createServiceInstanceName();

      const servicesSecrets = e2e.secrets.getDefaultCFEndpoint().services;
      servicesHelperE2E.createService(servicesSecrets.publicService.name, serviceInstanceName, false, servicesSecrets.bindApp);
      servicesWall.waitForPage();

      servicesHelperE2E.getServiceCardWithTitle(servicesWall.serviceInstancesList, serviceInstanceName)
        .then(card => card.getMetaCardItems())
        .then(metaCardRows => {
          expect(metaCardRows[1].value).toBe(servicesSecrets.publicService.name);
          expect(metaCardRows[2].value).toBe('shared');
          expect(metaCardRows[4].value).toBe('1');
        });

    });
  });

  it('- should have correct number in list view', () => {
    servicesWall.navigateTo();
    servicesWall.waitForPage();

    expect(servicesWall.serviceInstancesList.isCardsView()).toBeTruthy();

    // Switch to list view
    servicesWall.serviceInstancesList.header.getCardListViewToggleButton().click();
    expect(servicesWall.serviceInstancesList.isTableView()).toBeTruthy();
    const servicesSecrets = e2e.secrets.getDefaultCFEndpoint().services;

    // Filter for name
    servicesWall.serviceInstancesList.header.setSearchText(serviceInstanceName)
      .then(() => {
        servicesWall.serviceInstancesList.table.getRows().then((rows: ElementFinder[]) => {
          expect(rows.length).toBe(1);

          const attachedApps = rows[0].element(by.css('.mat-column-attachedApps'));

          expect(attachedApps.getText()).toBe(servicesSecrets.bindApp);

          // Navigate to Apps
          attachedApps.element(by.tagName('a')).click();

          browser.getCurrentUrl().then(url => {
            expect(url.endsWith('summary?breadcrumbs=service-wall')).toBeTruthy();
          });
        });
      });
  });

  afterAll(() => servicesHelperE2E.cleanUpServiceInstance(serviceInstanceName));
});
