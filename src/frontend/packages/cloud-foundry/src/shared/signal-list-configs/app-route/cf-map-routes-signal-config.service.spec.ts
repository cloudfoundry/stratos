import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CfMapRoutesSignalConfigService } from './cf-map-routes-signal-config.service';
import { AppDetailDataService } from '../../../features/applications/app-detail-data.service';
import { ApplicationService } from '../../../features/applications/application.service';
import { AppNameResolverService } from '../../services/app-name-resolver.service';
import type { StRoute, StRoutesResponse } from '../../../services/endpoint-data/stratos-types';

// Minimal StRoute factory.
function makeRoute(overrides: Partial<StRoute> = {}): StRoute {
  return {
    guid: 'route-1',
    url: 'my-app.example.com/path',
    host: 'my-app',
    path: '/path',
    domainGuid: 'domain-1',
    spaceGuid: 'space-1',
    cnsiGuid: 'cnsi-1',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    ...overrides,
  };
}

// Stub data service: a writable routes() signal + appDetail() signal +
// public cnsiGuid/appGuid. Mirrors the slice-3 stub shape.
function makeDataServiceStub(opts: {
  attachedRoutes?: StRoute[];
  spaceGuid?: string;
  cnsiGuid?: string;
} = {}) {
  const routes = signal<StRoute[] | null>(opts.attachedRoutes ?? []);
  const appDetail = signal<{ app: { spaceGuid: string } } | undefined>(
    opts.spaceGuid ? { app: { spaceGuid: opts.spaceGuid } } : undefined,
  );
  return {
    cnsiGuid: opts.cnsiGuid ?? 'cnsi-1',
    appGuid: 'app-1',
    routes,
    appDetail,
  };
}

// Stub application service — only cfGuid + appGuid are read by the config.
function makeAppServiceStub() {
  return { cfGuid: 'cnsi-1', appGuid: 'app-1' };
}

// Stub app-name resolver matching the slice-3 spec shape.
function makeAppNamesStub() {
  const map = signal<Map<string, string>>(new Map());
  return {
    resolveMany: vi.fn((_cnsi: string, _guids: readonly string[]) => map),
    resolve: vi.fn(),
    seed: (entries: Record<string, string>) => {
      const next = new Map<string, string>();
      for (const [k, v] of Object.entries(entries)) next.set(k, v);
      map.set(next);
    },
  };
}

interface Stubs {
  data: ReturnType<typeof makeDataServiceStub>;
  app: ReturnType<typeof makeAppServiceStub>;
  appNames: ReturnType<typeof makeAppNamesStub>;
}

