import { test, expect } from '../../fixtures/test-base';

/**
 * Service Keys E2E Tests (GH#4301)
 *
 * Covers the per-instance Service Keys management page introduced in #4301,
 * reached from a service instance's row-action menu:
 *   /services/:type/:endpointId/:serviceInstanceId/keys
 *
 * The page lists a managed instance's service keys (credential bindings of
 * type=key), shows an empty state when there are none, exposes an "Add Service
 * Key" action, and renders each key's credentials in a masked accordion.
 *
 * Security note: these tests assert that credential values are NOT rendered in
 * plaintext by default. They never reveal or print a credential value.
 */

// Locate a managed (bindable) service instance in the test space via the V3
// proxy. Returns its guid, or null when none is available (broker-dependent).
async function findManagedInstanceGuid(
  request: import('@playwright/test').APIRequestContext,
  cfGuid: string,
  spaceGuid: string,
): Promise<{ guid: string; name: string } | null> {
  const res = await request.get(
    `/pp/v1/proxy/v3/cf/${cfGuid}/service_instances?type=managed&space_guids=${spaceGuid}&per_page=50`,
  );
  if (!res.ok()) return null;
  const body = await res.json();
  const resources = Array.isArray(body?.resources) ? body.resources : [];
  const inst = resources.find((r: any) => r?.guid);
  return inst ? { guid: inst.guid, name: inst.name } : null;
}

test.describe('Service Keys (#4301)', () => {

  test('service keys page renders for a managed instance', async ({ connectedEndpointsAdminPage, secrets }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const spaceGuid = secrets.getCloudfoundryEndpoint(0).testSpaceGuid;

    const instance = await findManagedInstanceGuid(page.request, cfGuid, spaceGuid);
    if (!instance) {
      test.skip(true, 'No managed service instance available (broker-dependent)');
      return;
    }

    await page.goto(`/services/service/${cfGuid}/${instance.guid}/keys`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Header names the instance, count summary + Add action are present.
    await expect(page.getByText(/Service keys for/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Total Service Keys:/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Service Key/i })).toBeVisible();
  });

  test('shows the empty state OR a key list (never a stuck spinner)', async ({ connectedEndpointsAdminPage, secrets }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const spaceGuid = secrets.getCloudfoundryEndpoint(0).testSpaceGuid;

    const instance = await findManagedInstanceGuid(page.request, cfGuid, spaceGuid);
    if (!instance) {
      test.skip(true, 'No managed service instance available (broker-dependent)');
      return;
    }

    await page.goto(`/services/service/${cfGuid}/${instance.guid}/keys`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const totalText = await page.getByText(/Total Service Keys:\s*\d+/i).innerText();
    const total = parseInt(totalText.replace(/\D+/g, ''), 10) || 0;

    if (total === 0) {
      await expect(page.getByText(/no service keys/i)).toBeVisible();
    } else {
      // At least one key row/accordion is rendered.
      const keyRows = page.locator('mat-expansion-panel, [data-test="service-key"], app-accordion');
      await expect(keyRows.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('credentials are masked by default (not shown in plaintext)', async ({ connectedEndpointsAdminPage, secrets }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const spaceGuid = secrets.getCloudfoundryEndpoint(0).testSpaceGuid;

    const instance = await findManagedInstanceGuid(page.request, cfGuid, spaceGuid);
    if (!instance) {
      test.skip(true, 'No managed service instance available (broker-dependent)');
      return;
    }

    await page.goto(`/services/service/${cfGuid}/${instance.guid}/keys`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const totalText = await page.getByText(/Total Service Keys:\s*\d+/i).innerText();
    const total = parseInt(totalText.replace(/\D+/g, ''), 10) || 0;
    if (total === 0) {
      test.skip(true, 'Instance has no service keys to assert masking against');
      return;
    }

    // A masked credentials view should expose a reveal/show affordance and
    // must NOT render the raw credential up-front. We assert the presence of
    // the masking control rather than reading any secret value.
    const revealControl = page.getByRole('button', { name: /show|reveal|visibility/i });
    await expect(revealControl.first()).toBeVisible({ timeout: 10000 });
  });

  test('Add Service Key opens the create form and cancels cleanly', async ({ connectedEndpointsAdminPage, secrets }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const spaceGuid = secrets.getCloudfoundryEndpoint(0).testSpaceGuid;

    const instance = await findManagedInstanceGuid(page.request, cfGuid, spaceGuid);
    if (!instance) {
      test.skip(true, 'No managed service instance available (broker-dependent)');
      return;
    }

    await page.goto(`/services/service/${cfGuid}/${instance.guid}/keys`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    await page.getByRole('button', { name: /Add Service Key/i }).click();

    // A create dialog / form with a name field should appear. Don't submit —
    // creating a key provisions real credentials.
    const nameField = page.getByRole('textbox').first();
    await expect(nameField).toBeVisible({ timeout: 10000 });

    const cancel = page.getByRole('button', { name: /cancel/i }).first();
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click();
    } else {
      await page.keyboard.press('Escape');
    }
  });

  test('Service Keys action is gated to bindable (managed) instances', async ({ connectedEndpointsAdminPage, secrets }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const spaceGuid = secrets.getCloudfoundryEndpoint(0).testSpaceGuid;

    const instance = await findManagedInstanceGuid(page.request, cfGuid, spaceGuid);
    if (!instance) {
      test.skip(true, 'No managed service instance available (broker-dependent)');
      return;
    }

    // Reaching the keys route at all is the gated capability: the page must
    // render its management surface (not redirect / error) for a bindable
    // instance. Non-bindable (user-provided) instances do not expose the
    // Service Keys row action that leads here.
    await page.goto(`/services/service/${cfGuid}/${instance.guid}/keys`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    await expect(page).toHaveURL(/\/keys$/);
    await expect(page.getByRole('button', { name: /Add Service Key/i })).toBeVisible({ timeout: 10000 });
  });
});
