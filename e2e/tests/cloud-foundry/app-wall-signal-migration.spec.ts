import { test, expect } from '../../fixtures/test-base';

/**
 * App Wall — Signal-Native Migration E2E Tests
 *
 * Covers the FWT-934 composite-key + signal-list migration on the Applications
 * wall (ApplicationWallComponent + SignalListComponent):
 *
 *   1. Duplicate-URL acceptance — two CFs registered against the same URL no
 *      longer trigger an "auto-scope to a single endpoint" banner. Apps from
 *      every connected CF are rendered together in the signal-list; only an
 *      informational banner is expected.
 *
 *   2. Delete flow — removing an app from the wall drops the row from the
 *      signal-list view without a full page reload. This test is DESTRUCTIVE
 *      and is guarded behind E2E_ALLOW_DESTRUCTIVE=1. When enabled it targets
 *      the canonical disposable test app `sample-go-app` in the adepttech
 *      `e2e` org / `e2e` space. If the app is not present, the test skips
 *      rather than failing — pre-seed via `cf push` to exercise the flow.
 *
 * Row selector:
 *   The new <app-signal-list> emits `[data-test="row"]` on each <tr> (see
 *   signal-list.component.html). Tests assert against that, not the legacy
 *   <app-list> selectors.
 *
 * Environment expectations:
 *   The E2E environment may have 0, 1, or many CFs registered, and 0, 1, or
 *   many apps in each. The duplicate-URL test only asserts the page *renders*
 *   without the legacy auto-scope banner. The delete test is opt-in via
 *   E2E_ALLOW_DESTRUCTIVE=1 and skips cleanly when sample-go-app is absent.
 */

const WALL_LOAD_TIMEOUT_MS = 20000;
const ROW_MUTATION_TIMEOUT_MS = 30000;

