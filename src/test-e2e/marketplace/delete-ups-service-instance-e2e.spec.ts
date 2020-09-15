import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { ListComponent } from '../po/list.po';
import { MetaCardTitleType } from '../po/meta-card.po';
import { CreateServiceInstance } from './create-service-instance.po';
import { CreateUserProvidedServiceInstance } from './create-ups-service-instance.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';

describe('Delete Service Instance (User Provided Service)', () => {
  const createServiceInstance = new CreateServiceInstance();
  let createUserProvidedServiceInstance: CreateUserProvidedServiceInstance;
  let e2eSetup;
  const servicesWall = new ServicesWallPage();
  let servicesHelperE2E: ServicesHelperE2E;
  const names = [] as string[];

  const timeout = 100000;
  extendE2ETestTime(timeout);

  beforeAll(() => {
    e2eSetup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo();
  });

  afterAll(() => {
    return servicesHelperE2E.cleanUpServiceInstances(names, true);
  });

  beforeAll(() => {
    createServiceInstance.navigateTo();
    createServiceInstance.waitForPage();
    createUserProvidedServiceInstance = createServiceInstance.selectUserProvidedService();
    servicesHelperE2E = new ServicesHelperE2E(e2eSetup, createUserProvidedServiceInstance);
  });

  it('should go to create service instance view', () => {
    expect(createUserProvidedServiceInstance.isActivePage()).toBeTruthy();
  });

  it('should be able to create a service instance', () => {
    const serviceInstanceName = servicesHelperE2E.createServiceInstanceName();
    names.push(serviceInstanceName);
    servicesHelperE2E.createUserProvidedService(e2e.secrets.getDefaultCFEndpoint().services.publicService.name, serviceInstanceName);
    servicesWall.waitForPage();
    servicesWall.serviceInstancesList.cards.waitForCardByTitle(serviceInstanceName);
  }, timeout);

  it('should be able to create a second service instance', () => {
    createServiceInstance.navigateTo();
    createServiceInstance.waitForPage();
    createServiceInstance.selectUserProvidedService();
    const serviceInstanceName = servicesHelperE2E.createServiceInstanceName();
    names.push(serviceInstanceName);
    servicesHelperE2E.createUserProvidedService(e2e.secrets.getDefaultCFEndpoint().services.publicService.name, serviceInstanceName);
    servicesWall.waitForPage();
    servicesWall.serviceInstancesList.cards.waitForCardByTitle(serviceInstanceName);
  }, timeout);


  it('should be able to detete the service instance', () => {
    const cardView = new ListComponent();
    cardView.cards.waitUntilShown();
    cardView.cards.findCardByTitle(names[0], MetaCardTitleType.CUSTOM, true).then(card => {
      card.openActionMenu().then(menu => {
        menu.clickItem('Delete');
        ConfirmDialogComponent.expectDialogAndConfirm('Delete', 'Delete Service Instance', names[0]);
        card.waitUntilNotShown();
      });
    });
  });

  it('should still show the other service instance', () => {
    // We should still see the other service instance that was created
    const cardView = new ListComponent();
    cardView.cards.waitUntilShown();
    cardView.cards.findCardByTitle(names[1], MetaCardTitleType.CUSTOM, true).then(card => {
      expect(card).toBeDefined();
      expect(card.getTitle()).toEqual(names[1]);
      // Delete the second service instance now
      card.openActionMenu().then(menu => {
        menu.clickItem('Delete');
        ConfirmDialogComponent.expectDialogAndConfirm('Delete', 'Delete Service Instance', names[1]);
        card.waitUntilNotShown();
      });
    });
  });
});

