import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { ListComponent } from '../po/list.po';
import { MetaCardTitleType } from '../po/meta-card.po';
import { CreateMarketplaceServiceInstance } from './create-marketplace-service-instance.po';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';

// Regression test for:
// - Deleting a service instance in the services list will delete the service but the list incorrectly shows no services
describe('Delete Service Instance', () => {
  const createServiceInstance = new CreateServiceInstance();
  let createMarketplaceServiceInstance: CreateMarketplaceServiceInstance;
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
    return servicesHelperE2E.cleanUpServiceInstances(names);
  });

  beforeAll(() => {
    createServiceInstance.navigateTo();
    createServiceInstance.waitForPage();
    createMarketplaceServiceInstance = createServiceInstance.selectMarketplace();
    servicesHelperE2E = new ServicesHelperE2E(e2eSetup, createMarketplaceServiceInstance);
    createMarketplaceServiceInstance.waitForPage();
  });

  it('should be able to create a service instance', () => {
    expect(createMarketplaceServiceInstance.isActivePage()).toBeTruthy();

    const serviceInstanceName = servicesHelperE2E.createServiceInstanceName();
    names.push(serviceInstanceName);
    servicesHelperE2E.createService(e2e.secrets.getDefaultCFEndpoint().services.publicService.name, serviceInstanceName);
    servicesWall.waitForPage();
    servicesWall.serviceInstancesList.cards.waitForCardByTitle(serviceInstanceName);
  }, timeout);

  it('should be able to create a second service instance', () => {
    createServiceInstance.navigateTo();
    createServiceInstance.waitForPage();
    createServiceInstance.selectMarketplace();
    const serviceInstanceName = servicesHelperE2E.createServiceInstanceName();
    names.push(serviceInstanceName);
    servicesHelperE2E.createService(e2e.secrets.getDefaultCFEndpoint().services.publicService.name, serviceInstanceName);
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
    });
  });
});

