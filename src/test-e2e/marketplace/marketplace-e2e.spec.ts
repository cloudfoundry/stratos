import { MarketplacePage } from './marketplace.po';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { e2e } from '../e2e';
import { SecretsHelpers } from '../helpers/secrets-helpers';
import { browser } from 'protractor';

describe('Marketplace', () => {
  const marketplacePage = new MarketplacePage();
  const secretsHelper = new SecretsHelpers();
  const serviceSearchText = 'app';

  const navigateToServiceSummary = () => marketplacePage.servicesList.cards.getCards().first().click();

  beforeAll(() => {
    e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin);
  });

  beforeEach(() => {
    marketplacePage.navigateTo();
    marketplacePage.waitForPage();
  });

  it('- should reach marketplace page', () => {
    expect(marketplacePage.isActivePage()).toBeTruthy();
  });

  it('- should have correct title', () => {
    expect(marketplacePage.header.getTitleText()).toEqual('Services Marketplace');
  });

  it('- should have visible services', () => {
    marketplacePage.getServices().then(services => {
      expect(services.length).toBeGreaterThan(0);
    });
  });

  it('- should have filters', () => {
    marketplacePage.servicesList.header.getFilterOptions().then(options => {
      expect(options.length).toBeGreaterThan(0);
    });
    marketplacePage.servicesList.header.getPlaceholderText().then(text => {
      expect(text).toEqual('Cloud Foundry');
    });

  });

  it('- should change filter text when an option is selected', () => {
    marketplacePage.servicesList.header.selectFilterOption(1);
    marketplacePage.servicesList.header.getFilterText().then(text => {
      expect(text).toEqual(secretsHelper.getDefaultCFEndpoint().name);
    });
  });

  it('- should have a search box', () => {
    expect(marketplacePage.servicesList.header.getSearchInputField()).toBeDefined();
  });

  it('- should be able to search', () => {
    marketplacePage.getServices().then(services => {
      const initialCount = services.length;
      marketplacePage.servicesList.header.setSearchText(serviceSearchText).then(
        () => {
          expect(marketplacePage.servicesList.header.getSearchText()).toEqual(serviceSearchText);
          marketplacePage.getServices().then(s => {
            expect(s.length).toBeLessThan(initialCount);
          });
        }
      );
    });
  });

  it('- should have a refresh button', () => {
    expect(marketplacePage.servicesList.header.getRefreshListButton().isPresent()).toBeTruthy();
  });

  it('- should be able to navigate to service summary', () => {
    navigateToServiceSummary();
    browser.getCurrentUrl().then(url => {
      expect(url.endsWith('summary')).toBeTruthy();
    });
  });
});
