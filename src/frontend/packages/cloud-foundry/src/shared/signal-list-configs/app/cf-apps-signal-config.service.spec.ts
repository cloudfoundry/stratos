import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { CfAppsSignalConfigService } from './cf-apps-signal-config.service';
import { CloudFoundryService } from '../../data-services/cloud-foundry.service';
import type { StApp } from '../../../services/endpoint-data/stratos-types';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { EndpointDataService } from '../../../services/endpoint-data/endpoint-data.service';

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

  it('seeds sources from the EndpointDataService cache when apps were drained earlier', async () => {
    // The home card / endpoint detail page drains EndpointDataService.apps()
    // before the user reaches the per-CF Apps tab. Without seeding, mounting
    // the tab discards that cache and shows a spinner while it re-fetches.
    // Seed-on-construct lets the tab open populated; an explicit refresh()
    // (via orchestrator.refresh) still falls through to the HTTP drain.
    const http = makeHttp();
    const a: StApp = { guid: 'a', name: 'cached-app', state: 'STARTED', cnsiGuid: 'cf-1', spaceGuid: 'sp-1', instances: 1, routes: [], createdAt: '', updatedAt: '' };
    const eds = new EndpointDataService(http, { write: () => {}, read: () => undefined } as never, 'cf-1');
    // Drive the EDS state the way loadApps() does on success: full apps
    // array + non-null appsLastFetched. Use the public mutators to avoid
    // touching internal signals from the test.
    eds.addApp(a);
    (eds as unknown as { _appsLastFetched: { set: (d: Date) => void } })._appsLastFetched.set(new Date());

    const registry = { acquire: vi.fn(() => eds) } as unknown as EndpointDataRegistry;
    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: http },
        { provide: CloudFoundryService, useValue: makeStubCfService() },
        { provide: EndpointDataRegistry, useValue: registry },
        CfAppsSignalConfigService,
      ],
    });
    const svc = TestBed.inject(CfAppsSignalConfigService);
    svc.initialize(['cf-1']);
    // loadAll() short-circuits because preSeed flipped the source's
    // _preseeded flag; the HTTP stub never sees a request.
    await svc.loadAll();
    expect(svc.orchestrator.allItems()).toEqual([a]);
    expect(http.get).not.toHaveBeenCalled();
  });

  it('does not seed sources when EndpointDataService has not drained apps yet', async () => {
    const http = makeHttp();
    const eds = new EndpointDataService(http, { write: () => {}, read: () => undefined } as never, 'cf-1');
    // No addApp / no appsLastFetched mutation — appsLastFetched stays null.

    const registry = { acquire: vi.fn(() => eds) } as unknown as EndpointDataRegistry;
    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: http },
        { provide: CloudFoundryService, useValue: makeStubCfService() },
        { provide: EndpointDataRegistry, useValue: registry },
        CfAppsSignalConfigService,
      ],
    });
    const svc = TestBed.inject(CfAppsSignalConfigService);
    svc.initialize(['cf-1']);
    await svc.loadAll();
    // Page 1 fetched via the normal load() path.
    expect(http.get).toHaveBeenCalled();
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
    const a: StApp = { guid: 'a', name: 'a-app', state: 'STARTED', cnsiGuid: 'cf-1', spaceGuid: 'sp-1', instances: 1, routes: [], createdAt: '', updatedAt: '' };
    const b: StApp = { guid: 'b', name: 'b-app', state: 'STARTED', cnsiGuid: 'cf-2', spaceGuid: 'sp-2', instances: 1, routes: [], createdAt: '', updatedAt: '' };
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
    const foo: StApp = { guid: 'a', name: 'FooBar', state: 'STARTED', cnsiGuid: 'cf-1', spaceGuid: 'sp-1', instances: 1, routes: [], createdAt: '', updatedAt: '' };
    const baz: StApp = { guid: 'b', name: 'Baz', state: 'STARTED', cnsiGuid: 'cf-1', spaceGuid: 'sp-1', instances: 1, routes: [], createdAt: '', updatedAt: '' };
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

  it('lists orgs from the per-CF catalog even when they contain zero loaded apps', async () => {
    // Regression (dev.58 smoke test): the user filtered apps by org=e2e,
    // deleted the only app in e2e, and returned to the app-wall. orgOptions
    // was derived from the loaded apps list, so e2e dropped out of the
    // dropdown, the stale-selection effect cleared selectedOrg to null, and
    // the filter defaulted back to All. Fix: orgOptions now reads from the
    // per-CF /pp/v1/cf/orgs catalog so the org is listed as long as it
    // exists in the CF — the resulting empty app list is the visual cue.
    const httpMock = {
      get: vi.fn((url: string) => {
        // Match by path prefix so the `?per_page=…&page=1` bounded-paging
        // suffix (added to avoid the unbounded-drain 504s) doesn't break
        // these regression mocks.
        if (url.startsWith('/pp/v1/cf/orgs/cnsi-1')) {
          return of({
            resources: [
              { guid: 'org-1', name: 'system', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', cnsiGuid: 'cnsi-1' },
              { guid: 'org-e2e', name: 'e2e', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', cnsiGuid: 'cnsi-1' },
            ],
          });
        }
        if (url.startsWith('/pp/v1/cf/spaces/cnsi-1')) {
          return of({
            resources: [
              { guid: 'space-e2e', name: 'e2e', orgGuid: 'org-e2e', createdAt: '', updatedAt: '', cnsiGuid: 'cnsi-1' },
              { guid: 'space-sys', name: 'system', orgGuid: 'org-1', createdAt: '', updatedAt: '', cnsiGuid: 'cnsi-1' },
            ],
          });
        }
        return of({
          resources: [],
          pagination: { totalResults: 0, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } },
        });
      }),
    } as unknown as HttpClient;
    const cf = makeStubCfService([{ guid: 'cnsi-1', name: 'Primary CF' }]);
    const svc = makeSvc(httpMock, cf);
    svc.initialize(['cnsi-1']);
    // Group C made loadNames lazy — explicitly trigger the catalog fetch
    // the way the filter-dropdown onOpen hook now does in real use.
    void svc.ensureNamesLoaded(['cnsi-1']);
    await svc.loadAll();
    await Promise.resolve();
    await Promise.resolve();
    TestBed.tick();

    const orgLabels = svc.orgOptions().map(o => o.label);
    expect(orgLabels).toContain('system');
    expect(orgLabels).toContain('e2e');

    // Setting the selection to a zero-app org must survive the stale-
    // selection effect.
    svc.selectedCnsi.set('cnsi-1');
    svc.selectedOrg.set('org-e2e');
    TestBed.tick();
    expect(svc.selectedOrg()).toBe('org-e2e');
    expect(svc.spaceOptions().map(o => o.label)).toContain('e2e');
  });

  it('disambiguates same-named spaces across orgs as "<space> - <org>" when no org is selected', async () => {
    // space_1 exists in both org_a and org_b. With Org = All a bare-name
    // list would render two identical "space_1" rows, so the dropdown must
    // append the org name to tell them apart (parity with the Routes /
    // Services / Users tabs). Selecting an org fixes the scope, so the
    // label collapses back to the bare space name.
    const httpMock = {
      get: vi.fn((url: string) => {
        if (url.startsWith('/pp/v1/cf/orgs/cnsi-1')) {
          return of({
            resources: [
              { guid: 'org-a', name: 'org_a', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', cnsiGuid: 'cnsi-1' },
              { guid: 'org-b', name: 'org_b', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', cnsiGuid: 'cnsi-1' },
            ],
          });
        }
        if (url.startsWith('/pp/v1/cf/spaces/cnsi-1')) {
          return of({
            resources: [
              { guid: 'space-1a', name: 'space_1', orgGuid: 'org-a', createdAt: '', updatedAt: '', cnsiGuid: 'cnsi-1' },
              { guid: 'space-1b', name: 'space_1', orgGuid: 'org-b', createdAt: '', updatedAt: '', cnsiGuid: 'cnsi-1' },
            ],
          });
        }
        return of({
          resources: [],
          pagination: { totalResults: 0, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } },
        });
      }),
    } as unknown as HttpClient;
    const cf = makeStubCfService([{ guid: 'cnsi-1', name: 'Primary CF' }]);
    const svc = makeSvc(httpMock, cf);
    svc.selectedCnsi.set('cnsi-1');
    svc.initialize(['cnsi-1']);
    // Await the catalog drain directly (orgs + priority spaces chunk) rather
    // than counting microtasks.
    await svc.ensureNamesLoaded(['cnsi-1']);
    TestBed.tick();

    // Org = All → disambiguated, sorted by space name then org name.
    expect(svc.spaceOptions().map(o => o.label)).toEqual(['All', 'space_1 - org_a', 'space_1 - org_b']);

    // Org selected → bare space name (the org is already fixed).
    svc.selectedOrg.set('org-a');
    TestBed.tick();
    expect(svc.spaceOptions().map(o => o.label)).toEqual(['All', 'space_1']);
  });

  it('preserves a valid selection across navigation (re-initialize)', async () => {
    // Regression: the singleton service's _hasLoadedOnce was latching true
    // forever after the first load. On re-navigation, a fresh initialize()
    // produced a momentarily-empty orchestrator, the post-load effect ran
    // immediately against empty option lists, and it cleared the user's
    // still-valid selection to null — losing the filter across routes.
    //
    // Fix: initialize() resets _hasLoadedOnce to false so the effect is
    // gated off until loadAll() completes and options reflect real data.
    const http = makeHttp();
    const cf = makeStubCfService([{ guid: 'cf-1', name: 'Primary CF' }]);
    const svc = makeSvc(http, cf);
    svc.initialize(['cf-1']);
    svc.selectedCnsi.set('cf-1');
    await svc.loadAll();
    TestBed.tick();
    expect(svc.selectedCnsi()).toBe('cf-1');

    // Simulate returning to the app-wall — ngOnInit calls initialize()
    // again with the same CF guids. Selection should survive the reload.
    svc.initialize(['cf-1']);
    TestBed.tick();
    expect(svc.selectedCnsi()).toBe('cf-1');
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

  it('fetchAppServiceBindings hits the native service_bindings endpoint with ?return=summary', async () => {
    const expectedUrl = '/pp/v1/cf/apps/cnsi-1/app-1/service_bindings?return=summary';
    const httpMock = {
      get: vi.fn((url: string) => {
        if (url === expectedUrl) {
          return of({
            resources: [
              {
                guid: 'b-1', cnsiGuid: 'cnsi-1', name: 'x', type: 'app',
                serviceInstance: { guid: 'si-1', name: 'db', type: 'managed' },
                app: { guid: 'app-1' },
                createdAt: '', updatedAt: '',
              },
            ],
            pagination: { totalResults: 1, totalPages: 1, first: null, last: null, next: null, previous: null },
          });
        }
        return of({ resources: [], pagination: {} });
      }),
    } as unknown as HttpClient;
    const svc = makeSvc(httpMock);
    const bindings = await svc.fetchAppServiceBindings('cnsi-1', 'app-1');
    expect(bindings.length).toBe(1);
    expect(bindings[0].serviceInstance.name).toBe('db');
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
      get: makeHttp().get,
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
      get: makeHttp().get,
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

  it('refreshStatsForKeys dedupes in-flight requests per key', () => {
    // Regression: burst signal updates during initial render fired
    // app-stats 4× per (cnsi,app). On slow CFs this multiplied the
    // load proportional to row count. The fix tracks in-flight keys
    // and skips duplicates until the request completes.
    const subject = new Subject<{ instances: Array<{ state?: string }> }>();
    const httpMock = {
      get: vi.fn(() => subject.asObservable()),
    } as unknown as HttpClient;
    const svc = makeSvc(httpMock);
    const keys = ['cnsi-1:app-1'];

    // Three rapid calls for the same key while the first is in flight.
    (svc as any).refreshStatsForKeys(keys);
    (svc as any).refreshStatsForKeys(keys);
    (svc as any).refreshStatsForKeys(keys);

    expect(httpMock.get).toHaveBeenCalledTimes(1);

    // After the first completes, a fresh refresh CAN issue another call.
    subject.next({ instances: [] });
    subject.complete();
    (svc as any).refreshStatsForKeys(keys);
    expect(httpMock.get).toHaveBeenCalledTimes(2);
  });

  it('startStatsPolling does not stack a reactive effect on re-entry', () => {
    // Regression: this service is a root singleton, and the app-wall calls
    // startStatsPolling() from ngOnInit on every mount. The reactive stats
    // effect used to be created uncaptured, so each navigation left a live
    // effect on the root injector — N visits meant N refreshes per page
    // change, multiplying app-stats traffic across a session. The fix
    // captures the EffectRef and destroys the prior one on re-entry.
    const http = makeHttp();
    const cf = makeStubCfService([{ guid: 'cnsi-1', name: 'Primary CF' }]);
    const svc = makeSvc(http, cf);
    svc.initialize(['cnsi-1']);
    seedApps(svc, [{
      guid: 'a', name: 'a-app', state: 'STARTED', cnsiGuid: 'cnsi-1',
      spaceGuid: 'sp-1', instances: 1, routes: [], createdAt: '', updatedAt: '',
    } as StApp]);
    TestBed.tick();

    // Simulate two mounts of the app-wall (route re-entry).
    svc.startStatsPolling();
    svc.startStatsPolling();
    TestBed.tick();

    // Count only refreshes driven by the reactive effect on a pagedItems
    // change — isolate from the synchronous runOnce()/interval legs.
    const refresh = vi.spyOn(svc as any, 'refreshStatsForKeys');
    seedApps(svc, [{
      guid: 'b', name: 'b-app', state: 'STARTED', cnsiGuid: 'cnsi-1',
      spaceGuid: 'sp-1', instances: 1, routes: [], createdAt: '', updatedAt: '',
    } as StApp]);
    TestBed.tick();

    // Exactly one live effect → one reactive refresh. Without the fix the
    // two stacked effects would each fire, yielding 2.
    expect(refresh).toHaveBeenCalledTimes(1);
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

  // --- Visible-row resolver (slice 2 step 10 #4) ----------------------
  // The resolver fills in space/org names for rows whose guid fell
  // outside the bounded /pp/v1/cf/orgs|spaces?per_page=500&page=1
  // catalog page (the original "—" bug for spaces beyond #500).

  // Seeds the merge-orchestrator's first source with the given apps so
  // view.pagedItems() has rows the resolver can iterate. Bypasses the
  // private `_items` signal — same approach used in the merge-orchestrator
  // spec to drive the pipeline without going through CnsiAppsSource.load().
  function seedApps(svc: CfAppsSignalConfigService, apps: StApp[]) {
    const src = svc.orchestrator.sources[0] as unknown as { _items: { set: (v: StApp[]) => void } };
    src._items.set(apps);
  }

  it('resolver fetches space names for visible-row guids that are NOT in the catalog', async () => {
    // Catalog (per_page=500&page=1) returns NO spaces — simulating the
    // overflow case where the visible row's space lives beyond page 1.
    // Resolver hits the same URL with `?guids=...` and gets the missing name.
    // Orgs are NOT resolved client-side any more: every StApp row carries
    // OrgName from the server-side space→org join in Jetstream.
    const httpMock = {
      get: vi.fn((url: string) => {
        if (url.startsWith('/pp/v1/cf/spaces/cnsi-1?guids=space-overflow')) {
          return of({
            resources: [
              { guid: 'space-overflow', name: 'overflow-space', orgGuid: 'org-1', cnsiGuid: 'cnsi-1' },
            ],
          });
        }
        // Catalog fetches return empty (overflow case).
        return of({ resources: [], pagination: {} });
      }),
    } as unknown as HttpClient;
    const cf = makeStubCfService([{ guid: 'cnsi-1', name: 'Primary CF' }]);
    const svc = makeSvc(httpMock, cf);
    svc.initialize(['cnsi-1']);
    seedApps(svc, [{
      guid: 'a', name: 'a-app', state: 'STARTED', cnsiGuid: 'cnsi-1',
      orgGuid: 'org-overflow', spaceGuid: 'space-overflow',
      instances: 1, routes: [], createdAt: '', updatedAt: '',
    } as StApp]);
    TestBed.tick();
    // Allow the async resolver chain to drain.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    TestBed.tick();

    expect(svc.spaceNames().get('space-overflow')).toBe('overflow-space');
  });

  it('resolver does NOT re-fetch guids already in the catalog', async () => {
    const calls: string[] = [];
    const httpMock = {
      get: vi.fn((url: string) => {
        calls.push(url);
        // The org-batched spaces drain is the new catalog source — answer
        // its `?organization_guids=...` request with the known space so
        // the visible-row resolver finds it pre-populated and skips its
        // own `?guids=...` lookup.
        if (url.startsWith('/pp/v1/cf/spaces/cnsi-1?organization_guids=')) {
          return of({
            resources: [
              { guid: 'space-known', name: 'known', orgGuid: 'org-known', cnsiGuid: 'cnsi-1' },
            ],
            pagination: { next: null },
          });
        }
        if (url.startsWith('/pp/v1/cf/orgs/cnsi-1') && !/[?&]guids=/.test(url)) {
          return of({
            resources: [
              { guid: 'org-known', name: 'known-org', cnsiGuid: 'cnsi-1' },
            ],
          });
        }
        return of({ resources: [], pagination: {} });
      }),
    } as unknown as HttpClient;
    const cf = makeStubCfService([{ guid: 'cnsi-1', name: 'Primary CF' }]);
    const svc = makeSvc(httpMock, cf);
    svc.initialize(['cnsi-1']);
    void svc.ensureNamesLoaded(['cnsi-1']);
    // Wait for orgs catalog → org-batched spaces drain to populate the
    // catalog signals.
    for (let i = 0; i < 8; i++) { await Promise.resolve(); TestBed.tick(); }
    seedApps(svc, [{
      guid: 'a', name: 'a-app', state: 'STARTED', cnsiGuid: 'cnsi-1',
      orgGuid: 'org-known', spaceGuid: 'space-known',
      instances: 1, routes: [], createdAt: '', updatedAt: '',
    } as StApp]);
    TestBed.tick();
    for (let i = 0; i < 4; i++) { await Promise.resolve(); TestBed.tick(); }

    // The visible-row `?guids=...` resolver path must not have fired —
    // the catalog (orgs page-1 + org-batched spaces drain) already
    // resolved both names. Match exactly `?guids=` / `&guids=` to
    // exclude the `?organization_guids=` catalog drain.
    const resolverCalls = calls.filter(u => /[?&]guids=/.test(u));
    expect(resolverCalls).toEqual([]);
  });

  it('resolver dedupes concurrent triggers for the same guid', async () => {
    let spaceGuidCalls = 0;
    const httpMock = {
      get: vi.fn((url: string) => {
        if (url.includes('/pp/v1/cf/spaces/cnsi-1') && url.includes('guids=')) {
          spaceGuidCalls++;
          return of({
            resources: [
              { guid: 'space-x', name: 'x-space', orgGuid: 'o', cnsiGuid: 'cnsi-1' },
            ],
          });
        }
        return of({ resources: [], pagination: {} });
      }),
    } as unknown as HttpClient;
    const cf = makeStubCfService([{ guid: 'cnsi-1', name: 'Primary CF' }]);
    const svc = makeSvc(httpMock, cf);
    svc.initialize(['cnsi-1']);
    const row = {
      guid: 'a', name: 'a-app', state: 'STARTED', cnsiGuid: 'cnsi-1',
      orgGuid: 'o', spaceGuid: 'space-x',
      instances: 1, routes: [], createdAt: '', updatedAt: '',
    } as StApp;
    // Trigger the effect three times by re-seeding back-to-back.
    seedApps(svc, [row]);
    TestBed.tick();
    seedApps(svc, [row]);
    TestBed.tick();
    seedApps(svc, [row]);
    TestBed.tick();
    await Promise.resolve();
    await Promise.resolve();
    TestBed.tick();
    expect(spaceGuidCalls).toBe(1);
  });

  it('resolver issues no fetch when there are no visible rows', async () => {
    const httpMock = {
      get: vi.fn(() => of({ resources: [], pagination: {} })),
    } as unknown as HttpClient;
    const cf = makeStubCfService([{ guid: 'cnsi-1', name: 'Primary CF' }]);
    const svc = makeSvc(httpMock, cf);
    svc.initialize(['cnsi-1']);
    await Promise.resolve();
    await Promise.resolve();
    TestBed.tick();
    const guidCalls = (httpMock.get as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([u]) => typeof u === 'string' && u.includes('guids='),
    );
    expect(guidCalls.length).toBe(0);
  });

  it('resolver overlay merges into spaceNames; catalog wins on duplicates', async () => {
    // Catalog returns name "from-catalog" for space-dup. The resolver,
    // even if it ran, wouldn't fetch space-dup because it's already in
    // the catalog. Verify catalog name surfaces. Orgs are no longer
    // overlay-resolved client-side — the backend stitches OrgName onto
    // every StApp via space→org join.
    const httpMock = {
      get: vi.fn((url: string) => {
        // The bulk-catalog path is now the org-batched drain. Match both
        // the legacy `?per_page=...&page=1` shape (no longer issued) and
        // the new `?organization_guids=...` shape.
        if (url.startsWith('/pp/v1/cf/spaces/cnsi-1') && !/[?&]guids=/.test(url)) {
          return of({
            resources: [{ guid: 'space-dup', name: 'from-catalog', orgGuid: 'o', cnsiGuid: 'cnsi-1' }],
          });
        }
        if (url.startsWith('/pp/v1/cf/orgs/cnsi-1') && !/[?&]guids=/.test(url)) {
          return of({
            resources: [{ guid: 'o', name: 'org-o', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', cnsiGuid: 'cnsi-1' }],
          });
        }
        return of({ resources: [], pagination: {} });
      }),
    } as unknown as HttpClient;
    const cf = makeStubCfService([{ guid: 'cnsi-1', name: 'Primary CF' }]);
    const svc = makeSvc(httpMock, cf);
    svc.initialize(['cnsi-1']);
    void svc.ensureNamesLoaded(['cnsi-1']);
    for (let i = 0; i < 6; i++) { await Promise.resolve(); TestBed.tick(); }
    expect(svc.spaceNames().get('space-dup')).toBe('from-catalog');
  });

  // --- Org-batched space-name resolver (slice 2 step 10 #4) ---------
  // The original bulk fetch (`/pp/v1/cf/spaces/{cnsi}?per_page=500&page=1`)
  // missed any space beyond the first 500 → "—" in the App Wall column.
  // The new resolver fetches spaces in priority-ordered org chunks of
  // ORGS_PER_SPACES_CHUNK with SPACES_CHUNK_CONCURRENCY in flight per CF.

  function spacesResp(spaces: Array<{ guid: string; name: string; orgGuid?: string }>) {
    return of({
      resources: spaces.map(s => ({
        guid: s.guid, name: s.name, orgGuid: s.orgGuid ?? 'org-x', cnsiGuid: 'cnsi-1',
        createdAt: '', updatedAt: '',
      })),
      pagination: { totalResults: spaces.length, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } },
    });
  }

  it('priority orgs (those holding apps on the first ~2 pages) come first in the chunk order', async () => {
    // Build 30+ orgs so priority orgs visibly precede tail orgs in the
    // very first chunk. With chunk size 20, having 30 orgs splits into
    // [priority...tail-fillers, more-tail]; we assert the head of chunk-0
    // contains the priority orgs and tail orgs follow.
    const allOrgGuids = Array.from({ length: 30 }, (_, i) => `org-${String(i).padStart(2,'0')}`);
    // Visible apps reference orgs 25, 26, 27 — the LAST three by alphabetical
    // catalog order, so without priority ordering they'd land in chunk 1, not
    // chunk 0. With priority ordering they MUST appear at the head of chunk 0.
    const priorityOrgs = ['org-25', 'org-26', 'org-27'];
    const apps: StApp[] = priorityOrgs.flatMap(o =>
      Array.from({ length: 8 }, (_, i) => ({
        guid: `${o}-app-${i}`, name: `${o}-app-${i}`, state: 'STARTED', cnsiGuid: 'cnsi-1',
        orgGuid: o, spaceGuid: `${o}-sp-${i}`, instances: 1, routes: [], createdAt: '', updatedAt: '',
      } as StApp)),
    );

    const spacesUrls: string[] = [];
    let orgsResolveSubject: Subject<unknown> | null = null;
    const httpMock = {
      get: vi.fn((url: string) => {
        if (url.startsWith('/pp/v1/cf/orgs/cnsi-1')) {
          // Hold the orgs response open so the test can seed apps into the
          // orchestrator BEFORE loadNames computes the priority set. This
          // mirrors the realistic order: orgs catalog races the apps load,
          // and the apps load tends to win for slow CFs because /v3/orgs
          // is filtered by user-permission joins.
          orgsResolveSubject = new Subject<unknown>();
          return orgsResolveSubject.asObservable();
        }
        if (url.startsWith('/pp/v1/cf/spaces/cnsi-1?organization_guids=')) {
          spacesUrls.push(url);
          return spacesResp([]);
        }
        return of({ resources: [], pagination: { next: null } });
      }),
    } as unknown as HttpClient;
    const cf = makeStubCfService([{ guid: 'cnsi-1', name: 'Primary CF' }]);
    const svc = makeSvc(httpMock, cf);

    svc.initialize(['cnsi-1']);
    void svc.ensureNamesLoaded(['cnsi-1']);
    seedApps(svc, apps);
    // Now release the orgs catalog so loadNames computes priority + drains.
    expect(orgsResolveSubject).not.toBeNull();
    orgsResolveSubject!.next({
      resources: allOrgGuids.map(g => ({ guid: g, name: g, status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', cnsiGuid: 'cnsi-1' })),
    });
    orgsResolveSubject!.complete();
    for (let i = 0; i < 8; i++) { await Promise.resolve(); TestBed.tick(); }

    expect(spacesUrls.length).toBeGreaterThan(0);
    const firstChunk = spacesUrls[0].match(/organization_guids=([^&]+)/)![1].split(',');
    // Chunk size 20: priority head (3) + tail fillers (17) = 20.
    expect(firstChunk.length).toBe(20);
    // Priority orgs must occupy the head of chunk 0.
    expect(firstChunk.slice(0, 3).sort()).toEqual([...priorityOrgs].sort());
  });

  it('chunks remaining orgs into ORGS_PER_SPACES_CHUNK groups after the priority chunk', async () => {
    // 45 orgs, no visible apps (priority set empty) → all orgs are tail
    // → expect ceil(45/20) = 3 chunks total, all of size ≤ 20.
    const orgList = Array.from({ length: 45 }, (_, i) => `org-${String(i).padStart(2,'0')}`);
    const spacesUrls: string[] = [];
    const httpMock = {
      get: vi.fn((url: string) => {
        if (url.startsWith('/pp/v1/cf/orgs/cnsi-1')) {
          return of({
            resources: orgList.map(g => ({ guid: g, name: g, status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', cnsiGuid: 'cnsi-1' })),
          });
        }
        if (url.startsWith('/pp/v1/cf/spaces/cnsi-1?organization_guids=')) {
          spacesUrls.push(url);
          return spacesResp([]);
        }
        return of({ resources: [], pagination: { next: null } });
      }),
    } as unknown as HttpClient;
    const cf = makeStubCfService([{ guid: 'cnsi-1', name: 'Primary CF' }]);
    const svc = makeSvc(httpMock, cf);
    svc.initialize(['cnsi-1']);
    void svc.ensureNamesLoaded(['cnsi-1']);
    for (let i = 0; i < 12; i++) { await Promise.resolve(); TestBed.tick(); }

    expect(spacesUrls.length).toBe(3);
    for (const u of spacesUrls) {
      const guids = u.match(/organization_guids=([^&]+)/)![1].split(',');
      expect(guids.length).toBeLessThanOrEqual(20);
    }
  });

  it('caps concurrent in-flight chunks at SPACES_CHUNK_CONCURRENCY per CNSI', async () => {
    // 9 chunks (180 orgs) — 1 priority + 8 remaining → with cap 3 only
    // 3 should be in flight at any given moment after the priority lands.
    const orgList = Array.from({ length: 180 }, (_, i) => `o${String(i).padStart(3,'0')}`);
    let inFlight = 0;
    let peakInFlight = 0;
    let priorityResolved = false;
    const subjects: Array<Subject<unknown>> = [];
    const httpMock = {
      get: vi.fn((url: string) => {
        if (url.startsWith('/pp/v1/cf/orgs/cnsi-1')) {
          return of({
            resources: orgList.map(g => ({ guid: g, name: g, status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', cnsiGuid: 'cnsi-1' })),
          });
        }
        if (url.startsWith('/pp/v1/cf/spaces/cnsi-1?organization_guids=')) {
          inFlight++;
          if (priorityResolved) peakInFlight = Math.max(peakInFlight, inFlight);
          const subj = new Subject<unknown>();
          subjects.push(subj);
          return subj.asObservable();
        }
        return of({ resources: [], pagination: { next: null } });
      }),
    } as unknown as HttpClient;
    const cf = makeStubCfService([{ guid: 'cnsi-1', name: 'Primary CF' }]);
    const svc = makeSvc(httpMock, cf);
    svc.initialize(['cnsi-1']);
    void svc.ensureNamesLoaded(['cnsi-1']);
    // Drain microtasks until the priority chunk request is open.
    for (let i = 0; i < 6; i++) { await Promise.resolve(); TestBed.tick(); }
    expect(subjects.length).toBe(1); // only priority is in flight before resolution

    // Resolve the priority request → background workers spin up (cap 3).
    subjects[0].next({ resources: [], pagination: { next: null } });
    subjects[0].complete();
    inFlight--;
    priorityResolved = true;
    for (let i = 0; i < 6; i++) { await Promise.resolve(); TestBed.tick(); }
    // 3 background workers should now each be in flight on a chunk.
    expect(peakInFlight).toBeLessThanOrEqual(3);
    expect(subjects.length - 1).toBeLessThanOrEqual(3);

    // Drain the rest so vitest doesn't hang on dangling subscriptions.
    for (let i = 1; i < subjects.length; i++) {
      subjects[i].next({ resources: [], pagination: { next: null } });
      subjects[i].complete();
    }
  });

  it('reentrancy: a second initialize() while drains are in flight skips merging stale chunks', async () => {
    const subjects: Array<Subject<unknown>> = [];
    const httpMock = {
      get: vi.fn((url: string) => {
        if (url.startsWith('/pp/v1/cf/orgs/cnsi-1')) {
          return of({
            resources: [{ guid: 'org-stale', name: 'stale', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', cnsiGuid: 'cnsi-1' }],
          });
        }
        if (url.startsWith('/pp/v1/cf/spaces/cnsi-1?organization_guids=')) {
          const subj = new Subject<unknown>();
          subjects.push(subj);
          return subj.asObservable();
        }
        return of({ resources: [], pagination: { next: null } });
      }),
    } as unknown as HttpClient;
    const cf = makeStubCfService([{ guid: 'cnsi-1', name: 'Primary CF' }]);
    const svc = makeSvc(httpMock, cf);
    svc.initialize(['cnsi-1']);
    void svc.ensureNamesLoaded(['cnsi-1']);
    for (let i = 0; i < 4; i++) { await Promise.resolve(); TestBed.tick(); }
    expect(subjects.length).toBe(1);

    // Second initialize() bumps the generation; the still-pending gen-1
    // chunk must NOT merge into _spacesByCnsi when it eventually resolves.
    svc.initialize(['cnsi-1']);
    void svc.ensureNamesLoaded(['cnsi-1']);
    for (let i = 0; i < 4; i++) { await Promise.resolve(); TestBed.tick(); }

    // Resolve the stale request with a space that would otherwise leak in.
    subjects[0].next({
      resources: [{ guid: 'space-stale', name: 'stale-space', orgGuid: 'org-stale', cnsiGuid: 'cnsi-1' }],
      pagination: { next: null },
    });
    subjects[0].complete();
    for (let i = 0; i < 4; i++) { await Promise.resolve(); TestBed.tick(); }

    // Stale chunk's merge was skipped — the new generation's _spacesByCnsi
    // does not contain space-stale.
    expect(svc.spaceNames().get('space-stale')).toBeUndefined();
  });
});