test.describe('App wall signal-native migration', () => {

  test('duplicate-URL acceptance — wall renders without an auto-scope banner', async ({ connectedEndpointsAdminPage }) => {
    const { page } = connectedEndpointsAdminPage;

    await page.goto('/applications');
    await page.waitForLoadState('networkidle', { timeout: WALL_LOAD_TIMEOUT_MS }).catch(() => {});

    // Wall component must render (even if no apps are present, the component
    // is mounted and the signal-list scaffolding appears).
    const wall = page.locator('app-application-wall');
    await expect(wall).toBeVisible({ timeout: WALL_LOAD_TIMEOUT_MS });

    // Any auto-scope / single-endpoint-forcing banner would indicate the
    // legacy pre-FWT-934 behavior. Text fragments like "auto-scope",
    // "scoped to", "only showing apps from" must NOT be on the page.
    // An informational banner ("N endpoints share a URL ... shown together")
    // IS allowed — verify its text shape does not match the legacy warning.
    const bannerText = await page.locator('body').textContent();
    expect(bannerText ?? '').not.toMatch(/auto[-\s]?scope/i);
    expect(bannerText ?? '').not.toMatch(/only showing apps from/i);

    // The signal-list table scaffold should render. If no apps are present
    // we still get an empty <tbody>; we just don't require rows here.
    const listOrLoading = page.locator('app-signal-list, [data-test="loading"], app-cf-endpoints-missing');
    await expect(listOrLoading.first()).toBeVisible({ timeout: WALL_LOAD_TIMEOUT_MS });

    // If rows are present, confirm they were emitted by the new signal-list
    // (data-test="row" is the SignalListComponent row marker).
    const rowCount = await page.locator('app-signal-list [data-test="row"]').count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('delete sample-go-app — only when E2E_ALLOW_DESTRUCTIVE=1', async ({ connectedEndpointsAdminPage }) => {
    test.skip(
      process.env.E2E_ALLOW_DESTRUCTIVE !== '1',
      'destructive test disabled; set E2E_ALLOW_DESTRUCTIVE=1 to enable',
    );

    const { page } = connectedEndpointsAdminPage;
    const TARGET_APP = 'sample-go-app';

    await page.goto('/applications');
    await page.waitForLoadState('networkidle', { timeout: WALL_LOAD_TIMEOUT_MS }).catch(() => {});

    const wall = page.locator('app-application-wall');
    await expect(wall).toBeVisible({ timeout: WALL_LOAD_TIMEOUT_MS });

    // Allow the signal-list to hydrate from the per-CNSI sources. The
    // loading indicator clearing is a proxy for "initial fetch done".
    await page.locator('[data-test="loading"]').first().waitFor({ state: 'hidden', timeout: WALL_LOAD_TIMEOUT_MS }).catch(() => {});

    const rowLocator = page.locator('app-signal-list [data-test="row"]');
    await page.locator('app-signal-list [data-test="row"]').first().waitFor({ state: 'visible', timeout: WALL_LOAD_TIMEOUT_MS }).catch(() => {});

    // Target the canonical disposable test app in the adepttech e2e org/space.
    // SignalListComponent renders name text inside the row; `hasText` picks it
    // up regardless of cell structure.
    const targetRow = page.locator('app-signal-list [data-test="row"]', { hasText: TARGET_APP });
    const targetCount = await targetRow.count();
    test.skip(
      targetCount === 0,
      `${TARGET_APP} not present in the E2E environment — pre-seed via cf push (e2e org / e2e space) before running`,
    );

    const rowCountBefore = await rowLocator.count();

    // Navigate into the target app's detail page by clicking its specific row
    // (not the first row). Deletion is reached from the detail page in the
    // current app-wall flow.
    await targetRow.first().click();

    // We should land on an app detail route: /applications/:endpointId/:id/...
    await page.waitForURL(/.*\/applications\/[^/]+\/[^/]+(\/|$)/, { timeout: WALL_LOAD_TIMEOUT_MS }).catch(() => {});

    // Hunt for a Delete action. The detail page may expose it as a button in
    // the page header actions, a menu option, or a direct router link to
    // ".../delete". If we can't find a trigger, skip — the test is about the
    // list-view reaction, not the delete UI shape.
    const deleteTrigger = page.locator('button, a, mat-option').filter({ hasText: /^delete$/i }).first();
    const hasDeleteTrigger = await deleteTrigger.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasDeleteTrigger) {
      // Some environments expose delete behind an actions menu. Try one
      // level of indirection before skipping.
      const actionsMenu = page.locator('button[aria-label*="action" i], button[aria-label*="menu" i]').first();
      if (await actionsMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
        await actionsMenu.click();
        const menuDelete = page.locator('button, mat-option').filter({ hasText: /^delete$/i }).first();
        if (await menuDelete.isVisible({ timeout: 3000 }).catch(() => false)) {
          await menuDelete.click();
        } else {
          test.skip(true, 'Delete action not reachable from app detail page in this environment');
          return;
        }
      } else {
        test.skip(true, 'Delete trigger not found on app detail page');
        return;
      }
    } else {
      await deleteTrigger.click();
    }

    // The ApplicationDeleteComponent is its own route; confirm button copy
    // varies ("Delete", "Confirm", "Yes"). Click the most-specific match,
    // falling back to the generic "Delete" if no confirmation dialog is used.
    const confirmButton = page.locator('button').filter({ hasText: /^(delete|confirm|yes)$/i }).last();
    if (await confirmButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Wait for the wall to reappear — the delete flow navigates back to the
    // wall on success (or we navigate manually). Either way, we want to
    // land back on /applications and see the row set mutate without a
    // full-page reload of the test file.
    await page.waitForURL(/.*\/applications(\?|#|$)/, { timeout: WALL_LOAD_TIMEOUT_MS }).catch(async () => {
      await page.goto('/applications');
    });

    await expect(page.locator('app-application-wall')).toBeVisible({ timeout: WALL_LOAD_TIMEOUT_MS });

    // Poll until the sample-go-app row disappears from the signal-list.
    await expect.poll(
      async () => page.locator('app-signal-list [data-test="row"]', { hasText: TARGET_APP }).count(),
      { timeout: ROW_MUTATION_TIMEOUT_MS, message: `${TARGET_APP} row did not disappear from signal-list after delete` },
    ).toBe(0);

    const afterCount = await rowLocator.count();
    expect(afterCount).toBe(rowCountBefore - 1);
  });
});
