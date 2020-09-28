import { browser } from 'protractor';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { MetaCard } from '../po/meta-card.po';
import { SideNavMenuItem } from '../po/side-nav.po';
import { CreateMarketplaceServiceInstance } from './create-marketplace-service-instance.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';

describe('Edit Service Instance', () => {
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

  beforeAll(() => {
    servicesHelperE2E = new ServicesHelperE2E(e2eSetup, null, servicesHelperE2E);
    servicesHelperE2E.setCreateServiceInstance(new CreateMarketplaceServiceInstance());
    serviceInstanceName = servicesHelperE2E.createServiceInstanceName();
    serviceNamesToDelete.push(serviceInstanceName);

    servicesHelperE2E.createServiceViaAPI(e2e.secrets.getDefaultCFEndpoint().services.publicService.name, serviceInstanceName);

  }, 30000);

  beforeEach(() => {
    servicesWall.sideNav.goto(SideNavMenuItem.Services);
    servicesWall.waitForPage();
  });

  it('- should be able edit a service instance', () => {
    servicesWall.waitForPage();
    servicesWall.serviceInstancesList.header.refresh();

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
  });

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
