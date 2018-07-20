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

});
