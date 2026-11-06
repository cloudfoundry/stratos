import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CfAppRoutesSignalConfigService } from './cf-app-routes-signal-config.service';
import { AppDetailDataService } from '../../../features/applications/app-detail-data.service';
import { ApplicationService } from '../../../features/applications/application.service';
import { AppNameResolverService } from '../../services/app-name-resolver.service';
import { AppRouteActionsService } from '../../services/app-route-actions.service';
import type { StRoute } from '../../../services/endpoint-data/stratos-types';

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

// Stub data service: a writable routes() signal + refresh().
function makeDataServiceStub(initial: StRoute[] | null = []) {
  const routes = signal<StRoute[] | null>(initial);
  return {
    routes,
    refresh: vi.fn(async (_kind?: string) => undefined),
    removeRoute: vi.fn(),
  };
}

// Stub action service exposing the signals + verbs the config reads.
function makeActionsServiceStub() {
  const transitioningRouteGuid = signal<string | null>(null);
  return {
    transitioningRouteGuid,
    inFlight: signal(false),
    unmapRoute: vi.fn(async (_guid: string) => undefined),
    deleteRoute: vi.fn(async (_guid: string) => undefined),
  };
}

// Stub application service — only cfGuid + appGuid are read by the config.
function makeAppServiceStub() {
  return { cfGuid: 'cnsi-1', appGuid: 'app-1' };
}

// Stub app-name resolver. resolveMany returns a signal whose Map carries
// only entries pre-seeded via seed(); unresolved guids fall through to
// the GUID placeholder in the config.
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
  actions: ReturnType<typeof makeActionsServiceStub>;
  app: ReturnType<typeof makeAppServiceStub>;
  appNames: ReturnType<typeof makeAppNamesStub>;
}

