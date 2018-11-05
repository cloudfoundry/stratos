import { browser } from 'protractor';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { MetaCard } from '../po/meta-card.po';
import { SideNavMenuItem } from '../po/side-nav.po';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';

describe('Edit Service Instance', () => {
  const createServiceInstance = new CreateServiceInstance();
  const servicesWall = new ServicesWallPage();
  let servicesHelperE2E: ServicesHelperE2E;
  const serviceNamePrefix = 'e';
  const serviceNamesToDelete = [];
  beforeAll(() => {
    const e2eSetup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo();
    servicesHelperE2E = new ServicesHelperE2E(e2eSetup, createServiceInstance);
  });

  beforeEach(() => {
    servicesWall.sideNav.goto(SideNavMenuItem.Services);
    servicesWall.waitForPage();
  });

  it('- should be able edit a service instance', () => {
    servicesWall.clickCreateServiceInstance();
    createServiceInstance.waitForPage();
    servicesHelperE2E.createService(e2e.secrets.getDefaultCFEndpoint().services.publicService.name);

    servicesWall.waitForPage();

    const serviceName = servicesHelperE2E.serviceInstanceName;
    serviceNamesToDelete.push(serviceName);

    return getCardWithTitle(serviceName)
      .then((card: MetaCard) => card.openActionMenu())
      .then(menu => {
        menu.clickItem('Edit');
        menu.waitUntilNotShown();

        return browser.getCurrentUrl().then(url => {
          expect(url.endsWith('edit')).toBeTruthy();
          servicesHelperE2E.setServicePlan(true);
          servicesHelperE2E.createServiceInstance.stepper.next();

          servicesHelperE2E.addPrefixToServiceName(serviceNamePrefix);
          serviceNamesToDelete.push(servicesHelperE2E.serviceInstanceName);
          servicesHelperE2E.setServiceInstanceDetail(true);
          servicesHelperE2E.createServiceInstance.stepper.next();
          servicesHelperE2E.createServiceInstance.stepper.waitUntilNotShown();
        });
      }).catch(e => fail(e));
  });

  it('- should have edited service instance', () => {
    servicesWall.waitForPage();
    const editedServiceName = servicesHelperE2E.serviceInstanceName;
    return getCardWithTitle(editedServiceName).then((card: MetaCard) => {
      expect(card).toBeDefined();
    }).catch(e => fail(e));
  });

  it('- should be able to delete service instance', () => {
    servicesWall.waitForPage();
    const editedServiceName = servicesHelperE2E.serviceInstanceName;
    return getCardWithTitle(editedServiceName)
      .then((card: MetaCard) => card.openActionMenu())
      .then(menu => {
        menu.clickItem('Delete');
        ConfirmDialogComponent.expectDialogAndConfirm('Delete', 'Delete Service Instance', editedServiceName);
      }).catch(e => fail(e));
  });

  afterAll(() => {
    return servicesHelperE2E.cleanUpServiceInstances(serviceNamesToDelete);
  });

  function getCardWithTitle(serviceName: string) {
    return servicesHelperE2E.getServiceCardWithTitle(servicesWall.serviceInstancesList, serviceName);
  }

});
