import { test, expect } from '../../fixtures/test-base';

/**
 * The Services list's name filter (#6002). The test makes two user-provided
 * instances, which need no broker, and removes them afterwards.
 */

test.describe('services list', () => {
  test('filters the instances by name', async ({ connectedEndpointsAdminPage, cfApi }) => {
    const { page, spaceGuid } = connectedEndpointsAdminPage;
    const prefix = `e2e-wall-filter-${Date.now()}`;
    const names = [`${prefix}-alpha`, `${prefix}-beta`];
    const guids: string[] = [];
    try {
      for (const name of names) {
        guids.push(await cfApi.createUserProvidedService(spaceGuid, name));
      }
      await page.goto('/services');
      const filter = page.locator('[data-test=name-filter]');
      const rows = page.locator('[data-test=row], [data-test=card]');
      const row = (name: string) => rows.filter({ hasText: name });

      await filter.fill(prefix);
      await expect(row(names[0])).toBeVisible({ timeout: 60000 });
      await expect(row(names[1])).toBeVisible();
      await expect(rows).toHaveCount(2);

      await filter.fill(names[1]);
      await expect(row(names[1])).toBeVisible();
      await expect(rows).toHaveCount(1);

      await filter.fill(`${prefix}-gamma`);
      await expect(page.locator('[data-test=empty-filtered]')).toContainText('No service instances match the current filters');
      await expect(rows).toHaveCount(0);
    } finally {
      for (const guid of guids) {
        await cfApi.deleteServiceInstance(guid);
      }
    }
  });
});
