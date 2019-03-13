import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';
import { CreateMarketplaceServiceInstance } from './create-marketplace-service-instance.po';

describe('Create Service Instance', () => {
  const createServiceInstance = new CreateServiceInstance();
  let createMarketplaceServiceInstance: CreateMarketplaceServiceInstance;
  let e2eSetup;
  const servicesWall = new ServicesWallPage();
  let servicesHelperE2E: ServicesHelperE2E;
  beforeAll(() => {
    e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()

      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo();

  });

  beforeEach(() => {
    createServiceInstance.navigateTo();
    createServiceInstance.waitForPage();
    createMarketplaceServiceInstance = createServiceInstance.selectMarketplace();
    servicesHelperE2E = new ServicesHelperE2E(e2eSetup, createMarketplaceServiceInstance);
  });

  it('- should reach create service instance page', () => {
    expect(createMarketplaceServiceInstance.isActivePage()).toBeTruthy();
  });
  describe('Long running tests - ', () => {
    const timeout = 100000;
    extendE2ETestTime(timeout);

    it('- should be able to to create a service instance', () => {

      servicesHelperE2E.createService(e2e.secrets.getDefaultCFEndpoint().services.publicService.name);
      servicesWall.waitForPage();

      servicesWall.serviceInstancesList.cards.waitForCardByTitle(servicesHelperE2E.serviceInstanceName);
    }, timeout);

  });

  it('- should return user to Service summary when cancelled on CFOrgSpace selection', () => {

    // Select CF/Org/Space
    servicesHelperE2E.setCfOrgSpace();
    createMarketplaceServiceInstance.stepper.cancel();

    servicesWall.waitForPage();

  });

  it('- should return user to Service summary when cancelled on Service selection', () => {

    // Select CF/Org/Space
    servicesHelperE2E.setCfOrgSpace();
    createMarketplaceServiceInstance.stepper.next();

    // Select Service
    servicesHelperE2E.setServiceSelection(e2e.secrets.getDefaultCFEndpoint().services.publicService.name);
    createMarketplaceServiceInstance.stepper.next();

    createMarketplaceServiceInstance.stepper.cancel();

    servicesWall.waitForPage();

  });

  it('- should return user to Service summary when cancelled on App binding selection', () => {

    // Select CF/Org/Space
    servicesHelperE2E.setCfOrgSpace();
    createMarketplaceServiceInstance.stepper.next();

    // Select Service
    servicesHelperE2E.setServiceSelection(e2e.secrets.getDefaultCFEndpoint().services.publicService.name);
    createMarketplaceServiceInstance.stepper.next();

    // Select Service Plan
    servicesHelperE2E.setServicePlan();
    createMarketplaceServiceInstance.stepper.next();

    createMarketplaceServiceInstance.stepper.cancel();

    servicesWall.waitForPage();

  });

  it('- should return user to Service summary when cancelled on service instance details', () => {
    // Select CF/Org/Space
    servicesHelperE2E.setCfOrgSpace();
    createMarketplaceServiceInstance.stepper.next();

    // Select Service
    servicesHelperE2E.setServiceSelection(e2e.secrets.getDefaultCFEndpoint().services.publicService.name);
    createMarketplaceServiceInstance.stepper.next();

    // Select Service Plan
    servicesHelperE2E.setServicePlan();
    createMarketplaceServiceInstance.stepper.next();

    createMarketplaceServiceInstance.stepper.isBindAppStepDisabled().then(bindAppDisabled => {
      if (!bindAppDisabled) {
        // Bind App
        servicesHelperE2E.setBindApp();
        createMarketplaceServiceInstance.stepper.next();
      }

      createMarketplaceServiceInstance.stepper.cancel();

      servicesWall.waitForPage();
    });
  });

  afterAll(() => servicesHelperE2E.cleanUpServiceInstance(servicesHelperE2E.serviceInstanceName));
});


