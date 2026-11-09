import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { appTitle, orgQuotaTitle, orgTitle, serviceInstanceTitle } from './route-titles';
import { EndpointDataRegistry } from './services/endpoint-data/endpoint-data.registry';
import { OrgDataRegistry } from './services/endpoint-data/org-data.registry';

// A route under the "Applications" section with the given params.
function routeWith(params: Record<string, string>): ActivatedRouteSnapshot {
  return {
    paramMap: convertToParamMap(params),
    parent: { title: 'Applications', parent: null },
  } as unknown as ActivatedRouteSnapshot;
}

function resolve(fn: ResolveFn<string>, route: ActivatedRouteSnapshot): Promise<string> {
  return TestBed.runInInjectionContext(() => fn(route, {} as RouterStateSnapshot)) as Promise<string>;
}

describe('cloud-foundry route titles', () => {
  let httpMock: HttpTestingController;
  const lists = { apps: signal([{ guid: 'app-1', name: 'my-app' }]), recentApps: signal([]), serviceInstances: signal([]) };
  const org = { load: () => of(undefined), org: signal({ name: 'my-org' }) };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EndpointDataRegistry, useValue: { peek: (cf: string) => (cf === 'cf-1' ? lists : undefined) } },
        { provide: OrgDataRegistry, useValue: { acquire: () => org } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('names an application from the endpoint lists cache without a request', async () => {
    await expect(resolve(appTitle, routeWith({ endpointId: 'cf-1', id: 'app-1' }))).resolves.toBe('my-app');
    httpMock.expectNone(() => true);
  });

  it('fetches the application when the cache has not seen it', async () => {
    const title = resolve(appTitle, routeWith({ endpointId: 'cf-2', id: 'app-9' }));
    httpMock.expectOne('/pp/v1/cf/apps/cf-2/app-9').flush({ guid: 'app-9', name: 'fetched-app' });
    await expect(title).resolves.toBe('fetched-app');
  });

  it('keeps the section title when the fetch fails', async () => {
    const title = resolve(appTitle, routeWith({ endpointId: 'cf-2', id: 'gone' }));
    httpMock.expectOne('/pp/v1/cf/apps/cf-2/gone').flush('nope', { status: 404, statusText: 'Not Found' });
    await expect(title).resolves.toBe('Applications');
  });

  it('prefixes a service instance page with its action', async () => {
    const title = resolve(serviceInstanceTitle('Detach'), routeWith({ endpointId: 'cf-1', serviceInstanceId: 'si-1' }));
    httpMock.expectOne('/pp/v1/cf/service_instances/cf-1/si-1').flush({ guid: 'si-1', name: 'my-db' });
    await expect(title).resolves.toBe('Detach - my-db');
  });

  it('names a quota from its definition', async () => {
    const title = resolve(orgQuotaTitle, routeWith({ endpointId: 'cf-1', quotaId: 'q-1' }));
    httpMock.expectOne('/pp/v1/cf/organization_quotas/cf-1/q-1').flush({ guid: 'q-1', name: 'default' });
    await expect(title).resolves.toBe('default');
  });

  it('names an organization through its shared data service', async () => {
    await expect(resolve(orgTitle, routeWith({ endpointId: 'cf-1', orgId: 'o-1' }))).resolves.toBe('my-org');
  });
});
