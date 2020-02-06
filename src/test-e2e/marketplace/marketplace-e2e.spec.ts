import { browser } from 'protractor';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { SecretsHelpers } from '../helpers/secrets-helpers';
import { SideNavMenuItem } from '../po/side-nav.po';
import { MarketplacePage } from './marketplace.po';

describe('Marketplace', () => {
  const marketplacePage = new MarketplacePage();
  const secretsHelper = new SecretsHelpers();
  const serviceSearchText = 'app';

  const navigateToServiceSummary = () => marketplacePage.servicesList.cards.getCards().first().click();
  // When there's only one CF connected no filter is shown, hence we can't test the filter.
  // Ideally we should test with both one and more than one cf's connected, however for the moment we're just testing without
  const hasCfFilter = false; // e2e.secrets.getCloudFoundryEndpoints().length > 1;, registerMultipleCloudFoundries()

  beforeAll(() => {
    e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin);
  });

  beforeEach(() => {
    marketplacePage.sideNav.goto(SideNavMenuItem.Marketplace);
    marketplacePage.waitForPage();
    marketplacePage.servicesList.header.clearSearchText();
    if (hasCfFilter) {
      marketplacePage.servicesList.header.selectFilterOption(MarketplacePage.FilterIds.cf, 0, false);
    }
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

  if (hasCfFilter) {
    it('- should have filters', () => {
      marketplacePage.servicesList.header.getFilterOptions(MarketplacePage.FilterIds.cf).then(options => {
        expect(options.length).toBeGreaterThan(0);
        // Select the 'All' option to ensure we close the filter dropdown
        options[0].click();
      });
      marketplacePage.servicesList.header.getPlaceHolderText(MarketplacePage.FilterIds.cf).then(text => {
        expect(text).toEqual('Cloud Foundry');
      });
    });

    it('- should change filter text when an option is selected', () => {
      marketplacePage.navigateTo();
      marketplacePage.waitForPage();
      marketplacePage.servicesList.header.selectFilterOption(MarketplacePage.FilterIds.cf, 1);
      marketplacePage.servicesList.table.waitUntilNotBusy();
      marketplacePage.servicesList.header.getFilterText(MarketplacePage.FilterIds.cf).then(text => {
        expect(text).toEqual(secretsHelper.getDefaultCFEndpoint().name);
      });
    });
  }

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
