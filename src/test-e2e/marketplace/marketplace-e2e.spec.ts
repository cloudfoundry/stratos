import { MarketplacePage } from './marketplace.po';
import { E2EHelpers, ConsoleUserType } from '../helpers/e2e-helpers';
import { browser } from 'protractor';
import { e2e } from '../e2e';

// Dashboard page not implemented
fdescribe('Marketplace', () => {
  const helpers = new E2EHelpers();
  const marketplacePage = new MarketplacePage();

  beforeAll(() => {
    helpers.setupApp(ConsoleUserType.admin);
    e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin);
  });

  beforeEach(() => {
    marketplacePage.navigateTo();
  });

  it('- should reach marketplace page', () => {
    expect(marketplacePage.isMarketplacePage()).toBeTruthy();
  });
});
