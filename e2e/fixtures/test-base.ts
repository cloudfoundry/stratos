import { test as base, Page, BrowserContext } from '@playwright/test';
import { SecretsHelper } from '../helpers/secrets-helpers';
import { EndpointManagementHelper } from '../helpers/endpoint-management.helper';
import { ConsoleUserType, RequestHelper } from '../helpers/request.helper';
import { CFApiHelper } from '../helpers/cf-api.helper';
import { ApplicationTestHelper, TestApp } from '../helpers/application-test.helper';
import { detectAuthType, browserLogin, apiLogin, AuthType } from '../helpers/auth.helper';
import { ADMIN_STATE, USER_STATE } from '../auth.constants';

/**
 * Test Fixtures
 *
 * Worker-scoped sessions: each Playwright worker authenticates independently
 * via API login, giving it its own backend session. This avoids session
 * contention when multiple workers share a single session cookie.
 *
 * Configure worker count: E2E_WORKERS=N (default: half CPU cores)
 */

type WorkerFixtures = {
  workerAdminContext: BrowserContext;
  workerUserContext: BrowserContext;
};

/**
 * Race a promise against an explicit deadline so a stuck network call
 * throws a named error instead of hanging the worker until the test
 * timeout fires and teardown then waits out TCP-level timeouts on top
 * of that (measured hang: 32.5 minutes for a single stuck fixture GET).
 */
function withDeadline<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`E2E_DEADLINE_EXCEEDED: ${label} did not complete within ${ms}ms`)), ms)
    )
  ]);
}

type TestFixtures = {
  secrets: ReturnType<typeof SecretsHelper.load>;
  authType: AuthType;
  endpointManager: EndpointManagementHelper;
  authenticatedPage: Page;
  adminPage: Page;
  userPage: Page;
  unauthenticatedPage: Page;
  noEndpointsAdminPage: Page;
  noEndpointsUserPage: Page;
  registeredEndpointsPage: Page;
  connectedEndpointsAdminPage: { page: Page; cfGuid: string; orgGuid: string; spaceGuid: string };
  connectedEndpointsUserPage: { page: Page; cfGuid: string; orgGuid: string; spaceGuid: string };
  cfApi: CFApiHelper;
  applicationHelper: ApplicationTestHelper;
  withTestApp: { page: Page; testApp: TestApp; helper: ApplicationTestHelper; cfApi: CFApiHelper };
  withTestApps: { page: Page; testApps: TestApp[]; helper: ApplicationTestHelper; cfApi: CFApiHelper };
};

