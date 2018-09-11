import { browser, ElementFinder, promise } from 'protractor';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { MetaCard, MetaCardTitleType } from '../po/meta-card.po';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';
import { BrowserViewportScroller } from '@angular/common/src/viewport_scroller';

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
    servicesWall.navigateTo();
    servicesWall.waitForPage();
  });

  it('- should be able edit a service instance', () => {
    createServiceInstance.navigateTo();
    createServiceInstance.waitForPage();
    servicesHelperE2E.createService(e2e.secrets.getDefaultCFEndpoint().services.publicService.name);

    servicesWall.waitForPage();

    const serviceName = servicesHelperE2E.serviceInstanceName;
    serviceNamesToDelete.push(serviceName);

    return getCardWithTitle(servicesWall, serviceName)
      .then((card: MetaCard) => card.openActionMenu())
      .then(menu => {
        menu.clickItem('Edit');
        return browser.getCurrentUrl().then(url => {
          expect(url.endsWith('edit')).toBeTruthy();
          servicesHelperE2E.setServicePlan(true);
          servicesHelperE2E.createServiceInstance.stepper.next();

          servicesHelperE2E.addPrefixToServiceName(serviceNamePrefix);
          serviceNamesToDelete.push(servicesHelperE2E.serviceInstanceName);
          servicesHelperE2E.setServiceInstanceDetail(true);
          return servicesHelperE2E.createServiceInstance.stepper.next();
        });
      }).catch(e => fail(e));
  });

  it('- should have edited service instance', () => {
    servicesWall.waitForPage();
    const editedServiceName = servicesHelperE2E.serviceInstanceName;
    return getCardWithTitle(servicesWall, editedServiceName).then((card: MetaCard) => {
      expect(card).toBeDefined();
    }).catch(e => fail(e));
  });

  it('- should be able to delete service instance', () => {
    servicesWall.waitForPage();
    const editedServiceName = servicesHelperE2E.serviceInstanceName;
    return getCardWithTitle(servicesWall, editedServiceName)
      .then((card: MetaCard) => card.openActionMenu())
      .then(menu => {
        menu.clickItem('Delete');
        const deleteDialog = new ConfirmDialogComponent();
        expect(deleteDialog.isDisplayed()).toBeTruthy();
        expect(deleteDialog.getTitle()).toEqual('Delete Service Instance');
        return deleteDialog.confirm();
      }).catch(e => fail(e));
  });

  afterAll(() => {
    return servicesHelperE2E.cleanUpServiceInstances(serviceNamesToDelete);
  });

});

function getCardWithTitle(servicesWall: ServicesWallPage, serviceName: string) {
  servicesWall.serviceInstancesList.header.waitUntilShown();
  servicesWall.serviceInstancesList.header.setSearchText(serviceName);
  return servicesWall.serviceInstancesList.cards.findCardByTitle(serviceName, MetaCardTitleType.MAT_CARD);
}