function configure(stubs?: Partial<Stubs>): {
  svc: CfMapRoutesSignalConfigService;
  data: ReturnType<typeof makeDataServiceStub>;
  app: ReturnType<typeof makeAppServiceStub>;
  appNames: ReturnType<typeof makeAppNamesStub>;
  ctrl: HttpTestingController;
} {
  TestBed.resetTestingModule();
  const data = stubs?.data ?? makeDataServiceStub({ spaceGuid: 'space-1' });
  const app = stubs?.app ?? makeAppServiceStub();
  const appNames = stubs?.appNames ?? makeAppNamesStub();

  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      CfMapRoutesSignalConfigService,
      { provide: AppDetailDataService, useValue: data },
      { provide: ApplicationService, useValue: app },
      { provide: AppNameResolverService, useValue: appNames },
    ],
  });
  const svc = TestBed.inject(CfMapRoutesSignalConfigService);
  const ctrl = TestBed.inject(HttpTestingController);
  return { svc, data, app, appNames, ctrl };
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfMapRoutesSignalConfigService', () => {
  // ---------------------------------------------------------------------------
  // Construction
  // ---------------------------------------------------------------------------

  it('constructs without throwing', () => {
    expect(() => configure()).not.toThrow();
  });

  it('exposes filter, sort, pageSize, pageIndex, nameFilter, viewMode signals', () => {
    const { svc } = configure();
    expect(svc.filter).toBeDefined();
    expect(svc.sort).toBeDefined();
    expect(svc.pageSize).toBeDefined();
    expect(svc.pageIndex).toBeDefined();
    expect(svc.nameFilter).toBeDefined();
    expect(svc.viewMode).toBeDefined();
  });

  it('builds a ViewPipeline driven by the in-space drain', () => {
    const { svc } = configure();
    expect(svc.view).toBeDefined();
    TestBed.tick();
    expect(svc.view.pagedItems()).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // Columns — radio-leading shape
  // ---------------------------------------------------------------------------

  it('buildColumns returns radio + Host/Domain/Path/Port/AppsAttached (no actions)', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const keys = cols.map(c => c.key);
    expect(keys).toEqual(['radio', 'host', 'domain', 'path', 'port', 'apps']);
  });

  it('leading column is kind=radio with a radio binding', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    expect(cols[0].kind).toBe('radio');
    expect(cols[0].radio).toBeDefined();
    expect(typeof cols[0].radio!.isDisabled).toBe('function');
  });

  it('non-radio columns expose sortField for host, domain, path, port, apps', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const sortable = cols.filter(c => c.sortField != null).map(c => c.key);
    expect(sortable).toEqual(['host', 'domain', 'path', 'port', 'apps']);
  });

  it('does NOT include an actions column (no Unmap/Delete kebab on the picker)', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    expect(cols.find(c => c.key === 'actions')).toBeUndefined();
    expect(cols.find(c => c.kind === 'actions')).toBeUndefined();
  });

  it('Host column renders StRoute.host', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const hostCol = cols.find(c => c.key === 'host')!;
    expect(hostCol.render(makeRoute({ host: 'my-host' }))).toBe('my-host');
  });

  it('Domain column derives the domain segment from the URL', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const domainCol = cols.find(c => c.key === 'domain')!;
    expect(domainCol.render(makeRoute())).toBe('example.com');
  });

  it('Port column renders the port for TCP and "-" for HTTP', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const portCol = cols.find(c => c.key === 'port')!;
    expect(portCol.render(makeRoute({ port: 9000 }))).toBe('9000');
    expect(portCol.render(makeRoute({ port: undefined }))).toBe('-');
  });

  it('Apps Attached column is kind=compound with maxVisible=3', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const appsCol = cols.find(c => c.key === 'apps')!;
    expect(appsCol.kind).toBe('compound');
    expect(appsCol.maxVisible).toBe(3);
  });

  it('Apps Attached uses route.appGuids (no current-app fallback like slice 3)', () => {
    const { svc, appNames } = configure();
    appNames.seed({ 'a': 'App A', 'b': 'App B' });
    const cols = svc.buildColumns();
    const appsCol = cols.find(c => c.key === 'apps')!;
    const segments = appsCol.compound!(makeRoute({ appGuids: ['a', 'b'] }));
    expect(segments.map(s => s.text)).toEqual(['App A', 'App B']);
  });

  it('Apps Attached returns empty for routes with no appGuids on the picker payload', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const appsCol = cols.find(c => c.key === 'apps')!;
    expect(appsCol.compound!(makeRoute({ appGuids: undefined }))).toEqual([]);
    expect(appsCol.compound!(makeRoute({ appGuids: [] }))).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // Selection — selectedKey signal
  // ---------------------------------------------------------------------------

  it('selectedKey starts null', () => {
    const { svc } = configure();
    expect(svc.selectedKey()).toBeNull();
  });

  it('writing through the radio binding sets selectedKey to the row key', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const radioCol = cols[0];
    // The signal-list component writes into the column's radio.selectedKey
    // signal. The service exposes only a readonly view; both are backed by
    // the same WritableSignal.
    radioCol.radio!.selectedKey.set('route-42');
    expect(svc.selectedKey()).toBe('route-42');
  });

  it('selectedKey is a readonly view of the writable backing signal', () => {
    const { svc } = configure();
    // Public signal type narrows to Signal<string|null>; only the column
    // binding can write. Verify the read view reflects the write.
    const cols = svc.buildColumns();
    expect(svc.selectedKey()).toBeNull();
    cols[0].radio!.selectedKey.set('a');
    expect(svc.selectedKey()).toBe('a');
    cols[0].radio!.selectedKey.set(null);
    expect(svc.selectedKey()).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // isDisabled predicate — already-attached routes
  // ---------------------------------------------------------------------------

  it('isDisabled returns true for routes already attached to the current app', () => {
    const data = makeDataServiceStub({
      attachedRoutes: [makeRoute({ guid: 'attached-1' }), makeRoute({ guid: 'attached-2' })],
      spaceGuid: 'space-1',
    });
    const { svc } = configure({ data });
    const cols = svc.buildColumns();
    const radioCol = cols[0];
    expect(radioCol.radio!.isDisabled!(makeRoute({ guid: 'attached-1' }))).toBe(true);
    expect(radioCol.radio!.isDisabled!(makeRoute({ guid: 'attached-2' }))).toBe(true);
  });

  it('isDisabled returns false for routes not attached to the current app', () => {
    const data = makeDataServiceStub({
      attachedRoutes: [makeRoute({ guid: 'attached-1' })],
      spaceGuid: 'space-1',
    });
    const { svc } = configure({ data });
    const cols = svc.buildColumns();
    const radioCol = cols[0];
    expect(radioCol.radio!.isDisabled!(makeRoute({ guid: 'unattached-1' }))).toBe(false);
  });

  it('isDisabled reads dataService.routes() lazily — picks up concurrent attaches', () => {
    const data = makeDataServiceStub({
      attachedRoutes: [],
      spaceGuid: 'space-1',
    });
    const { svc } = configure({ data });
    const cols = svc.buildColumns();
    const radioCol = cols[0];
    // Initially nothing is attached — row is selectable.
    expect(radioCol.radio!.isDisabled!(makeRoute({ guid: 'r-99' }))).toBe(false);
    // Concurrent attach mutates the per-app routes catalog. The lazy
    // predicate sees the new state without a re-build of the column set.
    data.routes.set([makeRoute({ guid: 'r-99' })]);
    expect(radioCol.radio!.isDisabled!(makeRoute({ guid: 'r-99' }))).toBe(true);
  });

  it('isDisabled tolerates a null routes() catalog (pre-first-fetch)', () => {
    const data = makeDataServiceStub({ spaceGuid: 'space-1' });
    data.routes.set(null);
    const { svc } = configure({ data });
    const cols = svc.buildColumns();
    const radioCol = cols[0];
    expect(radioCol.radio!.isDisabled!(makeRoute({ guid: 'whatever' }))).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Drain — refresh() URL composition + response handling
  // ---------------------------------------------------------------------------

  it('refresh() drains routes from /pp/v1/cf/routes/{cnsi}?space_guids={spaceGuid}', async () => {
    const data = makeDataServiceStub({
      cnsiGuid: 'cnsi-XYZ',
      spaceGuid: 'space-ABC',
    });
    const { svc, ctrl } = configure({ data });
    const promise = svc.refresh();
    const req = ctrl.expectOne('/pp/v1/cf/routes/cnsi-XYZ?space_guids=space-ABC');
    expect(req.request.method).toBe('GET');
    req.flush({ resources: [makeRoute({ guid: 'r1' })], totalResults: 1 } satisfies StRoutesResponse);
    await promise;
    expect(svc.routes().length).toBe(1);
    expect(svc.routes()[0].guid).toBe('r1');
    ctrl.verify();
  });

  it('refresh() URL-encodes the spaceGuid', async () => {
    const data = makeDataServiceStub({
      cnsiGuid: 'cnsi-1',
      spaceGuid: 'space with/slash',
    });
    const { svc, ctrl } = configure({ data });
    const promise = svc.refresh();
    ctrl.expectOne('/pp/v1/cf/routes/cnsi-1?space_guids=space%20with%2Fslash')
      .flush({ resources: [], totalResults: 0 } satisfies StRoutesResponse);
    await promise;
    ctrl.verify();
  });

  it('refresh() is a no-op when appDetail() has not resolved yet (no spaceGuid)', async () => {
    const data = makeDataServiceStub({ cnsiGuid: 'cnsi-1' });
    // No spaceGuid → appDetail() returns undefined.
    const { svc, ctrl } = configure({ data });
    await svc.refresh();
    // No HTTP request fired.
    ctrl.verify();
    expect(svc.routes()).toEqual([]);
  });

  it('refresh() coalesces a missing resources field to []', async () => {
    const data = makeDataServiceStub({ cnsiGuid: 'cnsi-1', spaceGuid: 'space-1' });
    const { svc, ctrl } = configure({ data });
    const promise = svc.refresh();
    ctrl.expectOne('/pp/v1/cf/routes/cnsi-1?space_guids=space-1')
      .flush({ totalResults: 0 } as StRoutesResponse);
    await promise;
    expect(svc.routes()).toEqual([]);
  });

  it('refresh() reactively updates the view pipeline', async () => {
    const data = makeDataServiceStub({ cnsiGuid: 'cnsi-1', spaceGuid: 'space-1' });
    const { svc, ctrl } = configure({ data });
    TestBed.tick();
    expect(svc.view.totalFilteredResults()).toBe(0);

    const promise = svc.refresh();
    ctrl.expectOne('/pp/v1/cf/routes/cnsi-1?space_guids=space-1').flush({
      resources: [makeRoute({ guid: 'r1' }), makeRoute({ guid: 'r2' }), makeRoute({ guid: 'r3' })],
      totalResults: 3,
    } satisfies StRoutesResponse);
    await promise;
    TestBed.tick();
    expect(svc.view.totalFilteredResults()).toBe(3);
  });

  // ---------------------------------------------------------------------------
  // Default sort + filter
  // ---------------------------------------------------------------------------

  it('default sort is createdAt desc (mirrors slice 3)', () => {
    const { svc } = configure();
    expect(svc.sort().field).toBe('createdAt');
    expect(svc.sort().direction).toBe('desc');
  });

  it('clearFilters resets nameFilter, sort, and pageIndex', () => {
    const { svc } = configure();
    svc.nameFilter.set('foo');
    svc.sort.set({ field: 'host', direction: 'asc' });
    svc.pageIndex.set(2);

    svc.clearFilters();

    expect(svc.nameFilter()).toBe('');
    expect(svc.sort().field).toBe('createdAt');
    expect(svc.sort().direction).toBe('desc');
    expect(svc.pageIndex()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Split signals — attached vs available
  // ---------------------------------------------------------------------------

  it('attachedRoutes filters _routes to those whose appGuids include the current appGuid', async () => {
    const data = makeDataServiceStub({ cnsiGuid: 'cnsi-1', spaceGuid: 'space-1' });
    const { svc, ctrl } = configure({ data });
    const promise = svc.refresh();
    ctrl.expectOne('/pp/v1/cf/routes/cnsi-1?space_guids=space-1').flush({
      resources: [
        makeRoute({ guid: 'mine-1', appGuids: ['app-1'] }),
        makeRoute({ guid: 'other', appGuids: ['app-2'] }),
        makeRoute({ guid: 'detached' }),
      ],
      totalResults: 3,
    } satisfies StRoutesResponse);
    await promise;
    TestBed.tick();
    expect(svc.attachedRoutes().map(r => r.guid)).toEqual(['mine-1']);
  });

  it('availableRoutes excludes routes attached to the current app', async () => {
    const data = makeDataServiceStub({ cnsiGuid: 'cnsi-1', spaceGuid: 'space-1' });
    const { svc, ctrl } = configure({ data });
    const promise = svc.refresh();
    ctrl.expectOne('/pp/v1/cf/routes/cnsi-1?space_guids=space-1').flush({
      resources: [
        makeRoute({ guid: 'mine-1', appGuids: ['app-1'] }),
        makeRoute({ guid: 'other', appGuids: ['app-2'] }),
        makeRoute({ guid: 'detached' }),
      ],
      totalResults: 3,
    } satisfies StRoutesResponse);
    await promise;
    TestBed.tick();
    const guids = svc.availableRoutes().map(r => r.guid).sort();
    expect(guids).toEqual(['detached', 'other']);
  });

  it('view.pagedItems shows only available routes (drives the redesigned picker)', async () => {
    const data = makeDataServiceStub({ cnsiGuid: 'cnsi-1', spaceGuid: 'space-1' });
    const { svc, ctrl } = configure({ data });
    const promise = svc.refresh();
    ctrl.expectOne('/pp/v1/cf/routes/cnsi-1?space_guids=space-1').flush({
      resources: [
        makeRoute({ guid: 'mine', appGuids: ['app-1'] }),
        makeRoute({ guid: 'available', appGuids: [] }),
      ],
      totalResults: 2,
    } satisfies StRoutesResponse);
    await promise;
    TestBed.tick();
    const guids = svc.view.pagedItems().map(r => r.guid);
    expect(guids).toEqual(['available']);
  });

  it('nameFilter narrows the view by URL substring', async () => {
    const data = makeDataServiceStub({ cnsiGuid: 'cnsi-1', spaceGuid: 'space-1' });
    const { svc, ctrl } = configure({ data });
    const promise = svc.refresh();
    ctrl.expectOne('/pp/v1/cf/routes/cnsi-1?space_guids=space-1').flush({
      resources: [
        makeRoute({ guid: 'r1', url: 'alpha.example.com' }),
        makeRoute({ guid: 'r2', url: 'beta.example.com' }),
        makeRoute({ guid: 'r3', url: 'gamma.example.com' }),
      ],
      totalResults: 3,
    } satisfies StRoutesResponse);
    await promise;
    TestBed.tick();
    expect(svc.view.totalFilteredResults()).toBe(3);

    svc.nameFilter.set('beta');
    TestBed.tick();
    expect(svc.view.totalFilteredResults()).toBe(1);
    expect(svc.view.pagedItems()[0].guid).toBe('r2');
  });
});
