import { browser } from 'protractor';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { MetaCard } from '../po/meta-card.po';
import { SideNavMenuItem } from '../po/side-nav.po';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';

describe('Edit Service Instance', () => {
  const createServiceInstance = new CreateServiceInstance();
  let createMarketplaceServiceInstance;
  let e2eSetup;
  let servicesHelperE2E: ServicesHelperE2E;
  const servicesWall = new ServicesWallPage();
  const serviceNamePrefix = 'e';
  let serviceNamesToDelete = [];
  let serviceInstanceName: string;
  let editedServiceInstanceName: string;


  beforeAll(() => {
    e2eSetup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo();
  });

  beforeEach(() => {
    createServiceInstance.navigateTo();
    createServiceInstance.waitForPage();
    createMarketplaceServiceInstance = createServiceInstance.selectMarketplace();
    servicesHelperE2E = new ServicesHelperE2E(e2eSetup, createMarketplaceServiceInstance, servicesHelperE2E);
  });

  const timeout = 100000;
  extendE2ETestTime(timeout);

  beforeEach(() => {
    servicesWall.sideNav.goto(SideNavMenuItem.Services);
    servicesWall.waitForPage();
  });

  it('- should be able edit a service instance', () => {
    servicesWall.clickCreateServiceInstance();
    createServiceInstance.waitForPage();
    createServiceInstance.selectMarketplace();
    serviceInstanceName = servicesHelperE2E.createServiceInstanceName();

    servicesHelperE2E.createService(e2e.secrets.getDefaultCFEndpoint().services.publicService.name, serviceInstanceName);

    servicesWall.waitForPage();

    serviceNamesToDelete.push(serviceInstanceName);

    return getCardWithTitle(serviceInstanceName)
      .then((card: MetaCard) => card.openActionMenu())
      .then(menu => {
        menu.clickItem('Edit');
        menu.waitUntilNotShown();

        return browser.getCurrentUrl().then(url => {
          const query = url.indexOf('?');
          const urlWithoutQuery = query >= 0 ? url.substring(0, query) : url;
          expect(urlWithoutQuery.endsWith('edit')).toBeTruthy();

          servicesHelperE2E.setServicePlan(true);
          servicesHelperE2E.createServiceInstance.stepper.next();

          editedServiceInstanceName = servicesHelperE2E.addPrefixToServiceName(serviceNamePrefix, serviceInstanceName);
          serviceNamesToDelete.push(editedServiceInstanceName);
          servicesHelperE2E.setServiceInstanceDetail(editedServiceInstanceName, true);
          servicesHelperE2E.createServiceInstance.stepper.next();
          servicesHelperE2E.createServiceInstance.stepper.waitUntilNotShown();
        });
      }).catch(e => fail(e));
  }, timeout);

  it('- should have edited service instance', () => {
    servicesWall.waitForPage();
    return getCardWithTitle(editedServiceInstanceName).then((card: MetaCard) => {
      expect(card).toBeDefined();
    }).catch(e => fail(e));
  });

  it('- should be able to delete service instance', () => {
    servicesWall.waitForPage();
    return getCardWithTitle(editedServiceInstanceName)
      .then((card: MetaCard) => card.openActionMenu())
      .then(menu => {
        menu.clickItem('Delete');
        return ConfirmDialogComponent.expectDialogAndConfirm('Delete', 'Delete Service Instance', editedServiceInstanceName);
      })
      .then(() => servicesHelperE2E.noServiceCardWithTitleAttempt(servicesWall.serviceInstancesList, editedServiceInstanceName, 1, 5))
      .then(totalResults => {
        if (totalResults === 0) {
          serviceNamesToDelete = serviceNamesToDelete.slice(serviceNamesToDelete.indexOf(editedServiceInstanceName), 1);
        }
      })
      .catch(e => fail(e));
  });

  afterAll(() => {
    return servicesHelperE2E.cleanUpServiceInstances(serviceNamesToDelete);
  });

  function getCardWithTitle(serviceName: string) {
    return servicesHelperE2E.getServiceCardWithTitle(servicesWall.serviceInstancesList, serviceName);
  }

});
