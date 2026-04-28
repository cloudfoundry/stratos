import { test, expect } from '../../fixtures/test-base';
import { MarketplaceSummaryPage } from '../../pages/marketplace/marketplace-summary.page';

// Coverage for the service-broker-card V2→V3 cutover:
//   - card is wired to the V3-native /pp/v1/cf/service_brokers/:cnsi/:guid
//     handler (no legacy ngrx broker-list drain).
//   - auth_username row renders the tristate "Not Available" path because
//     the V3 read response cannot expose the field, and ServiceCatalogData
//     Service synthesizes _meta.unavailable: ['authUsername'].
//   - hovering the unavailable cell surfaces the "Not exposed by V3 API"
//     tooltip (display contract for the V2/V3 tristate-on-read pattern).

test.describe('Service Broker Card (V3 native)', () => {

  test('uses the V3-native broker endpoint and renders Not Available for authUsername', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;

    const servicesResponse = await connectedEndpointsAdminPage.request.get(
      `/pp/v1/proxy/v3/cf/${cfGuid}/service_offerings`
    );
    const services = servicesResponse?.resources;

    if (!services || services.length === 0) {
      test.skip(true, 'No service offerings available — skipping broker card tristate test');
    }

    const v3BrokerCalls: { url: string; status: number }[] = [];
    page.on('response', resp => {
      const u = resp.url();
      if (u.includes('/pp/v1/cf/service_brokers/')) {
        v3BrokerCalls.push({ url: u, status: resp.status() });
      }
    });

    const serviceGuid = services[0].guid;
    const summaryPage = new MarketplaceSummaryPage(page, cfGuid, serviceGuid);
    await summaryPage.navigateTo();
    await page.waitForLoadState('networkidle');

    const card = summaryPage.getServiceBrokerCard();
    await expect(card).toBeVisible({ timeout: 10000 });

    // Backend handler gets exercised — at least one call to the V3 native
    // single-resource endpoint, all returning 200 (no 4xx/5xx fallout).
    expect(v3BrokerCalls.length).toBeGreaterThan(0);
    for (const call of v3BrokerCalls) {
      expect(call.status, `unexpected status for ${call.url}`).toBe(200);
    }

    // Tristate primitive renders the unavailable branch for authUsername.
    const tristate = summaryPage.getAuthUsernameTristate();
    await expect(tristate).toBeVisible();
    await expect(tristate).toHaveClass(/tristate-value--unavailable/);
    await expect(tristate).toHaveText('Not Available');
  });

  test('hovering the unavailable authUsername surfaces the V3 tooltip', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;

    const servicesResponse = await connectedEndpointsAdminPage.request.get(
      `/pp/v1/proxy/v3/cf/${cfGuid}/service_offerings`
    );
    const services = servicesResponse?.resources;

    if (!services || services.length === 0) {
      test.skip(true, 'No service offerings available — skipping broker card tooltip test');
    }

    const serviceGuid = services[0].guid;
    const summaryPage = new MarketplaceSummaryPage(page, cfGuid, serviceGuid);
    await summaryPage.navigateTo();
    await page.waitForLoadState('networkidle');

    const tristate = summaryPage.getAuthUsernameTristate();
    await expect(tristate).toBeVisible({ timeout: 10000 });
    await tristate.hover();

    const tooltip = page.locator('.custom-tooltip', { hasText: 'Not exposed by V3 API' });
    await expect(tooltip).toBeVisible({ timeout: 2000 });
  });
});
