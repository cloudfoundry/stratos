import { test, expect } from '../../fixtures/test-base';

/**
 * The connected Cloud Foundry endpoint on the Endpoints page, and the Cloud
 * Foundry section it leads to. The e2e backend has one CF endpoint
 * (cloudFoundry[0] in the secrets profile), connected for the admin.
 */

test.describe('Cloud Foundry List', () => {

  test('lists the CF endpoint with its address and status', { tag: '@smoke' }, async ({ connectedEndpointsAdminPage, secrets }) => {
    const { page } = connectedEndpointsAdminPage;
    const cf = secrets.getCloudfoundryEndpoint(0);

    await page.goto('/endpoints');
    const row = page.locator('[data-test=row]').filter({ hasText: cf.name });
    await expect(row).toBeVisible({ timeout: 30000 });
    await expect(row).toContainText(new URL(cf.url).host);
    await expect(row).toContainText('Connected');
  });

  test('offers Disconnect and Reconnect for the connected endpoint, not Connect', async ({ connectedEndpointsAdminPage, secrets }) => {
    const { page } = connectedEndpointsAdminPage;
    const cf = secrets.getCloudfoundryEndpoint(0);

    await page.goto('/endpoints');
    const row = page.locator('[data-test=row]').filter({ hasText: cf.name });
    await row.locator('[data-test=row-actions]').click({ timeout: 30000 });
    const menu = page.locator('[data-test=row-actions-menu]');
    await expect(menu.getByText('Disconnect', { exact: true })).toBeVisible();
    await expect(menu.getByText('Reconnect', { exact: true })).toBeVisible();
    await expect(menu.getByText('Connect', { exact: true })).toHaveCount(0);
    // Acting on them would drop the token every admin test shares.
    await page.keyboard.press('Escape');
  });

  test('opens the one connected foundation from the side navigation', { tag: '@smoke' }, async ({ connectedEndpointsAdminPage, secrets }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const cf = secrets.getCloudfoundryEndpoint(0);

    await page.goto('/home');
    await page.getByRole('link', { name: 'Cloud Foundry' }).first().click();
    // With one connected CF the section skips its list and opens it.
    await page.waitForURL(url => url.pathname.startsWith(`/cloud-foundry/${cfGuid}`), { timeout: 30000 });
    await expect(page.locator('app-show-page-header')).toContainText(cf.name, { timeout: 30000 });
  });
});
