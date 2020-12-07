import { promise } from 'protractor';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { ListComponent } from '../po/list.po';
import { MetaCardTitleType } from '../po/meta-card.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';

// Regression test for:
// - Deleting a service instance in the services list will delete the service but the list incorrectly shows no services
describe('Delete Service Instance', () => {
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
    servicesHelperE2E = new ServicesHelperE2E(e2eSetup, null);

    const serviceInstanceName1 = servicesHelperE2E.createServiceInstanceName();
    names.push(serviceInstanceName1);
    const serviceInstanceName2 = servicesHelperE2E.createServiceInstanceName();
    names.push(serviceInstanceName2);

    return promise.all([
      servicesHelperE2E.createServiceViaAPI(e2e.secrets.getDefaultCFEndpoint().services.publicService.name, serviceInstanceName1),
      servicesHelperE2E.createServiceViaAPI(e2e.secrets.getDefaultCFEndpoint().services.publicService.name, serviceInstanceName2)
    ])
      .then(() => {
        servicesWall.navigateTo();
        servicesWall.serviceInstancesList.header.clearFilters();
        servicesWall.serviceInstancesList.header.refresh();
        servicesWall.serviceInstancesList.cards.waitForCardByTitle(serviceInstanceName1);
        return servicesWall.serviceInstancesList.cards.waitForCardByTitle(serviceInstanceName2);
      });
  }, timeout);

  it('should be able to delete the service instance', () => {
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