/**
 * Extended test with worker-scoped sessions and test-scoped fixtures.
 * Usage: import { test, expect } from '../fixtures/test-base';
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  /**
   * Worker-scoped admin browser context.
   * Each worker authenticates once via API login, creating its own session.
   * All tests in this worker reuse this context (and its session cookie).
   */
  workerAdminContext: [async ({ browser }, use) => {
    const secrets = SecretsHelper.load();
    const baseURL = process.env.E2E_BASE_URL || 'https://localhost:5540';
    const authType = await detectAuthType(baseURL);
    const context = await browser.newContext({ ignoreHTTPSErrors: true, baseURL });

    await apiLogin(context.request, baseURL, secrets.console.admin.username, secrets.console.admin.password, authType);

    // Navigate once to ensure cookies are established
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.close();

    await use(context);
    await context.close();
  }, { scope: 'worker' }],

  /**
   * Worker-scoped user browser context.
   * Falls back to admin credentials if user is not configured.
   */
  workerUserContext: [async ({ browser }, use) => {
    const secrets = SecretsHelper.load();
    const baseURL = process.env.E2E_BASE_URL || 'https://localhost:5540';
    const authType = await detectAuthType(baseURL);
    const { username, password } = secrets.console.user;
    const context = await browser.newContext({ ignoreHTTPSErrors: true, baseURL });

    // Fall back to admin if user not configured
    const loginUser = (!username || !password || password.includes('REPLACE'))
      ? secrets.console.admin.username : username;
    const loginPass = (!username || !password || password.includes('REPLACE'))
      ? secrets.console.admin.password : password;

    await apiLogin(context.request, baseURL, loginUser, loginPass, authType);

    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.close();

    await use(context);
    await context.close();
  }, { scope: 'worker' }],
  /**
   * Secrets fixture - provides access to secrets.yaml
   */
  secrets: async ({}, use) => {
    const secrets = SecretsHelper.load();
    await use(secrets);
  },

  /**
   * Auth type fixture - detects local vs SSO auth
   */
  authType: async ({ baseURL }, use) => {
    const type = await detectAuthType(baseURL || 'https://localhost:5540');
    await use(type);
  },

  /**
   * Endpoint Manager fixture - provides endpoint management operations
   */
  endpointManager: async ({ baseURL }, use) => {
    const manager = new EndpointManagementHelper(baseURL);
    await use(manager);
    await manager.dispose();
  },

  /**
   * Authenticated page fixture - uses worker-scoped admin session.
   * Each worker has its own session, eliminating contention.
   */
  authenticatedPage: async ({ workerAdminContext }, use) => {
    const page = await workerAdminContext.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await use(page);
    await page.close();
  },

  /**
   * Admin page fixture - alias for authenticatedPage
   */
  adminPage: async ({ authenticatedPage }, use) => {
    await use(authenticatedPage);
  },

  /**
   * Unauthenticated page fixture - fresh browser context with no session.
   * Use for tests that need to verify the login page or unauthenticated behavior.
   */
  unauthenticatedPage: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  /**
   * User page fixture - uses worker-scoped user session
   */
  userPage: async ({ workerUserContext }, use) => {
    const page = await workerUserContext.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await use(page);
    await page.close();
  },

  /**
   * No Endpoints Admin Page - Admin user with worker session
   */
  noEndpointsAdminPage: async ({ workerAdminContext }, use) => {
    const page = await workerAdminContext.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await use(page);
    await page.close();
  },

  /**
   * No Endpoints User Page - Regular user with worker session
   */
  noEndpointsUserPage: async ({ workerUserContext }, use) => {
    const page = await workerUserContext.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await use(page);
    await page.close();
  },

  /**
   * Registered Endpoints Page - Admin with worker session
   */
  registeredEndpointsPage: async ({ workerAdminContext }, use) => {
    const page = await workerAdminContext.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Dismiss snackbar if present
    try {
      const snackbar = page.locator('mat-snack-bar-container, .mat-mdc-snack-bar-container, simple-snack-bar');
      await snackbar.waitFor({ state: 'visible', timeout: 3000 });
      const closeButton = snackbar.locator('button').filter({ hasText: /close|dismiss/i });
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      }
      await snackbar.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    } catch { /* snackbar may not appear */ }

    await use(page);
    await page.close();
  },

  /**
   * Connected Endpoints Admin Page - Admin with default CF registered and connected.
   * Pre-authenticated via storageState. Endpoint setup done in auth.setup.ts.
   * Uses page.request to get endpoint GUID (no extra browser launch).
   */
  connectedEndpointsAdminPage: async ({ workerAdminContext, secrets }, use) => {
    const page = await workerAdminContext.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Get CF endpoint GUID using the worker's own session
    const response = await page.request.get('/api/v1/endpoints');
    if (!response.ok()) {
      throw new Error(`GET /api/v1/endpoints failed: ${response.status()} ${response.statusText()} — session may be invalid`);
    }
    const endpointsList = await response.json();
    if (!Array.isArray(endpointsList)) {
      throw new Error(`GET /api/v1/endpoints returned ${typeof endpointsList} instead of array: ${JSON.stringify(endpointsList).slice(0, 200)}`);
    }
    const cfEndpoint = endpointsList.find((ep: any) => ep.cnsi_type === 'cf');

    if (!cfEndpoint) {
      throw new Error(`No CF endpoint found. Endpoints: ${JSON.stringify(endpointsList.map((e: any) => ({ name: e.name, type: e.cnsi_type }))).slice(0, 200)}`);
    }

    const cfConfig = secrets.cloudFoundry[0];

    await use({
      page,
      cfGuid: cfEndpoint.guid,
      orgGuid: cfConfig.testOrgGuid,
      spaceGuid: cfConfig.testSpaceGuid
    });

    await page.close();
  },

  /**
   * Connected Endpoints User Page - Regular user with default CF connected.
   * Pre-authenticated via storageState. Uses page.request for GUID lookup.
   */
  connectedEndpointsUserPage: async ({ workerUserContext, secrets }, use) => {
    const page = await workerUserContext.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Get CF endpoint GUID using the worker's own session
    const response = await withDeadline(page.request.get('/api/v1/endpoints'), 15000, 'connectedEndpointsUserPage endpoints GET');
    if (!response.ok()) {
      throw new Error(`GET /api/v1/endpoints failed: ${response.status()} ${response.statusText()} — session may be invalid`);
    }
    const endpointsList = await response.json();
    if (!Array.isArray(endpointsList)) {
      throw new Error(`GET /api/v1/endpoints returned ${typeof endpointsList} instead of array: ${JSON.stringify(endpointsList).slice(0, 200)}`);
    }
    // Guard (a): registry emptied out from under us (e.g. an earlier spec
    // cleared it and its own restore failed) — every downstream proxy call
    // would otherwise die with "No CF endpoint found", or worse.
    if (endpointsList.length === 0) {
      throw new Error('E2E_ENDPOINT_REGISTRY_EMPTY: no endpoints registered — an earlier spec likely cleared them');
    }
    const cfEndpoint = endpointsList.find((ep: any) => ep.cnsi_type === 'cf');

    if (!cfEndpoint) {
      throw new Error(`No CF endpoint found. Endpoints: ${JSON.stringify(endpointsList.map((e: any) => ({ name: e.name, type: e.cnsi_type }))).slice(0, 200)}`);
    }

    // Guard (b): registry is non-empty, but does the *user* identity
    // riding this worker context actually have a connected CF token for
    // it? /api/v1/endpoints doesn't carry per-identity token state; /pp/v1/info
    // does (Endpoints[type][guid].user is populated only when a token row
    // exists for the calling session). Missing token here is exactly the
    // measured cause of the empty-body 400 at the proxy (passthrough.go
    // token lookup failure) — surface it loudly instead of letting every
    // proxied call in the test fail with an unexplained empty 400.
    const infoResp = await withDeadline(page.request.get('/pp/v1/info'), 15000, 'connectedEndpointsUserPage info GET');
    if (!infoResp.ok()) {
      throw new Error(`GET /pp/v1/info failed: ${infoResp.status()} ${infoResp.statusText()} — cannot verify CF token connection`);
    }
    const info = await infoResp.json();
    const connectedDetail = info?.endpoints?.[cfEndpoint.cnsi_type]?.[cfEndpoint.guid];
    if (!connectedDetail?.user) {
      throw new Error(`E2E_NO_CF_TOKEN: identity user has no connected CF token for endpoint ${cfEndpoint.name} (${cfEndpoint.guid})`);
    }

    const cfConfig = secrets.cloudFoundry[0];

    await use({
      page,
      cfGuid: cfEndpoint.guid,
      orgGuid: cfConfig.testOrgGuid,
      spaceGuid: cfConfig.testSpaceGuid
    });

    await page.close();
  },

  /**
   * CF API Helper - Provides Cloud Foundry V3 API operations
   * Requires connected CF endpoint.
   * Still uses RequestHelper for ongoing API calls, but reuses
   * storageState session to avoid extra SSO login.
   */
  cfApi: async ({ baseURL, secrets }, use) => {
    const endpoints = secrets.cloudFoundry;
    if (!endpoints || endpoints.length === 0) {
      throw new Error('No Cloud Foundry endpoints configured in secrets');
    }

    // Create request helper with pre-authenticated state
    const request = new RequestHelper(baseURL || 'http://localhost:4200');
    await withDeadline(request.initFromStorageState(ADMIN_STATE), 15000, 'cfApi initFromStorageState');

    // Get registered endpoints
    const endpointsList = await withDeadline(request.get('/api/v1/endpoints'), 15000, 'cfApi endpoints GET');
    const cfEndpoint = endpointsList.find((ep: any) =>
      ep.cnsi_type === 'cf' && ep.api_endpoint?.Host
    );

    if (!cfEndpoint) {
      throw new Error('No CF endpoint found. Tests require a registered CF endpoint.');
    }

    // Initialize CF API helper
    const cfApi = new CFApiHelper(request, cfEndpoint.guid);
    await cfApi.init();

    await use(cfApi);

    // Do NOT label-sweep here (cleanupTestResources): it deletes ALL
    // stratos-e2e-test apps on the CF, including a parallel worker's app
    // that is mid-test. Fixtures delete their own resources by guid.
    await request.dispose();
  },

  /**
   * Application Test Helper - High-level application management operations
   * Requires connected CF endpoint with default org/space
   */
  applicationHelper: async ({ page, cfApi, secrets }, use) => {
    // Get default org and space from secrets
    const cfConfig = secrets.cloudFoundry[0];
    if (!cfConfig.testOrgGuid || !cfConfig.testSpaceGuid) {
      throw new Error('Test org and space GUIDs required in secrets.cloudFoundry[0]');
    }

    // Get CF GUID (from cfApi)
    const endpoints = await cfApi['request'].get('/api/v1/endpoints');
    const cfEndpoint = endpoints.find((ep: any) => ep.cnsi_type === 'cf');

    const helper = new ApplicationTestHelper(
      cfApi,
      page,
      cfEndpoint.guid,
      cfConfig.testOrgGuid,
      cfConfig.testSpaceGuid
    );

    await use(helper);
  },

  /**
   * With Test App - Creates a single test application
   * Automatically cleans up after test completion
   */
  withTestApp: async ({ connectedEndpointsUserPage, applicationHelper, cfApi }, use) => {
    const testApp = await applicationHelper.createTestApp();

    await use({
      page: connectedEndpointsUserPage.page,
      testApp,
      helper: applicationHelper,
      cfApi
    });

    // Cleanup
    await applicationHelper.cleanupTestApp(testApp);
  },

  /**
   * With Test Apps - Creates multiple test applications
   * Automatically cleans up after test completion
   */
  withTestApps: async ({ connectedEndpointsUserPage, applicationHelper, cfApi }, use) => {
    const testApps = await applicationHelper.createTestApps(3);

    await use({
      page: connectedEndpointsUserPage.page,
      testApps,
      helper: applicationHelper,
      cfApi
    });

    // Cleanup all apps
    await applicationHelper.cleanupTestApps(testApps);
  },
});

/**
 * Re-export expect for convenience
 */
export { expect } from '@playwright/test';
