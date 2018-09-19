import { browser, element, by } from 'protractor';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { MetaCard, MetaCardTitleType } from '../po/meta-card.po';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';
import { Component } from '../po/component.po';
import { SideNavMenuItem } from '../po/side-nav.po';

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

  fit('- should be able edit a service instance', () => {
    servicesWall.clickCreateServiceInstance();
    createServiceInstance.waitForPage();
    servicesHelperE2E.createService(e2e.secrets.getDefaultCFEndpoint().services.publicService.name);

    servicesWall.waitForPage();

    const serviceName = servicesHelperE2E.serviceInstanceName;
    serviceNamesToDelete.push(serviceName);

    return getCardWithTitle(servicesWall, serviceName)
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
    // Wait for card
    const siCard =  new Component(element(by.css('.list-component__body mat-card')));
    siCard.waitUntilShown('Service Instance Card');
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
        deleteDialog.confirm();
        deleteDialog.waitUntilNotShown();
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
