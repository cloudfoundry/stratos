import { MarketplacePage } from './marketplace.po';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { e2e } from '../e2e';
import { SecretsHelpers } from '../helpers/secrets-helpers';
import { browser } from 'protractor';
import { CreateServiceInstance } from './create-service-instance.po';

fdescribe('Create Service Instance', () => {
  const createServiceInstance = new CreateServiceInstance();

  beforeAll(() => {
    e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin);
  });

  beforeEach(() => {
    createServiceInstance.navigateTo();
    createServiceInstance.waitForPage();
  });

  it('- should reach create service instance page', () => {
    expect(createServiceInstance.isActivePage()).toBeTruthy();
  });

  fit ('- should be able to to create a service instance', () => {

    // Select CF/Org/Space
    expect(createServiceInstance.stepper.canNext()).toBeFalsy();
    createServiceInstance.stepper.setCf(e2e.secrets.getDefaultCFEndpoint().name);
    createServiceInstance.stepper.setOrg(e2e.secrets.getDefaultCFEndpoint().testOrg);
    createServiceInstance.stepper.setSpace(e2e.secrets.getDefaultCFEndpoint().testSpace);
    expect(createServiceInstance.stepper.canNext()).toBeTruthy();
    expect(createServiceInstance.stepper.canCancel()).toBeTruthy();
    createServiceInstance.stepper.next();

    // Select Service
    expect(createServiceInstance.stepper.canPrevious()).toBeTruthy();
    expect(createServiceInstance.stepper.canNext()).toBeFalsy();

    createServiceInstance.stepper.waitForStep('Select Service');
    createServiceInstance.stepper.setService(e2e.secrets.getDefaultCFEndpoint().testService);

    expect(createServiceInstance.stepper.canNext()).toBeTruthy();
    expect(createServiceInstance.stepper.canCancel()).toBeTruthy();
    createServiceInstance.stepper.next();


    createServiceInstance.stepper.waitForStep('Select Plan');
    // Should have a plan auto-selected
    expect(createServiceInstance.stepper.canPrevious()).toBeTruthy();
    expect(createServiceInstance.stepper.canNext()).toBeTruthy();
    expect(createServiceInstance.stepper.canCancel()).toBeTruthy();
    createServiceInstance.stepper.next();

    createServiceInstance.stepper.waitForStep('Bind App (Optional)');
    // Optional step can be skipped
    expect(createServiceInstance.stepper.canPrevious()).toBeTruthy();
    expect(createServiceInstance.stepper.canNext()).toBeTruthy();
    expect(createServiceInstance.stepper.canCancel()).toBeTruthy();
    createServiceInstance.stepper.next();

    createServiceInstance.stepper.waitForStep('Service Instance');
    expect(createServiceInstance.stepper.canPrevious()).toBeTruthy();
    expect(createServiceInstance.stepper.canNext()).toBeFalsy();
    expect(createServiceInstance.stepper.canCancel()).toBeTruthy();
    createServiceInstance.stepper.setServiceName();

    createServiceInstance.stepper.next();

    // // Should be taken to the services wall
    browser.getCurrentUrl().then(url => {
      expect(url.endsWith('services')).toBeTruthy();
    });
  });
});
