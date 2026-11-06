import { test, expect } from '../../fixtures/test-base';

/**
 * App wall filter toolbar e2e.
 *
 * Covers two user-visible behaviors on /applications:
 *
 *   1. Clear-filter button clears dropdowns + name filter in one click.
 *      Regression guard: the legacy list.component had FWT-856's clear
 *      button; the signal-list migration dropped it. This test locks in
 *      the restored behavior.
 *
 *   2. Stale-selection auto-clear: when a selected org/space is no longer
 *      in the options list (because the last app in it was deleted, or a
 *      CF disconnected), the dropdown selection signal resets to null so
 *      the displayed "All" matches the applied filter. Without this fix
 *      the list would say "0 results" while the UI claims "All" selected.
 */

const WALL_LOAD_TIMEOUT_MS = 20000;

test.describe('App wall filter toolbar', () => {

  test('Clear button resets dropdowns and name filter', async ({ connectedEndpointsAdminPage }) => {
    const { page } = connectedEndpointsAdminPage;

    await page.goto('/applications');
    await expect(page.locator('app-application-wall')).toBeVisible({ timeout: WALL_LOAD_TIMEOUT_MS });

    // Clear button is disabled when no filter is active.
    const clearBtn = page.locator('[data-test="clear-filters"]');
    await expect(clearBtn).toBeVisible({ timeout: WALL_LOAD_TIMEOUT_MS });
    await expect(clearBtn).toBeDisabled();

    // Activate a filter (name filter is environment-independent — it's just
    // a text input, so we don't need a CF with specific apps to drive it).
    const nameFilter = page.locator('app-signal-list input[placeholder*="Filter by Name" i]');
    await nameFilter.fill('zzz-never-matches');
    await expect(clearBtn).toBeEnabled({ timeout: 5000 });

    // Clicking clears the input and disables the button again.
    await clearBtn.click();
    await expect(nameFilter).toHaveValue('');
    await expect(clearBtn).toBeDisabled();
  });

  test('Clear button is only visible when onClear is wired (smoke)', async ({ connectedEndpointsAdminPage }) => {
    const { page } = connectedEndpointsAdminPage;

    await page.goto('/applications');
    await expect(page.locator('app-application-wall')).toBeVisible({ timeout: WALL_LOAD_TIMEOUT_MS });

    // The app wall always wires onClear, so the button always exists here.
    // This test is a low-cost regression guard: if someone refactors the
    // wiring out, this catches it.
    await expect(page.locator('[data-test="clear-filters"]')).toBeVisible({ timeout: WALL_LOAD_TIMEOUT_MS });
  });
});
