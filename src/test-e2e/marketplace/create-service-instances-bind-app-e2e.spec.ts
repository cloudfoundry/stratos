import { ElementFinder, promise, by, browser } from 'protractor';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { MetaCard, MetaCardTitleType } from '../po/meta-card.po';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';

describe('Create Service Instance with binding', () => {
  const createServiceInstance = new CreateServiceInstance();
  const servicesWall = new ServicesWallPage();
  let servicesHelperE2E: ServicesHelperE2E;
  let cardIdx = -1;
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
    createServiceInstance.navigateTo();
    createServiceInstance.waitForPage();
  });

  it('- should reach create service instance page', () => {
    expect(createServiceInstance.isActivePage()).toBeTruthy();
  });

  it('- should be able to to create a service instance with binding', () => {

    const servicesSecrets = e2e.secrets.getDefaultCFEndpoint().services;
    servicesHelperE2E.createService(servicesSecrets.publicService.name, false, servicesSecrets.bindApp);
    servicesWall.waitForPage();

    const serviceName = servicesHelperE2E.serviceInstanceName;

    servicesWall.serviceInstancesList.cards.getCards().then(
      (cards: ElementFinder[]) => {
        return cards.map(card => {
          const metaCard = new MetaCard(card, MetaCardTitleType.CUSTOM);
          return metaCard.getTitle();
        });
      }).then(cardTitles => {
        promise.all(cardTitles).then(titles => {
          expect(titles.filter((t, idx) => {
            const isCorrectCard = (t === serviceName);
            if (isCorrectCard) {
              cardIdx = idx;

              const card = servicesWall.serviceInstancesList.cards.getCard(cardIdx);
              card.getMetaCardItems().then(metaCardRows => {
                expect(metaCardRows[1].value).toBe(servicesSecrets.publicService.name);
                expect(metaCardRows[2].value).toBe('shared');
                expect(metaCardRows[3].value).toBe('1');
              }).catch(e => fail(e));
            }
            return isCorrectCard;
          }).length).toBe(1);
        });
      }).catch(e => fail(e));


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
    servicesWall.serviceInstancesList.header.setSearchText(servicesHelperE2E.serviceInstanceName)
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

  afterAll((done) => {
    servicesHelperE2E.cleanUpServiceInstance(servicesHelperE2E.serviceInstanceName).then(() => done());
  });
});