function configure(stubs?: Partial<Stubs> & { initialRoutes?: StRoute[] | null }): {
  svc: CfAppRoutesSignalConfigService;
  data: ReturnType<typeof makeDataServiceStub>;
  actions: ReturnType<typeof makeActionsServiceStub>;
  app: ReturnType<typeof makeAppServiceStub>;
  appNames: ReturnType<typeof makeAppNamesStub>;
} {
  TestBed.resetTestingModule();
  const data = stubs?.data ?? makeDataServiceStub(stubs?.initialRoutes ?? []);
  const actions = stubs?.actions ?? makeActionsServiceStub();
  const app = stubs?.app ?? makeAppServiceStub();
  const appNames = stubs?.appNames ?? makeAppNamesStub();

  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      CfAppRoutesSignalConfigService,
      { provide: AppDetailDataService, useValue: data },
      { provide: AppRouteActionsService, useValue: actions },
      { provide: ApplicationService, useValue: app },
      { provide: AppNameResolverService, useValue: appNames },
    ],
  });
  const svc = TestBed.inject(CfAppRoutesSignalConfigService);
  return { svc, data, actions, app, appNames };
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfAppRoutesSignalConfigService', () => {
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

  it('builds a ViewPipeline driven by routes()', () => {
    const { svc } = configure();
    expect(svc.view).toBeDefined();
    // Effect bridge needs a tick to flush the initial value.
    TestBed.tick();
    expect(svc.view.pagedItems()).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // Source signal flow
  // ---------------------------------------------------------------------------

  it('flows routes() through the source signal: 2 rows in → 2 rows out', () => {
    const data = makeDataServiceStub([
      makeRoute({ guid: 'r1' }),
      makeRoute({ guid: 'r2' }),
    ]);
    const { svc } = configure({ data });
    TestBed.tick();
    expect(svc.routes().length).toBe(2);
    expect(svc.view.totalFilteredResults()).toBe(2);
  });

  it('coalesces null routes() to an empty array', () => {
    const data = makeDataServiceStub(null);
    const { svc } = configure({ data });
    TestBed.tick();
    expect(svc.routes()).toEqual([]);
    expect(svc.view.totalFilteredResults()).toBe(0);
  });

  it('reactively re-derives view when routes() changes', () => {
    const data = makeDataServiceStub([]);
    const { svc } = configure({ data });
    TestBed.tick();
    expect(svc.view.totalFilteredResults()).toBe(0);
    data.routes.set([makeRoute({ guid: 'r1' }), makeRoute({ guid: 'r2' }), makeRoute({ guid: 'r3' })]);
    TestBed.tick();
    expect(svc.view.totalFilteredResults()).toBe(3);
  });

  // ---------------------------------------------------------------------------
  // Columns
  // ---------------------------------------------------------------------------

  it('buildColumns returns the expected column set', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const keys = cols.map(c => c.key);
    expect(keys).toEqual(['host', 'domain', 'path', 'port', 'apps', 'actions']);
  });

  it('columns expose sortField for host, domain, path, port, apps', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const sortable = cols.filter(c => c.sortField != null).map(c => c.key);
    expect(sortable).toEqual(['host', 'domain', 'path', 'port', 'apps']);
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
    // host=my-app, path=/path → URL minus host. and minus path = "example.com"
    expect(domainCol.render(makeRoute())).toBe('example.com');
  });

  it('Domain column derives correctly for TCP routes (host empty, port>0)', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const domainCol = cols.find(c => c.key === 'domain')!;
    const row = makeRoute({
      host: '', path: '', port: 9000,
      url: 'tcp.example.com:9000',
    });
    expect(domainCol.render(row)).toBe('tcp.example.com');
  });

  it('Path column renders StRoute.path', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const pathCol = cols.find(c => c.key === 'path')!;
    expect(pathCol.render(makeRoute({ path: '/api' }))).toBe('/api');
  });

  it('Port column renders the port for TCP routes and "-" for HTTP', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const portCol = cols.find(c => c.key === 'port')!;
    expect(portCol.render(makeRoute({ port: 9000 }))).toBe('9000');
    expect(portCol.render(makeRoute({ port: undefined }))).toBe('-');
    expect(portCol.render(makeRoute({ port: 0 }))).toBe('-');
  });

  it('actions column has kind=actions and a non-empty actions factory', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const actionsCol = cols.find(c => c.key === 'actions')!;
    expect(actionsCol.kind).toBe('actions');
    expect(typeof actionsCol.actions).toBe('function');
  });

  // ---------------------------------------------------------------------------
  // Apps Attached column
  // ---------------------------------------------------------------------------

  it('Apps Attached column is kind=compound with maxVisible=3', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const appsCol = cols.find(c => c.key === 'apps')!;
    expect(appsCol.kind).toBe('compound');
    expect(appsCol.maxVisible).toBe(3);
  });

  it('Apps Attached defaults to current app GUID when route.appGuids is absent', () => {
    const { svc, appNames } = configure();
    const cols = svc.buildColumns();
    const appsCol = cols.find(c => c.key === 'apps')!;
    const segments = appsCol.compound!(makeRoute());
    expect(segments.length).toBe(1);
    // No name resolved yet → placeholder is the guid itself.
    expect(segments[0].text).toBe('app-1');
    expect(appNames.resolveMany).toHaveBeenCalledWith('cnsi-1', ['app-1']);
  });

  it('Apps Attached renders resolved names when the resolver populates them', () => {
    const { svc, appNames } = configure();
    appNames.seed({ 'app-1': 'My Cool App' });
    const cols = svc.buildColumns();
    const appsCol = cols.find(c => c.key === 'apps')!;
    const segments = appsCol.compound!(makeRoute());
    expect(segments[0].text).toBe('My Cool App');
  });

  it('Apps Attached uses route.appGuids when populated (multi-mapped future case)', () => {
    const { svc, appNames } = configure();
    appNames.seed({ 'a': 'App A', 'b': 'App B' });
    const cols = svc.buildColumns();
    const appsCol = cols.find(c => c.key === 'apps')!;
    const segments = appsCol.compound!(makeRoute({ appGuids: ['a', 'b'] }));
    expect(segments.map(s => s.text)).toEqual(['App A', 'App B']);
  });

  it('Apps Attached fallback render returns count as string', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const appsCol = cols.find(c => c.key === 'apps')!;
    expect(appsCol.render(makeRoute())).toBe('1');
    expect(appsCol.render(makeRoute({ appGuids: ['a', 'b', 'c'] }))).toBe('3');
  });

  // ---------------------------------------------------------------------------
  // Row actions
  // ---------------------------------------------------------------------------

  it('buildRowActions returns Unmap and Delete', () => {
    const { svc } = configure();
    const actions = svc.buildRowActions(makeRoute());
    expect(actions.length).toBe(2);
    expect(actions[0].label).toBe('Unmap');
    expect(actions[1].label).toBe('Delete');
  });

  it('Delete row action is danger-styled', () => {
    const { svc } = configure();
    const actions = svc.buildRowActions(makeRoute());
    expect(actions[1].danger).toBe(true);
  });

  it('Unmap row action invokes actionsService.unmapRoute(row.guid)', async () => {
    const { svc, actions } = configure();
    const row = makeRoute({ guid: 'r-42' });
    const rowActions = svc.buildRowActions(row);
    await rowActions[0].invoke(row);
    expect(actions.unmapRoute).toHaveBeenCalledTimes(1);
    expect(actions.unmapRoute).toHaveBeenCalledWith('r-42');
  });

  it('Delete row action invokes actionsService.deleteRoute(row.guid)', async () => {
    const { svc, actions } = configure();
    const row = makeRoute({ guid: 'r-99' });
    const rowActions = svc.buildRowActions(row);
    await rowActions[1].invoke(row);
    expect(actions.deleteRoute).toHaveBeenCalledTimes(1);
    expect(actions.deleteRoute).toHaveBeenCalledWith('r-99');
  });

  it('row actions are disabled when actionsService.inFlight() is true', () => {
    const actions = makeActionsServiceStub();
    actions.inFlight.set(true);
    const { svc } = configure({ actions });
    const rowActions = svc.buildRowActions(makeRoute());
    expect(rowActions[0].disabled).toBe(true);
    expect(rowActions[1].disabled).toBe(true);
  });

  it('row actions are enabled when no verb is in flight', () => {
    const { svc } = configure();
    const rowActions = svc.buildRowActions(makeRoute());
    expect(rowActions[0].disabled).toBe(false);
    expect(rowActions[1].disabled).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  it('nameFilter narrows the view by URL substring (legacy "Filter by Route")', () => {
    const data = makeDataServiceStub([
      makeRoute({ guid: 'r1', url: 'alpha.example.com' }),
      makeRoute({ guid: 'r2', url: 'beta.example.com' }),
      makeRoute({ guid: 'r3', url: 'gamma.example.com' }),
    ]);
    const { svc } = configure({ data });
    TestBed.tick();
    expect(svc.view.totalFilteredResults()).toBe(3);

    svc.nameFilter.set('beta');
    TestBed.tick();
    expect(svc.view.totalFilteredResults()).toBe(1);
    expect(svc.view.pagedItems()[0].guid).toBe('r2');
  });

  it('clearFilters resets nameFilter, sort and pageIndex to defaults', () => {
    const { svc } = configure();
    svc.nameFilter.set('foo');
    svc.sort.set({ field: 'host', direction: 'asc' });
    svc.pageIndex.set(3);

    svc.clearFilters();

    expect(svc.nameFilter()).toBe('');
    expect(svc.sort().field).toBe('createdAt');
    expect(svc.sort().direction).toBe('desc');
    expect(svc.pageIndex()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Refresh
  // ---------------------------------------------------------------------------

  it('refresh() delegates to dataService.refresh("routes")', async () => {
    const { svc, data } = configure();
    await svc.refresh();
    expect(data.refresh).toHaveBeenCalledWith('routes');
  });
});
