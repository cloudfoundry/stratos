import { ConsoleUserType } from '../helpers/e2e-helpers';
import { e2e } from '../e2e';
import { ElementFinder, promise } from 'protractor';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesWall } from './services-wall.po';
import { MetaCard } from '../po/meta-card.po';
import { ServicesHelperE2E } from './services-helper-e2e';

describe('Create Service Instance', () => {
  const createServiceInstance = new CreateServiceInstance();
  const servicesWall = new ServicesWall();
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

    const serviceName = createServiceInstance.stepper.serviceInstanceName;

    servicesWall.servicesList.cards.getCards().then(
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
    const getCfCnsi = servicesHelperE2E.cfRequestHelper.getCfCnsi();
    let cfGuid: string;
    getCfCnsi.then(endpointModel => {
      cfGuid = endpointModel.guid;
      return servicesHelperE2E.fetchServicesInstances(cfGuid);
    }).then(response => {
      const services = response.resources;
      const serviceInstance = services.filter(service => service.entity.name === createServiceInstance.stepper.serviceInstanceName)[0];
      servicesHelperE2E.deleteServiceInstance(cfGuid, serviceInstance.metadata.guid);
      done();
    });
  });
});


