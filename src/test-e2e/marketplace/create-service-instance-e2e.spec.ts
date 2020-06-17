import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { CreateMarketplaceServiceInstance } from './create-marketplace-service-instance.po';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';

describe('Create Service Instance', () => {
  const createServiceInstance = new CreateServiceInstance();
  let createMarketplaceServiceInstance: CreateMarketplaceServiceInstance;
  let e2eSetup;
  const servicesWall = new ServicesWallPage();
  let servicesHelperE2E: ServicesHelperE2E;
  let serviceInstanceName: string;

  beforeAll(() => {
    e2eSetup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo();

  });

  beforeEach(() => {
    createServiceInstance.navigateTo();
    createServiceInstance.waitForPage();
    createMarketplaceServiceInstance = createServiceInstance.selectMarketplace();
    servicesHelperE2E = new ServicesHelperE2E(e2eSetup, createMarketplaceServiceInstance);
    createMarketplaceServiceInstance.waitForPage();
  });

  describe('Long running tests - ', () => {
    const timeout = 100000;
    extendE2ETestTime(timeout);

    it('- should be able to create a service instance', () => {
      expect(createMarketplaceServiceInstance.isActivePage()).toBeTruthy();

      serviceInstanceName = servicesHelperE2E.createServiceInstanceName();

      servicesHelperE2E.createService(e2e.secrets.getDefaultCFEndpoint().services.publicService.name, serviceInstanceName);
      servicesWall.waitForPage();

      servicesWall.serviceInstancesList.cards.waitForCardByTitle(serviceInstanceName);
    }, timeout);

  });

  it('- should return user to Service summary when cancelled on CFOrgSpace selection', () => {
    expect(createMarketplaceServiceInstance.isActivePage()).toBeTruthy();

    // Select CF/Org/Space
    servicesHelperE2E.setCfOrgSpace();
    createMarketplaceServiceInstance.stepper.cancel();

    servicesWall.waitForPage();
  });

  it('- should return user to Service summary when cancelled on Service selection', () => {
    expect(createMarketplaceServiceInstance.isActivePage()).toBeTruthy();

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
    expect(createMarketplaceServiceInstance.isActivePage()).toBeTruthy();

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
    expect(createMarketplaceServiceInstance.isActivePage()).toBeTruthy();

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

  afterAll(() => servicesHelperE2E.cleanUpServiceInstance(serviceInstanceName));
});


