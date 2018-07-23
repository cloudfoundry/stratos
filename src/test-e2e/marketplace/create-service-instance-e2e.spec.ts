import { ConsoleUserType } from '../helpers/e2e-helpers';
import { e2e } from '../e2e';
import { ElementFinder, promise } from 'protractor';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesWallPage } from './services-wall.po';
import { MetaCard } from '../po/meta-card.po';
import { ServicesHelperE2E } from './services-helper-e2e';

describe('Create Service Instance', () => {
  const createServiceInstance = new CreateServiceInstance();
  const servicesWall = new ServicesWallPage();
  let servicesHelperE2E: ServicesHelperE2E;
  beforeAll(() => {
    const e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin);
    servicesHelperE2E = new ServicesHelperE2E(e2eSetup, createServiceInstance);
  });

  beforeEach(() => {
    createServiceInstance.navigateTo();
    createServiceInstance.waitForPage();
  });

  it('- should reach create service instance page', () => {
    expect(createServiceInstance.isActivePage()).toBeTruthy();
  });

  it('- should be able to to create a service instance', () => {

    servicesHelperE2E.createService();

    servicesWall.isActivePage();

    const serviceName = servicesHelperE2E.serviceInstanceName;

    servicesWall.serviceInstancesList.cards.getCards().then(
      (cards: ElementFinder[]) => {
        return cards.map(card => {
          const metaCard = new MetaCard(card);
          return metaCard.getTitle();
        });
      }).then(cardTitles => {
        promise.all(cardTitles).then(titles => {
          expect(titles.filter(t => t === serviceName).length).toBe(1);
        });
      }).catch(e => fail(e));


  });

  it('- should return user to Service summary when cancelled on CFOrgSpace selection', () => {

    // Select CF/Org/Space
    servicesHelperE2E.setCfOrgSpace();
    createServiceInstance.stepper.cancel();

    servicesWall.isActivePage();

  });

  it('- should return user to Service summary when cancelled on Service selection', () => {

    // Select CF/Org/Space
    servicesHelperE2E.setCfOrgSpace();
    createServiceInstance.stepper.next();

    // Select Service
    servicesHelperE2E.setServiceSelection();
    createServiceInstance.stepper.next();

    createServiceInstance.stepper.cancel();

    servicesWall.isActivePage();

  });

  it('- should return user to Service summary when cancelled on App binding selection', () => {

    // Select CF/Org/Space
    servicesHelperE2E.setCfOrgSpace();
    createServiceInstance.stepper.next();

    // Select Service
    servicesHelperE2E.setServiceSelection();
    createServiceInstance.stepper.next();

    // Select Service Plan
    servicesHelperE2E.setServicePlan();
    createServiceInstance.stepper.next();

    createServiceInstance.stepper.cancel();

    servicesWall.isActivePage();

  });

  it('- should return user to Service summary when cancelled on service instance details', () => {

    // Select CF/Org/Space
    servicesHelperE2E.setCfOrgSpace();
    createServiceInstance.stepper.next();

    // Select Service
    servicesHelperE2E.setServiceSelection();
    createServiceInstance.stepper.next();

    // Select Service Plan
    servicesHelperE2E.setServicePlan();
    createServiceInstance.stepper.next();

    // Bind App
    servicesHelperE2E.setBindApp();
    createServiceInstance.stepper.next();

    createServiceInstance.stepper.cancel();

    servicesWall.isActivePage();
  });

  afterAll((done) => {
    servicesHelperE2E.cleanupServiceInstance(servicesHelperE2E.serviceInstanceName).then(() => done());
  });
});


