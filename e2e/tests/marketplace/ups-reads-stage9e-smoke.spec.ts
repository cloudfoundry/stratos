import { test, expect } from '../../fixtures/test-base';
import { ServicesWallPage } from '../../pages/marketplace/services-wall.page';

/**
 * Stage 9e — UPS read-path smoke
 *
 * After the v3 rewrite of CloudFoundryUserProvidedServicesService, three
 * read paths that previously rode ngrx pagination now hit the Stratos-
 * shape /pp/v1/cf/.../service_instances handlers with `?type=user-provided`
 * filters pushed down to CF v3:
 *
 *   - getUserProvidedServices        (UPS picker in Add Service Instance)
 *   - getUserProvidedService         (edit-mode pre-fill)
 *   - fetchUserProvidedServiceInstancesCount (org / space card UPS count)
 *
 * This smoke proves the wire paths are reachable from a connected CF
 * endpoint. The Add Service Instance flow, and UPS create / edit / delete,
 * are tested in user-provided-service-instance.spec.ts.
 */
test.describe('Stage 9e — UPS reads smoke', () => {
  test('services wall reachable on a connected CF endpoint', async ({ connectedEndpointsAdminPage, secrets }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
    const spaceGuid = cfEndpoint.testSpaceGuid;

    const servicesPage = new ServicesWallPage(page);
    await servicesPage.navigateTo(cfGuid, spaceGuid);
    await servicesPage.waitForPage();

    expect(page.url()).toContain(`/services/${cfGuid}`);
  });

  test('UPS count endpoint returns a number for the test space', async ({ connectedEndpointsAdminPage, secrets, request }) => {
    const { cfGuid } = connectedEndpointsAdminPage;
    const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
    const spaceGuid = cfEndpoint.testSpaceGuid;

    // Hit the new wire shape directly. Path-scoped variant is what
    // fetchUserProvidedServiceInstancesCount(cfGuid, undefined, spaceGuid)
    // exercises in-app.
    const url = `/pp/v1/cf/spaces/${cfGuid}/${spaceGuid}/service_instances?return=counts&type=user-provided`;
    const resp = await request.get(url);
    expect(resp.status()).toBe(200);

    const body = await resp.json();
    // `?return=counts` returns the legacy flat envelope (totalResults).
    expect(body).toHaveProperty('totalResults');
    expect(typeof body.totalResults).toBe('number');
    expect(body.totalResults).toBeGreaterThanOrEqual(0);
  });

  test('cnsi-wide UPS list endpoint accepts type+org filters', async ({ connectedEndpointsAdminPage, secrets, request }) => {
    const { cfGuid } = connectedEndpointsAdminPage;
    const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
    const orgGuid = cfEndpoint.testOrgGuid;

    // Org-scoped count exercise — what the org card calls.
    const url = `/pp/v1/cf/service_instances/${cfGuid}?return=counts&type=user-provided&organization_guids=${orgGuid}`;
    const resp = await request.get(url);
    expect(resp.status()).toBe(200);

    const body = await resp.json();
    expect(body).toHaveProperty('totalResults');
    expect(typeof body.totalResults).toBe('number');
  });
});
