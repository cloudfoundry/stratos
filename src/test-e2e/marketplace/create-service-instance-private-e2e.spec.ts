import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { CreateServiceInstance } from './create-service-instance.po';
import { ServicesHelperE2E } from './services-helper-e2e';
import { ServicesWallPage } from './services-wall.po';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';

describe('Create Service Instance of Private Service', () => {
  const createServiceInstance = new CreateServiceInstance();
  const servicesWall = new ServicesWallPage();
  let servicesHelperE2E: ServicesHelperE2E;
  beforeAll(() => {
    const e2eSetup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
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

  describe('Long running tests - ', () => {
    const timeout = 100000;
    extendE2ETestTime(timeout);

    it('- should be able to to create a service instance', () => {

      servicesHelperE2E.createService(e2e.secrets.getDefaultCFEndpoint().services.privateService.name, false);

      servicesWall.waitForPage();

      servicesHelperE2E.getServiceCardWithTitle(servicesWall.serviceInstancesList, servicesHelperE2E.serviceInstanceName);

    }, timeout);
  });

  it('- should return user to Service summary when cancelled on CFOrgSpace selection', () => {

    // Select CF/Org/Space
    servicesHelperE2E.setCfOrgSpace();
    createServiceInstance.stepper.cancel();

    servicesWall.waitForPage();

  });

  it('- should return user to Service summary when cancelled on Service selection', () => {

    // Select CF/Org/Space
    servicesHelperE2E.setCfOrgSpace();
    createServiceInstance.stepper.next();

    // Select Service
    servicesHelperE2E.setServiceSelection(e2e.secrets.getDefaultCFEndpoint().services.privateService.name);
    createServiceInstance.stepper.next();

    createServiceInstance.stepper.cancel();

    servicesWall.waitForPage();

  });

  it('- should not show service plan if wrong org/space are selected', () => {

    // Select CF/Org/Space
    servicesHelperE2E.setCfOrgSpace(e2e.secrets.getDefaultCFEndpoint().services.privateService.invalidOrgName,
      e2e.secrets.getDefaultCFEndpoint().services.privateService.invalidSpaceName);
    createServiceInstance.stepper.next();

    // Select Service
    servicesHelperE2E.setServiceSelection(e2e.secrets.getDefaultCFEndpoint().services.privateService.name, true);

  });

  afterAll(() => servicesHelperE2E.cleanUpServiceInstance(servicesHelperE2E.serviceInstanceName));
});
