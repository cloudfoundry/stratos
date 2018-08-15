import { browser, ElementFinder, promise } from 'protractor';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { MetaCard } from '../po/meta-card.po';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';

fdescribe('Edit Service Instance', () => {
  const createServiceInstance = new CreateServiceInstance();
  const servicesWall = new ServicesWallPage();
  let servicesHelperE2E: ServicesHelperE2E;
  beforeAll(() => {
    const e2eSetup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
      .getInfo();
    servicesHelperE2E = new ServicesHelperE2E(e2eSetup, createServiceInstance);
  });

  beforeEach(() => {
    createServiceInstance.navigateTo();
    createServiceInstance.waitForPage();
  });

  it('- should be able edit a service instance', () => {

    servicesHelperE2E.createService(e2e.secrets.getDefaultCFEndpoint().services.publicService.name);

    servicesWall.isActivePage();

    const serviceName = servicesHelperE2E.serviceInstanceName;

    servicesWall.serviceInstancesList.cards.getCards().then(
      (cards: ElementFinder[]) => {
        return cards.map(card => {
            const metaCard = new MetaCard(card);
            return metaCard.getTitle();
        });
      }).then(cardTitles => {
        return promise.all(cardTitles).then(titles => {

            for (let i = 0; i < titles.length; i++) {
                if (titles[i] === serviceName) {
                    return  servicesWall.serviceInstancesList.cards.getCard(i);
                }
            }
        });
      }).then( (card: MetaCard) => {
       card.openActionMenu().then(menu => {
           menu.clickItem('Edit');
           browser.getCurrentUrl().then(url => {
            expect(url.endsWith('edit')).toBeTruthy();
          });
       });
      }).catch(e => fail(e));


  });



  afterAll((done) => {
    servicesHelperE2E.cleanUpServiceInstance(servicesHelperE2E.serviceInstanceName).then(() => done());
  });
});


