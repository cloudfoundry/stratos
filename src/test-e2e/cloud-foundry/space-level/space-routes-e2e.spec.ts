import { browser, promise } from 'protractor';

import { ISpace } from '../../../frontend/packages/cloud-foundry/src/cf-api.types';
import { APIResource } from '../../../frontend/packages/store/src/types/api.types';
import { e2e } from '../../e2e';
import { E2EConfigCloudFoundry } from '../../e2e.types';
import { CFHelpers } from '../../helpers/cf-e2e-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { ListComponent } from '../../po/list.po';
import { CfSpaceLevelPage } from './cf-space-level-page.po';

const customRouteLabel = E2EHelpers.e2eItemPrefix + (process.env.CUSTOM_APP_LABEL || process.env.USER) + '-space-route-test';

describe('Space Routes List -', () => {
  let cfHelper: CFHelpers;
  let defaultCf: E2EConfigCloudFoundry;
  let endpointGuid: string;
  let defaultOrgGuid: string;
  let createdSpaceGuid: string;
  const routesList = new ListComponent();

  const timeAllowed = 50000;

  function createRouteHosts(count: number): string[] {
    const routeHosts = [];
    for (let i = 0; i < count; i++) {
      routeHosts.push(CFHelpers.cleanRouteHost(E2EHelpers.createCustomName(customRouteLabel + i)));
    }
    return routeHosts;
  }

  function chainCreateRoute(spaceGuid: string, domainGuid: string, routeHosts: string[]): promise.Promise<any> {
    return routeHosts.reduce((promiseChain, host) => {
      return promiseChain.then(() => {
        // Ensure there's a gap so that the 'created_at' is different
        browser.sleep(1100);
        return cfHelper.addRoute(endpointGuid, spaceGuid, domainGuid, host);
      });
    }, promise.fullyResolved(''));
  }

  function concurrentCreateRoute(spaceGuid: string, domainGuid: string, routeHosts: string[]): promise.Promise<any> {
    return promise.all(routeHosts.map(host => cfHelper.addRoute(endpointGuid, spaceGuid, domainGuid, host)));
  }

  function setup(spaceName: string, routeHosts: string[], orderImportant: boolean) {
    defaultCf = e2e.secrets.getDefaultCFEndpoint();
    endpointGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);
    const defaultOrgGuidP = CFHelpers.cachedDefaultOrgGuid ?
      promise.fullyResolved<string>(CFHelpers.cachedDefaultOrgGuid) : cfHelper.fetchDefaultOrgGuid();
    browser.wait(
      defaultOrgGuidP
        .then(orgGuid => {
          defaultOrgGuid = orgGuid;
          return cfHelper.addSpaceIfMissingForEndpointUsers(
            endpointGuid,
            orgGuid,
            spaceName,
            defaultCf,
            true);
        })
        .catch(error => { throw new Error(`Failed to create space: ${error.toString()}`); })
        .then((space: APIResource<ISpace>) => {
          createdSpaceGuid = space.metadata.guid;
          if (!routeHosts || !routeHosts.length) {
            return promise.fullyResolved(space);
          }

          return cfHelper
            .fetchDomains(endpointGuid)
            .catch(error => { throw new Error(`Failed to fetch domains: ${error.toString()}`); })
            .then(domains => {
              if (!domains || !domains.length) {
                throw Error('At least one domain is required to create test routes');
              }
              const domainGuid = domains[0].metadata.guid;
              // Chain the creation of the routes to ensure there's a nice sequential 'created_at' value to be used for sort tests
              const promises = orderImportant ?
                chainCreateRoute(createdSpaceGuid, domainGuid, routeHosts) :
                concurrentCreateRoute(createdSpaceGuid, domainGuid, routeHosts);

              return promises.then(() => space);
            });
        })
        .then(navToSpaceRoutes)

    );
  }

  function navToSpaceRoutes() {
    const spacePage = CfSpaceLevelPage.forEndpoint(endpointGuid, defaultOrgGuid, createdSpaceGuid);
    spacePage.navigateTo();
    spacePage.waitForPageOrChildPage();
    spacePage.loadingIndicator.waitUntilNotShown();
    spacePage.goToRoutesTab();
    expect(routesList.isCardsView()).toBeFalsy();
  }

  function tearDown(spaceName: string) {
    expect(spaceName).not.toBeNull();
    browser.wait(cfHelper.deleteSpaceIfExisting(endpointGuid, defaultOrgGuid, spaceName));
  }

  beforeAll(() => {
    const e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .loginAs(ConsoleUserType.admin)
      .getInfo();
    cfHelper = new CFHelpers(e2eSetup);
  });

  describe('No Pages -', () => {
    const spaceName = E2EHelpers.createCustomName(customRouteLabel) + '-no-pages';
    beforeAll(() => {
      setup(spaceName, [], false);
    });

    it('Should show no entities message', () => {
      expect(routesList.isDisplayed()).toBeTruthy();
      routesList.empty.getDefault().waitUntilShown();
      expect(routesList.empty.getDefault().getComponent().getText()).toBe('There are no routes');
      expect(routesList.table.getRowCount()).toBe(0);
    });

    afterAll(() => tearDown(spaceName));
  });

  describe('Single Page -', () => {
    const spaceName = E2EHelpers.createCustomName(customRouteLabel) + '-1-page';

    let routeHosts;

    function testSortBy() {

      let expectedOrder: string[];
      routesList.table.getTableData().then(rows => {
        const originalOrder = rows.map(row => row.route);
        expectedOrder = new Array(originalOrder.length);
        for (let i = 0; i < originalOrder.length; i++) {
          expectedOrder[originalOrder.length - i - 1] = originalOrder[i];
        }
      });

      routesList.table.toggleSort('Creation Date');

      routesList.table.getTableData().then(rows => {
        const newOrder = rows.map(row => row.route);
        expect(expectedOrder).toEqual(newOrder);
      });
    }

    beforeAll(() => {
      routeHosts = createRouteHosts(3);
      setup(spaceName, routeHosts, true);
      expect(routesList.getTotalResults()).toBeLessThanOrEqual(5);
      expect(routesList.pagination.isDisplayed()).toBeFalsy();
    }, timeAllowed);

    afterAll(() => tearDown(spaceName), timeAllowed);

    it('sort by creation', () => {
      testSortBy();
    });

    it('single page pagination settings', () => {
      expect(routesList.pagination.isDisplayed()).toBeFalsy();
    });

  });

  describe('Multi Page -', () => {
    const spaceName = E2EHelpers.createCustomName(customRouteLabel) + '-multi-page';

    let routeHosts;
    const initialPageSize = 9;

    beforeAll(() => {
      routeHosts = createRouteHosts(10);
      setup(spaceName, routeHosts, true);
      expect(routesList.getTotalResults()).toBeGreaterThanOrEqual(routeHosts.length);
    }, timeAllowed);

    afterAll(() => tearDown(spaceName), timeAllowed);

    function testStartingPosition() {
      // General expects for all tests in this section
      expect(routesList.getTotalResults()).toBeLessThan(80);
      expect(routesList.pagination.isPresent()).toBeTruthy();

      expect(routesList.table.getRowCount()).toBe(initialPageSize);
      expect(routesList.pagination.getPageSize()).toEqual(initialPageSize.toString());
      expect(routesList.pagination.getTotalResults()).toBeGreaterThan(initialPageSize);
      expect(routesList.pagination.getTotalResults()).toBeLessThanOrEqual(11);

      expect(routesList.pagination.getNavFirstPage().getComponent().isEnabled()).toBeFalsy();
      expect(routesList.pagination.getNavPreviousPage().getComponent().isEnabled()).toBeFalsy();
      expect(routesList.pagination.getNavNextPage().getComponent().isEnabled()).toBeTruthy();
      expect(routesList.pagination.getNavLastPage().getComponent().isEnabled()).toBeTruthy();
    }

    beforeEach(testStartingPosition, timeAllowed);

    afterEach(testStartingPosition, timeAllowed);

    it('Initial Pagination Values', () => { });

    it('Next and Previous Page', () => {
      routesList.pagination.getNavNextPage().getComponent().click();
      // routesList.waitForLoadingIndicator();
      // routesList.waitForNoLoadingIndicator();

      expect(routesList.pagination.getNavFirstPage().getComponent().isEnabled()).toBeTruthy();
      expect(routesList.pagination.getNavPreviousPage().getComponent().isEnabled()).toBeTruthy();
      expect(routesList.pagination.getNavNextPage().getComponent().isEnabled()).toBeFalsy();
      expect(routesList.pagination.getNavLastPage().getComponent().isEnabled()).toBeFalsy();

      routesList.pagination.getNavPreviousPage().getComponent().click();
    });

    it('Last and First Page', () => {
      routesList.pagination.getNavLastPage().getComponent().click();

      expect(routesList.pagination.getNavFirstPage().getComponent().isEnabled()).toBeTruthy();
      expect(routesList.pagination.getNavPreviousPage().getComponent().isEnabled()).toBeTruthy();
      expect(routesList.pagination.getNavNextPage().getComponent().isEnabled()).toBeFalsy();
      expect(routesList.pagination.getNavLastPage().getComponent().isEnabled()).toBeFalsy();

      routesList.pagination.getNavFirstPage().getComponent().click();
    });

    it('Change Page Size', () => {

      routesList.pagination.setPageSize('80');
      expect(routesList.table.getRowCount()).toBeGreaterThan(initialPageSize);

      expect(routesList.pagination.getNavFirstPage().getComponent().isEnabled()).toBeFalsy();
      expect(routesList.pagination.getNavPreviousPage().getComponent().isEnabled()).toBeFalsy();
      expect(routesList.pagination.getNavNextPage().getComponent().isEnabled()).toBeFalsy();
      expect(routesList.pagination.getNavLastPage().getComponent().isEnabled()).toBeFalsy();

      routesList.pagination.setPageSize(initialPageSize.toString());
      expect(routesList.table.getRowCount()).toBe(initialPageSize);

    });

    xit('Refresh animation', () => {
      // Refresh icon animation stops before we can check it's started. Need to simulate slower http requests
      // browser.driver.setNetworkConnection(4); // Fails with `network connection must be enabled`
      browser.waitForAngularEnabled(false);
      routesList.header.getRefreshListButton().click();
      routesList.header.waitForRefreshing();
      routesList.header.waitForNotRefreshing();
      browser.waitForAngularEnabled(true);
    });

  });
});
