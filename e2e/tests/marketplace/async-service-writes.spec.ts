import { APIRequestContext, Page, request as playwrightRequest } from '@playwright/test';
import { test, expect } from '../../fixtures/test-base';
import { CFApiHelper } from '../../helpers/cf-api.helper';

/**
 * Service instance writes through the create wizard must end the same way
 * whether the broker answers synchronously or asynchronously (#6001, #6002).
 *
 * Needs a broker whose response mode can be switched at runtime:
 * cloudfoundry/overview-broker, registered for testOrg/testSpace and set in
 * the active secrets profile as cloudFoundry[0].services.testBroker
 * ({url, offering, plan}; see secrets.yaml.template). Skipped without it.
 *
 * The broker's mode is global, so this file runs serially and puts the broker
 * back to its default mode afterwards.
 */

interface TestBroker {
  url: string;
  offering: string;
  plan: string;
}

const RESPONSE_MODES = ['sync', 'async'] as const;

test.describe.configure({ mode: 'serial' });
// Browser projects run in parallel and would race on the broker's mode; the
// behaviour under test is not browser-specific.
test.skip(({ browserName }) => browserName !== 'chromium', 'runs in one browser: the broker mode is shared');

async function setBrokerMode(api: APIRequestContext, broker: TestBroker, mode: string): Promise<void> {
  const res = await api.post(`${broker.url}/admin/setResponseMode`, { data: { mode } });
  expect(res.ok(), `set broker response mode ${mode}`).toBe(true);
}

/** Opens a select in the current wizard step and picks the option named `name`. */
async function pick(page: Page, index: number, name: string): Promise<void> {
  await page.locator('.steppers [role=combobox]').nth(index).click();
  const exact = new RegExp(`^\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
  await page.locator('[role=listbox] app-option:visible').filter({ hasText: exact }).first().click();
}

async function next(page: Page, label: 'Next' | 'Finish' = 'Next'): Promise<void> {
  const button = page.getByRole('button', { name: label });
  await expect(button).toBeEnabled({ timeout: 15000 });
  await button.click();
}

async function waitForInstance(cfApi: CFApiHelper, spaceGuid: string, name: string) {
  let found = await cfApi.findServiceInstanceByName(spaceGuid, name);
  for (let i = 0; !found && i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    found = await cfApi.findServiceInstanceByName(spaceGuid, name);
  }
  expect(found, `service instance ${name} exists in CF`).toBeTruthy();
  return found!;
}

async function deleteInstance(cfApi: CFApiHelper, spaceGuid: string, name: string): Promise<void> {
  const si = await cfApi.findServiceInstanceByName(spaceGuid, name).catch(() => null);
  if (!si) {
    return;
  }
  for (const binding of await cfApi.getAppBindings(si.guid)) {
    await cfApi.unbindService(binding.guid);
  }
  // Unbinding a managed instance is a CF job, and CF rejects deleting the
  // instance while it runs.
  await expect.poll(async () => (await cfApi.getAppBindings(si.guid)).length, { timeout: 120000 }).toBe(0);
  await cfApi.deleteServiceInstance(si.guid);
  // The app may only go once nothing binds it.
  await expect.poll(() => cfApi.serviceInstanceExists(si.guid), { timeout: 120000 }).toBe(false);
}

for (const mode of RESPONSE_MODES) {
  test.describe(`create service instance, ${mode} broker`, () => {
    // An async broker plus CF's own polling: a create with bind and its
    // cleanup took 3.5 min on the lab.
    test.setTimeout(360000);

    let broker: TestBroker | undefined;
    let brokerApi: APIRequestContext;

    test.beforeAll(async ({ secrets }) => {
      broker = secrets.cloudFoundry[0]?.services?.testBroker;
      if (!broker) {
        return;
      }
      brokerApi = await playwrightRequest.newContext({ ignoreHTTPSErrors: true });
      await setBrokerMode(brokerApi, broker, mode);
    });

    test.afterAll(async () => {
      if (broker && brokerApi) {
        await setBrokerMode(brokerApi, broker, 'default');
        await brokerApi.dispose();
      }
    });

    async function runWizard(
      page: Page, cfGuid: string, cfApi: CFApiHelper, secrets: any, name: string, bindAppName?: string,
    ): Promise<void> {
      const cf = secrets.cloudFoundry[0];
      const offeringGuid = await cfApi.findServiceOfferingGuid(broker!.offering, cf.testSpaceGuid);
      expect(offeringGuid, `offering ${broker!.offering} visible in the test space`).toBeTruthy();

      await page.goto(`/marketplace/${cfGuid}/${offeringGuid}/create`);
      await pick(page, 0, cf.testOrg);
      await pick(page, 1, cf.testSpace);
      await next(page);
      await pick(page, 0, broker!.plan);
      await next(page);
      if (bindAppName) {
        await pick(page, 0, bindAppName);
      }
      await next(page);
      await page.getByRole('textbox', { name: /Name/ }).pressSequentially(name);
      await next(page, 'Finish');
      // The wizard leaves the create page once it reports success.
      await page.waitForURL(url => !url.pathname.endsWith('/create'), { timeout: 200000 });
    }

    test('reports success only once CF has the instance', async ({ connectedEndpointsAdminPage, cfApi, secrets }) => {
      test.skip(!broker, 'no services.testBroker in the secrets profile');
      const { page, cfGuid, spaceGuid } = connectedEndpointsAdminPage;
      const name = `e2e-${mode}-create-${Date.now()}`;
      try {
        await runWizard(page, cfGuid, cfApi, secrets, name);
        const si = await waitForInstance(cfApi, spaceGuid, name);
        expect(si.last_operation?.state, 'instance state when the wizard reported success').toBe('succeeded');
      } finally {
        await deleteInstance(cfApi, spaceGuid, name);
      }
    });

    test('binds the app chosen in the wizard', async ({ connectedEndpointsAdminPage, cfApi, secrets, applicationHelper }) => {
      test.skip(!broker, 'no services.testBroker in the secrets profile');
      const { page, cfGuid, spaceGuid } = connectedEndpointsAdminPage;
      const name = `e2e-${mode}-bind-${Date.now()}`;
      const testApp = await applicationHelper.createTestApp(`e2e-${mode}-bind-app`);
      try {
        await runWizard(page, cfGuid, cfApi, secrets, name, testApp.app.name);
        const si = await waitForInstance(cfApi, spaceGuid, name);
        await expect
          .poll(async () => (await cfApi.getAppBindings(si.guid)).map(b => b.appGuid), { timeout: 60000 })
          .toContain(testApp.app.guid);
      } finally {
        await deleteInstance(cfApi, spaceGuid, name);
        await applicationHelper.cleanupTestApp(testApp);
      }
    });
  });
}
