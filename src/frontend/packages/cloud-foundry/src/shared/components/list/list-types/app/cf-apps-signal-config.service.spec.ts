import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { CfAppsSignalConfigService } from './cf-apps-signal-config.service';
import { CloudFoundryService } from '../../../../data-services/cloud-foundry.service';
import type { StApp } from '../../../../../services/endpoint-data/stratos-types';

function makeHttp(): HttpClient {
  return {
    get: vi.fn(() => of({
      resources: [],
      pagination: { totalResults: 0, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } },
    })),
  } as unknown as HttpClient;
}

// Stub CloudFoundryService to avoid ngrx store wiring. The real service's
// constructor touches `stratosEntityCatalog.endpoint.store` which isn't
// available in this lightweight test setup.
function makeStubCfService(endpoints: Array<{ guid: string; name: string }> = []): CloudFoundryService {
  return { connectedCFEndpoints$: of(endpoints) } as unknown as CloudFoundryService;
}

// Instantiate the service via TestBed so inject() inside its constructor
// has a valid injection context.
function makeSvc(http: HttpClient, cf?: CloudFoundryService): CfAppsSignalConfigService {
  TestBed.configureTestingModule({
    providers: [
      { provide: HttpClient, useValue: http },
      { provide: CloudFoundryService, useValue: cf ?? makeStubCfService() },
      CfAppsSignalConfigService,
    ],
  });
  return TestBed.inject(CfAppsSignalConfigService);
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfAppsSignalConfigService', () => {
  it('constructs one CnsiAppsSource per connected CF in scope', () => {
    const http = makeHttp();
    const svc = makeSvc(http);
    svc.initialize(['cnsi-1', 'cnsi-2']);
    expect(svc.orchestrator.sources.map(s => s.cnsiGuid)).toEqual(['cnsi-1', 'cnsi-2']);
  });

  it('exposes a ViewPipeline with filter / sort / pagination signals', () => {
    const http = makeHttp();
    const svc = makeSvc(http);
    svc.initialize(['cnsi-1']);
    expect(svc.view).toBeDefined();
    expect(svc.filter).toBeDefined();
    expect(svc.sort).toBeDefined();
    expect(svc.pageSize).toBeDefined();
    expect(svc.pageIndex).toBeDefined();
  });

  it('selectedCnsi excludes apps from other CFs via the filter signal', () => {
    const http = makeHttp();
    const svc = makeSvc(http);
    const a: StApp = { guid: 'a', name: 'a-app', state: 'STARTED', cnsiGuid: 'cf-1', spaceGuid: 'sp-1', instances: 1, createdAt: '', updatedAt: '' };
    const b: StApp = { guid: 'b', name: 'b-app', state: 'STARTED', cnsiGuid: 'cf-2', spaceGuid: 'sp-2', instances: 1, createdAt: '', updatedAt: '' };
    // Flush the initial effect so the filter predicate is installed.
    TestBed.tick();
    const pred = svc.filter();
    expect(pred(a)).toBe(true);
    expect(pred(b)).toBe(true);
    svc.selectedCnsi.set('cf-1');
    TestBed.tick();
    const pred2 = svc.filter();
    expect(pred2(a)).toBe(true);
    expect(pred2(b)).toBe(false);
  });

  it('nameFilter is applied as a case-insensitive substring match', () => {
    const http = makeHttp();
    const svc = makeSvc(http);
    const foo: StApp = { guid: 'a', name: 'FooBar', state: 'STARTED', cnsiGuid: 'cf-1', spaceGuid: 'sp-1', instances: 1, createdAt: '', updatedAt: '' };
    const baz: StApp = { guid: 'b', name: 'Baz', state: 'STARTED', cnsiGuid: 'cf-1', spaceGuid: 'sp-1', instances: 1, createdAt: '', updatedAt: '' };
    svc.nameFilter.set('foo');
    TestBed.tick();
    const pred = svc.filter();
    expect(pred(foo)).toBe(true);
    expect(pred(baz)).toBe(false);
  });

  it('exposes computed option signals for CF/org/space dropdowns', () => {
    const http = makeHttp();
    const svc = makeSvc(http);
    expect(svc.cnsiOptions).toBeDefined();
    expect(svc.orgOptions).toBeDefined();
    expect(svc.spaceOptions).toBeDefined();
    // Before initialize(), the orchestrator is unset but options should still
    // resolve (to at least the "All" placeholder).
    expect(svc.orgOptions()[0]).toEqual({ label: 'All', value: null });
    expect(svc.spaceOptions()[0]).toEqual({ label: 'All', value: null });
  });

  it('clearFilters resets all four filter signals and pageIndex', () => {
    const http = makeHttp();
    const svc = makeSvc(http);
    svc.selectedCnsi.set('cf-1');
    svc.selectedOrg.set('org-1');
    svc.selectedSpace.set('space-1');
    svc.nameFilter.set('foo');
    svc.pageIndex.set(4);
    svc.clearFilters();
    expect(svc.selectedCnsi()).toBeNull();
    expect(svc.selectedOrg()).toBeNull();
    expect(svc.selectedSpace()).toBeNull();
    expect(svc.nameFilter()).toBe('');
    expect(svc.pageIndex()).toBe(0);
  });

  it('does not clear stale selections before the first orchestrator load completes', () => {
    const http = makeHttp();
    const cf = makeStubCfService([{ guid: 'cf-1', name: 'Primary CF' }]);
    const svc = makeSvc(http, cf);
    // Set a selection whose value is NOT in cnsiOptions yet. The guard
    // should keep the stale selection until loadAll finishes, so we can
    // preserve filters across route re-entry before data loads.
    svc.selectedCnsi.set('cf-gone');
    TestBed.tick();
    expect(svc.selectedCnsi()).toBe('cf-gone');
  });

  it('clears a stale selection once the orchestrator has loaded and the value is gone', async () => {
    const http = makeHttp();
    const cf = makeStubCfService([{ guid: 'cf-1', name: 'Primary CF' }]);
    const svc = makeSvc(http, cf);
    svc.initialize(['cf-1']);
    svc.selectedCnsi.set('cf-gone');
    TestBed.tick();
    expect(svc.selectedCnsi()).toBe('cf-gone');
    await svc.loadAll();
    TestBed.tick();
    // cf-gone isn't in cnsiOptions (which has cf-1 + "All"), so the
    // post-load effect clears it to null.
    expect(svc.selectedCnsi()).toBeNull();
  });

  it('preserves a valid selection across the first orchestrator load', async () => {
    const http = makeHttp();
    const cf = makeStubCfService([{ guid: 'cf-1', name: 'Primary CF' }]);
    const svc = makeSvc(http, cf);
    svc.initialize(['cf-1']);
    svc.selectedCnsi.set('cf-1');
    TestBed.tick();
    await svc.loadAll();
    TestBed.tick();
    expect(svc.selectedCnsi()).toBe('cf-1');
  });

  it('fetchAppRoutes hits the native routes endpoint and returns the resources array', async () => {
    const expectedUrl = '/pp/v1/cf/apps/cnsi-1/app-1/routes';
    const httpMock = {
      get: vi.fn((url: string) => {
        if (url === expectedUrl) {
          return of({
            resources: [
              { guid: 'r-1', url: 'a.example.com', host: 'a', path: '', domainGuid: 'd', spaceGuid: 's', createdAt: '', updatedAt: '' },
              { guid: 'r-2', url: 'b.example.com', host: 'b', path: '', domainGuid: 'd', spaceGuid: 's', createdAt: '', updatedAt: '' },
            ],
            totalResults: 2,
          });
        }
        return of({ resources: [], pagination: {} });
      }),
    } as unknown as HttpClient;
    const svc = makeSvc(httpMock);
    const routes = await svc.fetchAppRoutes('cnsi-1', 'app-1');
    expect(routes.length).toBe(2);
    expect(routes[0].guid).toBe('r-1');
    expect(httpMock.get).toHaveBeenCalledWith(expectedUrl);
  });

  it('fetchAppServiceBindings hits the native service_bindings endpoint', async () => {
    const expectedUrl = '/pp/v1/cf/apps/cnsi-1/app-1/service_bindings';
    const httpMock = {
      get: vi.fn((url: string) => {
        if (url === expectedUrl) {
          return of({
            resources: [
              { guid: 'b-1', name: 'x', bindingType: 'app', serviceInstanceGuid: 'si-1', serviceInstanceName: 'db', serviceInstanceType: 'managed', createdAt: '', updatedAt: '' },
            ],
            totalResults: 1,
          });
        }
        return of({ resources: [], pagination: {} });
      }),
    } as unknown as HttpClient;
    const svc = makeSvc(httpMock);
    const bindings = await svc.fetchAppServiceBindings('cnsi-1', 'app-1');
    expect(bindings.length).toBe(1);
    expect(bindings[0].serviceInstanceName).toBe('db');
    expect(httpMock.get).toHaveBeenCalledWith(expectedUrl);
  });

  it('fetchAppServiceBindings returns [] when the endpoint errors', async () => {
    const httpMock = {
      get: vi.fn(() => throwError(() => new Error('boom'))),
    } as unknown as HttpClient;
    const svc = makeSvc(httpMock);
    const bindings = await svc.fetchAppServiceBindings('cnsi-1', 'app-1');
    expect(bindings).toEqual([]);
  });

  it('deleteServiceBinding routes through writeWithJob against /pp/v1/cf/service_bindings/{cnsi}/{binding}', async () => {
    const httpMock = {
      delete: vi.fn(() => of(new HttpResponse<unknown>({
        status: 200,
        body: { result: { operation: 'service_credential_binding.delete' }, state: 'COMPLETE' },
      }))),
    } as unknown as HttpClient;
    const svc = makeSvc(httpMock);
    await svc.deleteServiceBinding('cnsi-1', 'binding-1');
    expect(httpMock.delete).toHaveBeenCalledWith('/pp/v1/cf/service_bindings/cnsi-1/binding-1', expect.objectContaining({ observe: 'response' }));
  });

  it('deleteRoute routes through writeWithJob against /pp/v1/cf/routes/{cnsi}/{route}', async () => {
    const httpMock = {
      delete: vi.fn(() => of(new HttpResponse<unknown>({
        status: 200,
        body: { result: { jobGuid: 'j-1', operation: 'route.delete' }, state: 'COMPLETE' },
      }))),
    } as unknown as HttpClient;
    const svc = makeSvc(httpMock);
    await svc.deleteRoute('cnsi-1', 'route-1');
    expect(httpMock.delete).toHaveBeenCalledWith('/pp/v1/cf/routes/cnsi-1/route-1', expect.objectContaining({ observe: 'response' }));
  });

  it('fetchAppRoutes returns [] when the endpoint fails rather than throwing', async () => {
    const httpMock = {
      get: vi.fn(() => throwError(() => new Error('boom'))),
    } as unknown as HttpClient;
    const svc = makeSvc(httpMock);
    const routes = await svc.fetchAppRoutes('cnsi-1', 'app-1');
    expect(routes).toEqual([]);
  });

  it('cnsiOptions picks up connected CF endpoints from CloudFoundryService', () => {
    const http = makeHttp();
    const cf = makeStubCfService([
      { guid: 'cf-1', name: 'Primary CF' },
      { guid: 'cf-2', name: 'Secondary CF' },
    ]);
    const svc = makeSvc(http, cf);
    const opts = svc.cnsiOptions();
    expect(opts[0]).toEqual({ label: 'All', value: null });
    expect(opts).toContainEqual({ label: 'Primary CF', value: 'cf-1' });
    expect(opts).toContainEqual({ label: 'Secondary CF', value: 'cf-2' });
  });
});
