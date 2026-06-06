import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AppDetailDataService } from './app-detail-data.service';
import { AppDetailPrefs } from './app-detail-prefs.service';
import { AppApplicationActionsService } from '../../shared/services/application-actions.service';
import { AppLifecycleStateService } from './app-lifecycle-state.service';
import { ApplicationStateService } from '../../shared/services/application-state.service';
import { StAppDetail, StRoute } from '../../services/endpoint-data/stratos-types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CNSI = 'cnsi-1';
const APP_GUID = 'app-1';
const DETAIL_URL = `/pp/v1/cf/apps/${CNSI}/${APP_GUID}?return=details`;
const ENV_URL    = `/pp/v1/cf/apps/${CNSI}/${APP_GUID}/env`;
const STATS_URL  = `/pp/v1/cf/app-stats/${CNSI}/${APP_GUID}`;
const ROUTES_URL = `/pp/v1/cf/apps/${CNSI}/${APP_GUID}/routes`;

const MOCK_ROUTES_RESPONSE = {
  resources: [
    {
      guid: 'r-1', url: 'a.example.com', host: 'a', path: '', port: undefined,
      domainGuid: 'd-1', spaceGuid: 'sp-1', cnsiGuid: CNSI,
      createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      guid: 'r-2', url: 'b.example.com', host: 'b', path: '', port: undefined,
      domainGuid: 'd-1', spaceGuid: 'sp-1', cnsiGuid: CNSI,
      createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  totalResults: 2,
};

// V3-shape composed envelope. Wire matches what
// /pp/v1/cf/apps/{cnsi}/{appGuid}?return=details returns.
const MOCK_APP_DETAIL: StAppDetail = {
  app: {
    guid: APP_GUID,
    name: 'my-app',
    state: 'STARTED',
    spaceGuid: 'sp-1',
    stackName: 'cflinuxfs4',
    instances: 2,
    memory: 256,
    diskQuota: 1024,
    routes: [{ guid: 'r-1', url: 'my-app.example.com' }],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    cnsiGuid: CNSI,
  },
  process: {
    guid: 'proc-1',
    type: 'web',
    instances: 2,
    memoryMb: 256,
    diskMb: 1024,
    logRateLimitInBytesPerSecond: 1048576,
    command: 'rails s',
    healthCheckType: 'port',
    ports: [8080],
  },
  droplet: null,
  pkg: null,
  build: null,
  sshEnabled: true,
};

const MOCK_STATS_RESPONSE = {
  instances: [
    {
      index: 0,
      state: 'RUNNING',
      uptime: 100,
      memQuota: 268435456,
      diskQuota: 1073741824,
      fdsQuota: 16384,
      host: '10.0.0.1',
      usage: { time: '2026-05-03T00:00:00Z', cpu: 0.05, mem: 67108864, disk: 134217728 },
    },
  ],
};

const MOCK_ENV = {
  environment: {
    STRATOS_PROJECT: JSON.stringify({
      deploySource: { type: 'github', timestamp: 0, endpointGuid: 'ep-1' },
      deployOverrides: {},
    }),
  },
  systemProvided: {},
};

const MOCK_SPACE = {
  guid: 'sp-1',
  name: 'my-space',
  orgGuid: 'org-1',
  createdAt: '',
  updatedAt: '',
  cnsiGuid: CNSI,
  appCount: 0,
  routeCount: 0,
};

const MOCK_ORG = {
  guid: 'org-1',
  name: 'my-org',
  status: 'active',
  quotaGuid: '',
  labels: {},
  annotations: {},
  createdAt: '',
  updatedAt: '',
  cnsiGuid: CNSI,
};

const MOCK_DOMAINS_RESPONSE = {
  resources: [
    {
      guid: 'd-1',
      name: 'example.com',
      internal: false,
      supportedProtocols: ['http'],
      sharedOrgGuids: [],
      cnsiGuid: CNSI,
      createdAt: '',
      updatedAt: '',
    },
  ],
  pagination: { totalResults: 1 },
};

/**
 * Yield to the microtask queue so that Promise.all / await chains inside
 * AppDetailDataService can advance between HTTP-flush phases.
 */
async function tick(times = 4): Promise<void> {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
}

describe('AppDetailDataService', () => {
  let svc: AppDetailDataService;
  let httpMock: HttpTestingController;

  const prefsStub = {
    idleSeconds: signal(45),
    activeSeconds: signal(5),
    enabled: signal(false),
  };
  const actionsStub = { inFlight: signal(false) };
  const lifecycleStub = { inFlight: signal(false), setInFlight: () => {} };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AppDetailDataService,
        ApplicationStateService,
        { provide: AppDetailPrefs, useValue: prefsStub },
        { provide: AppApplicationActionsService, useValue: actionsStub },
        { provide: AppLifecycleStateService, useValue: lifecycleStub },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    svc = TestBed.inject(AppDetailDataService);
    svc.cnsiGuid = CNSI;
    svc.appGuid = APP_GUID;
  });

  afterEach(() => httpMock.verify());

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  it('starts with undefined primary signals and no errors', () => {
    expect(svc.appDetail()).toBeUndefined();
    expect(svc.app()).toBeUndefined();
    expect(svc.summary()).toBeUndefined();
    expect(svc.stats()).toEqual([]);
    expect(svc.envVars()).toBeUndefined();
    expect(svc.space()).toBeUndefined();
    expect(svc.org()).toBeUndefined();
    expect(svc.domains()).toEqual([]);
    expect(svc.fetching()).toBe(false);
    expect(svc.lastPolledAt()).toBeNull();
  });

  // -------------------------------------------------------------------------
  // running() derived signal
  // -------------------------------------------------------------------------

  it('running() reflects appDetail.app.state', () => {
    svc['_appDetail'].set(MOCK_APP_DETAIL);
    expect(svc.running()).toBe(true);
    svc['_appDetail'].set({ ...MOCK_APP_DETAIL, app: { ...MOCK_APP_DETAIL.app, state: 'STOPPED' } });
    expect(svc.running()).toBe(false);
  });

  it('running() is false when appDetail is undefined', () => {
    expect(svc.running()).toBe(false);
  });

  // -------------------------------------------------------------------------
  // url() derived signal
  // -------------------------------------------------------------------------

  it('url() prepends https:// to bare CF v3 route url so it is a clickable absolute URL', () => {
    svc['_appDetail'].set(MOCK_APP_DETAIL);
    expect(svc.url()).toBe('https://my-app.example.com');
  });

  it('url() returns null when no routes', () => {
    svc['_appDetail'].set({ ...MOCK_APP_DETAIL, app: { ...MOCK_APP_DETAIL.app, routes: [] } });
    expect(svc.url()).toBeNull();
  });

  it('url() leaves a fully-qualified URL alone (does not double-prepend)', () => {
    svc['_appDetail'].set({
      ...MOCK_APP_DETAIL,
      app: { ...MOCK_APP_DETAIL.app, routes: [{ guid: 'r-fq', url: 'http://insecure.example.com' }] },
    });
    expect(svc.url()).toBe('http://insecure.example.com');
  });

  // -------------------------------------------------------------------------
  // stratosProject() derived signal
  // -------------------------------------------------------------------------

  it('stratosProject() returns null when env vars not loaded', () => {
    expect(svc.stratosProject()).toBeNull();
  });

  it('stratosProject() extracts STRATOS_PROJECT from env vars (string-encoded)', () => {
    svc['_envVars'].set(MOCK_ENV as any);
    const proj = svc.stratosProject();
    expect(proj).not.toBeNull();
    expect(proj?.deploySource?.type).toBe('github');
  });

  it('stratosProject() tolerates STRATOS_PROJECT already arriving as an object', () => {
    svc['_envVars'].set({
      environment: { STRATOS_PROJECT: { deploySource: { type: 'docker', timestamp: 0, endpointGuid: 'ep-1' } } },
      systemProvided: {},
    } as any);
    expect(svc.stratosProject()?.deploySource?.type).toBe('docker');
  });

  it('stratosProject() returns null when STRATOS_PROJECT is absent', () => {
    svc['_envVars'].set({ environment: {}, systemProvided: {} } as any);
    expect(svc.stratosProject()).toBeNull();
  });

  // -------------------------------------------------------------------------
  // app() / summary() legacy adapter views
  // -------------------------------------------------------------------------

  it('app() exposes the legacy APIResource<IApp> shape via the adapter', () => {
    svc['_appDetail'].set(MOCK_APP_DETAIL);
    const app = svc.app();
    expect(app).not.toBeUndefined();
    expect(app!.entity.name).toBe('my-app');
    expect(app!.entity.guid).toBe(APP_GUID);
    expect(app!.entity.memory).toBe(256);
    expect(app!.metadata.guid).toBe(APP_GUID);
  });

  it('summary() exposes the legacy IAppSummary shape via the adapter', () => {
    svc['_appDetail'].set(MOCK_APP_DETAIL);
    const summary = svc.summary();
    expect(summary).not.toBeUndefined();
    expect(summary!.guid).toBe(APP_GUID);
    expect(summary!.memory).toBe(256);
    expect(summary!.instances).toBe(2);
  });

  // -------------------------------------------------------------------------
  // fetching() derived signal
  // -------------------------------------------------------------------------

  it('fetching() is true while any entity loading flag is set', () => {
    svc['_loading'].update(m => ({ ...m, app: true }));
    expect(svc.fetching()).toBe(true);
    svc['_loading'].update(m => ({ ...m, app: false }));
    expect(svc.fetching()).toBe(false);
  });

  // -------------------------------------------------------------------------
  // refresh('all') — phased HTTP fan-out via native handlers
  //
  // Phase 1a (parallel): app + envVars (no separate /summary fetch — the
  // composed StAppDetail envelope carries every Summary-tab field).
  // Phase 1b: stats (conditional on app.state === STARTED).
  // Phase 2:  space (Jetstream native handler).
  // Phase 3:  org → domains (sequential, Jetstream native handlers).
  // -------------------------------------------------------------------------

  it('refresh("all") phase 1: app + envVars in parallel, then stats, then space/org/domains', async () => {
    const promise = svc.refresh('all');

    // Phase 1a
    await tick();
    httpMock.expectOne(DETAIL_URL).flush(MOCK_APP_DETAIL);
    httpMock.expectOne(ENV_URL).flush(MOCK_ENV);

    // Phase 1b: stats fires because app.state === 'STARTED'
    await tick();
    httpMock.expectOne(STATS_URL).flush(MOCK_STATS_RESPONSE);

    // Phase 2: space request needs app.spaceGuid
    await tick();
    httpMock.expectOne(`/pp/v1/cf/spaces/cnsi-1/sp-1`).flush(MOCK_SPACE);

    // Phase 3a: org needs space.orgGuid
    await tick();
    httpMock.expectOne(`/pp/v1/cf/org/cnsi-1/org-1`).flush(MOCK_ORG);

    // Phase 3b: domains needs org.guid
    await tick();
    httpMock.expectOne(`/pp/v1/cf/org/cnsi-1/org-1/private_domains`).flush(MOCK_DOMAINS_RESPONSE);

    await promise;

    expect(svc.appDetail()).toEqual(MOCK_APP_DETAIL);
    expect(svc.envVars()).toEqual(MOCK_ENV);
    expect(svc.stats()).toHaveLength(1);
    expect(svc.stats()[0].state).toBe('RUNNING');
    expect(svc.space()).toEqual(MOCK_SPACE);
    expect(svc.org()).toEqual(MOCK_ORG);
    expect(svc.domains()).toHaveLength(1);
  });

  it('refresh("all") phased: space only populated after app, org only populated after space', async () => {
    const promise = svc.refresh('all');

    await tick();
    httpMock.expectOne(DETAIL_URL).flush(MOCK_APP_DETAIL);
    httpMock.expectOne(ENV_URL).flush(MOCK_ENV);

    await tick();
    httpMock.expectOne(STATS_URL).flush(MOCK_STATS_RESPONSE);

    await tick();
    httpMock.expectOne(`/pp/v1/cf/spaces/cnsi-1/sp-1`).flush(MOCK_SPACE);

    await tick();
    httpMock.expectOne(`/pp/v1/cf/org/cnsi-1/org-1`).flush(MOCK_ORG);

    await tick();
    httpMock.expectOne(`/pp/v1/cf/org/cnsi-1/org-1/private_domains`).flush(MOCK_DOMAINS_RESPONSE);

    await promise;

    expect(svc.space()).toEqual(MOCK_SPACE);
    expect(svc.org()).toEqual(MOCK_ORG);
  });

  it('refresh("all") skips space/org/domains when app has no spaceGuid', async () => {
    const promise = svc.refresh('all');

    await tick();
    httpMock.expectOne(DETAIL_URL).flush({
      ...MOCK_APP_DETAIL,
      app: { ...MOCK_APP_DETAIL.app, spaceGuid: '' },
    });
    httpMock.expectOne(ENV_URL).flush(MOCK_ENV);

    await tick();
    httpMock.expectOne(STATS_URL).flush(MOCK_STATS_RESPONSE);

    await tick();

    await promise;

    expect(svc.space()).toBeUndefined();
    expect(svc.org()).toBeUndefined();
    httpMock.expectNone(`/pp/v1/cf/spaces/cnsi-1/sp-1`);
  });

  it('sets lastPolledAt after a successful refresh("all")', async () => {
    const before = Date.now();
    const promise = svc.refresh('all');

    await tick();
    httpMock.expectOne(DETAIL_URL).flush(MOCK_APP_DETAIL);
    httpMock.expectOne(ENV_URL).flush(MOCK_ENV);

    await tick();
    httpMock.expectOne(STATS_URL).flush(MOCK_STATS_RESPONSE);

    await tick();
    httpMock.expectOne(`/pp/v1/cf/spaces/cnsi-1/sp-1`).flush(MOCK_SPACE);

    await tick();
    httpMock.expectOne(`/pp/v1/cf/org/cnsi-1/org-1`).flush(MOCK_ORG);

    await tick();
    httpMock.expectOne(`/pp/v1/cf/org/cnsi-1/org-1/private_domains`).flush(MOCK_DOMAINS_RESPONSE);

    await promise;

    const ts = svc.lastPolledAt()?.getTime() ?? 0;
    expect(ts).toBeGreaterThanOrEqual(before);
  });

  // -------------------------------------------------------------------------
  // refresh('app') — scoped refetch
  // -------------------------------------------------------------------------

  it('refresh("app") only fetches the app detail', async () => {
    const promise = svc.refresh('app');

    await tick();
    httpMock.expectOne(DETAIL_URL).flush(MOCK_APP_DETAIL);
    await promise;

    expect(svc.appDetail()).toEqual(MOCK_APP_DETAIL);
    httpMock.expectNone(ENV_URL);
    httpMock.expectNone(STATS_URL);
  });

  // -------------------------------------------------------------------------
  // loading / error signal lifecycle
  // -------------------------------------------------------------------------

  it('loading.app is true during fetch and false after', async () => {
    const promise = svc.refresh('app');
    expect(svc.loading().app).toBe(true);

    await tick();
    httpMock.expectOne(DETAIL_URL).flush(MOCK_APP_DETAIL);
    await promise;

    expect(svc.loading().app).toBe(false);
  });

  it('HTTP errors land in errors.<kind> and do not throw', async () => {
    const promise = svc.refresh('app');

    await tick();
    httpMock.expectOne(DETAIL_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });
    await promise;

    expect(svc.errors().app).not.toBeNull();
    expect(svc.errors().app?.code).toBe('FETCH_ERROR');
    expect(svc.appDetail()).toBeUndefined();
  });

  it('clears a previous error on successful re-fetch', async () => {
    const p1 = svc.refresh('app');
    await tick();
    httpMock.expectOne(DETAIL_URL).flush('err', { status: 500, statusText: 'Server Error' });
    await p1;
    expect(svc.errors().app).not.toBeNull();

    const p2 = svc.refresh('app');
    await tick();
    httpMock.expectOne(DETAIL_URL).flush(MOCK_APP_DETAIL);
    await p2;
    expect(svc.errors().app).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Stats — stopped-app 400 treated as benign
  // -------------------------------------------------------------------------

  it('fetchStats() treats 400 with "STARTED" in message as benign — no error signal', async () => {
    // Force fetchStats to actually run by setting state to STARTED first
    svc['_appDetail'].set(MOCK_APP_DETAIL);
    const promise = svc.refresh('stats');

    await tick();
    httpMock.expectOne(STATS_URL).flush(
      { description: 'App must be in the STARTED state' },
      { status: 400, statusText: 'Bad Request' }
    );
    await promise;

    expect(svc.stats()).toEqual([]);
    expect(svc.errors().stats).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Stats array extraction
  // -------------------------------------------------------------------------

  it('stats() extracts the instances array from the native response envelope', async () => {
    svc['_appDetail'].set(MOCK_APP_DETAIL);
    const promise = svc.refresh('stats');

    await tick();
    httpMock.expectOne(STATS_URL).flush({
      instances: [
        { index: 0, state: 'RUNNING', uptime: 100, memQuota: 0, diskQuota: 0, fdsQuota: 0 },
        { index: 1, state: 'CRASHED', uptime: 0, memQuota: 0, diskQuota: 0, fdsQuota: 0 },
      ],
    });
    await promise;

    expect(svc.stats()).toHaveLength(2);
    expect(svc.stats()[0].state).toBe('RUNNING');
    expect(svc.stats()[1].state).toBe('CRASHED');
  });

  it('stats() preserves usage metrics from the native response', async () => {
    svc['_appDetail'].set(MOCK_APP_DETAIL);
    const promise = svc.refresh('stats');

    await tick();
    httpMock.expectOne(STATS_URL).flush(MOCK_STATS_RESPONSE);
    await promise;

    expect(svc.stats()[0].usage?.cpu).toBe(0.05);
    expect(svc.stats()[0].usage?.mem).toBe(67108864);
    expect(svc.stats()[0].uptime).toBe(100);
  });

  // -------------------------------------------------------------------------
  // raiseFocusPriority — focus set lifecycle
  // -------------------------------------------------------------------------

  it('raiseFocusPriority adds the kind; the returned callback removes it', () => {
    expect(svc['_focusPriority']().has('stats')).toBe(false);

    const release = svc.raiseFocusPriority('stats');
    expect(svc['_focusPriority']().has('stats')).toBe(true);

    release();
    expect(svc['_focusPriority']().has('stats')).toBe(false);
  });

  it('raiseFocusPriority dedupes identical kinds (Set semantics)', () => {
    svc.raiseFocusPriority('stats');
    svc.raiseFocusPriority('stats');

    const set = svc['_focusPriority']();
    expect(set.has('stats')).toBe(true);
    expect(set.size).toBe(1);
  });

  it('raiseFocusPriority refcounts: kind stays held until ALL consumers release', () => {
    const releaseA = svc.raiseFocusPriority('stats');
    const releaseB = svc.raiseFocusPriority('stats');
    expect(svc['_focusPriority']().has('stats')).toBe(true);

    releaseA();
    expect(svc['_focusPriority']().has('stats')).toBe(true);

    releaseB();
    expect(svc['_focusPriority']().has('stats')).toBe(false);
  });

  it('raiseFocusPriority release callback is idempotent (calling twice is safe)', () => {
    const releaseA = svc.raiseFocusPriority('stats');
    const releaseB = svc.raiseFocusPriority('stats');

    releaseA();
    releaseA(); // no-op — must not over-release B's hold
    expect(svc['_focusPriority']().has('stats')).toBe(true);

    releaseB();
    expect(svc['_focusPriority']().has('stats')).toBe(false);
  });

  // -------------------------------------------------------------------------
  // routes() — slice-3 per-app routes signal + removeRoute() mutation hook
  // -------------------------------------------------------------------------

  it('routes() is null before first load', () => {
    expect(svc.routes()).toBeNull();
    expect(svc.routesLoading()).toBe(false);
    expect(svc.routesError()).toBeNull();
  });

  it('refresh("routes") populates routes() with the resources array', async () => {
    const promise = svc.refresh('routes');
    expect(svc.routesLoading()).toBe(true);

    await tick();
    httpMock.expectOne(ROUTES_URL).flush(MOCK_ROUTES_RESPONSE);
    await promise;

    expect(svc.routes()).toHaveLength(2);
    expect(svc.routes()![0].guid).toBe('r-1');
    expect(svc.routesLoading()).toBe(false);
    expect(svc.routesError()).toBeNull();
  });

  it('HTTP error on routes fetch populates routesError and leaves routes() null', async () => {
    const promise = svc.refresh('routes');

    await tick();
    httpMock.expectOne(ROUTES_URL).flush('Server Error', { status: 500, statusText: 'Server Error' });
    await promise;

    expect(svc.routes()).toBeNull();
    expect(svc.routesError()).not.toBeNull();
    expect(svc.routesLoading()).toBe(false);
  });

  it('removeRoute(guid) removes the row synchronously from routes()', async () => {
    const promise = svc.refresh('routes');
    await tick();
    httpMock.expectOne(ROUTES_URL).flush(MOCK_ROUTES_RESPONSE);
    await promise;

    expect(svc.routes()).toHaveLength(2);
    svc.removeRoute('r-1');
    expect(svc.routes()).toHaveLength(1);
    expect(svc.routes()![0].guid).toBe('r-2');
  });

  it('removeRoute(guid) for a non-existent guid is a no-op (no exception, same reference)', async () => {
    const promise = svc.refresh('routes');
    await tick();
    httpMock.expectOne(ROUTES_URL).flush(MOCK_ROUTES_RESPONSE);
    await promise;

    const before = svc.routes();
    expect(() => svc.removeRoute('does-not-exist')).not.toThrow();
    // Same array reference proves no signal write occurred (no tick).
    expect(svc.routes()).toBe(before);
  });

  it('removeRoute(guid) before any load is a no-op', () => {
    expect(svc.routes()).toBeNull();
    expect(() => svc.removeRoute('r-1')).not.toThrow();
    expect(svc.routes()).toBeNull();
  });

  it('removeRoute followed by refresh repopulates from server', async () => {
    const p1 = svc.refresh('routes');
    await tick();
    httpMock.expectOne(ROUTES_URL).flush(MOCK_ROUTES_RESPONSE);
    await p1;

    svc.removeRoute('r-1');
    expect(svc.routes()).toHaveLength(1);

    const p2 = svc.refresh('routes');
    await tick();
    httpMock.expectOne(ROUTES_URL).flush(MOCK_ROUTES_RESPONSE);
    await p2;

    expect(svc.routes()).toHaveLength(2);
    expect(svc.routes()!.map(r => r.guid)).toEqual(['r-1', 'r-2']);
  });

  // -------------------------------------------------------------------------
  // addRoute() — slice-3.5 mutation hook for attach + create-and-attach
  // -------------------------------------------------------------------------

  const MOCK_NEW_ROUTE: StRoute = {
    guid: 'r-new',
    url: 'new.example.com',
    host: 'new',
    path: '',
    port: undefined,
    domainGuid: 'd-1',
    spaceGuid: 'sp-1',
    cnsiGuid: CNSI,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  };

  it('addRoute(stRoute) appends to appDetail().app.routes', () => {
    svc['_appDetail'].set(MOCK_APP_DETAIL);
    expect(svc.appDetail()!.app.routes).toHaveLength(1);

    svc.addRoute(MOCK_NEW_ROUTE);

    expect(svc.appDetail()!.app.routes).toHaveLength(2);
    expect(svc.appDetail()!.app.routes[1].guid).toBe('r-new');
    expect(svc.appDetail()!.app.routes[1].url).toBe('new.example.com');
  });

  it('addRoute(stRoute) is idempotent on guid match (no-op, same reference)', () => {
    svc['_appDetail'].set(MOCK_APP_DETAIL);
    svc.addRoute(MOCK_NEW_ROUTE);
    const before = svc.appDetail();
    expect(before!.app.routes).toHaveLength(2);

    // Second call with the same guid is a no-op — same detail reference
    // proves no signal write occurred.
    svc.addRoute(MOCK_NEW_ROUTE);
    expect(svc.appDetail()).toBe(before);
    expect(svc.appDetail()!.app.routes).toHaveLength(2);
  });

  it('addRoute(stRoute) when appDetail is null is a no-op (does not throw)', () => {
    expect(svc.appDetail()).toBeUndefined();
    expect(() => svc.addRoute(MOCK_NEW_ROUTE)).not.toThrow();
    expect(svc.appDetail()).toBeUndefined();
  });

  it('addRoute(stRoute) preserves other detail fields immutably', () => {
    svc['_appDetail'].set(MOCK_APP_DETAIL);
    const before = svc.appDetail()!;

    svc.addRoute(MOCK_NEW_ROUTE);

    const after = svc.appDetail()!;
    // New top-level + new app objects (immutable update).
    expect(after).not.toBe(before);
    expect(after.app).not.toBe(before.app);
    // Untouched siblings preserved by reference (no copy beyond app).
    expect(after.process).toBe(before.process);
    expect(after.droplet).toBe(before.droplet);
    expect(after.pkg).toBe(before.pkg);
    expect(after.build).toBe(before.build);
    // Untouched app fields preserved by value.
    expect(after.app.guid).toBe(before.app.guid);
    expect(after.app.name).toBe(before.app.name);
    expect(after.app.state).toBe(before.app.state);
    expect(after.app.spaceGuid).toBe(before.app.spaceGuid);
    expect(after.app.instances).toBe(before.app.instances);
    expect(after.sshEnabled).toBe(before.sshEnabled);
  });

  // Both signal mutations — the build-tab Routes count and the Routes tab
  // list each read from a different signal. Mutating only one would leave
  // the other view stale until the next full refresh.

  it('addRoute(stRoute) appends to _routes signal (Routes tab list)', () => {
    svc['_appDetail'].set(MOCK_APP_DETAIL);
    svc['_routes'].set([]);
    expect(svc.routes()).toEqual([]);

    svc.addRoute(MOCK_NEW_ROUTE);

    expect(svc.routes()).toHaveLength(1);
    expect(svc.routes()![0].guid).toBe('r-new');
  });

  it('addRoute(stRoute) is idempotent on _routes signal too', () => {
    svc['_appDetail'].set(MOCK_APP_DETAIL);
    svc['_routes'].set([MOCK_NEW_ROUTE]);
    const before = svc.routes();

    svc.addRoute(MOCK_NEW_ROUTE);

    // Same reference proves no signal write.
    expect(svc.routes()).toBe(before);
    expect(svc.routes()).toHaveLength(1);
  });

  it('addRoute(stRoute) is no-op on _routes when _routes is null', () => {
    svc['_appDetail'].set(MOCK_APP_DETAIL);
    // _routes starts as null — addRoute should leave it null rather than
    // ticking it to [route] (the slice 3 list hasn't drained yet, so
    // initializing it here would race the drain that's about to land).
    expect(svc.routes()).toBeNull();

    svc.addRoute(MOCK_NEW_ROUTE);

    expect(svc.routes()).toBeNull();
    // But _appDetail.app.routes still updates regardless.
    expect(svc.appDetail()!.app.routes).toHaveLength(2);
  });

  it('addRoute(stRoute) converges partial state (route in only one signal)', () => {
    // Precondition: route already in _appDetail.app.routes but _routes
    // doesn't have it yet (could happen if backend returns it embedded but
    // /cf/apps/.../routes drain hasn't merged). addRoute should add to the
    // missing signal without double-adding to the present one.
    const detailWithNewRoute = {
      ...MOCK_APP_DETAIL,
      app: { ...MOCK_APP_DETAIL.app, routes: [...MOCK_APP_DETAIL.app.routes, MOCK_NEW_ROUTE] },
    };
    svc['_appDetail'].set(detailWithNewRoute);
    svc['_routes'].set([]);

    svc.addRoute(MOCK_NEW_ROUTE);

    expect(svc.appDetail()!.app.routes).toHaveLength(2);
    expect(svc.routes()).toHaveLength(1);
    expect(svc.routes()![0].guid).toBe('r-new');
  });

  // -------------------------------------------------------------------------
  // raiseFocusPriority — cadence: 5s continuous poll on stats while focused
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // setStatsPollMs — adjustable focus poll cadence
  // -------------------------------------------------------------------------

  it('defaults the focus stats poll cadence to 5000ms', () => {
    expect(svc['_statsPollMs']()).toBe(5000);
  });

  it('setStatsPollMs changes the focus poll cadence', () => {
    svc.setStatsPollMs(10000);
    expect(svc['_statsPollMs']()).toBe(10000);
  });

  it('setStatsPollMs clamps below 1000ms', () => {
    svc.setStatsPollMs(200);
    expect(svc['_statsPollMs']()).toBe(1000);
  });

  it('setStatsPollMs falls back to 5000ms on non-finite input', () => {
    svc.setStatsPollMs(NaN);
    expect(svc['_statsPollMs']()).toBe(5000);
  });

  it('focus stats poll re-arms at the new cadence when setStatsPollMs changes', async () => {
    vi.useFakeTimers();
    try {
      svc['_appDetail'].set(MOCK_APP_DETAIL);

      const release = svc.raiseFocusPriority('stats');
      await Promise.resolve();
      await Promise.resolve();

      // Change cadence to 10s — the effect must re-arm with the new interval.
      svc.setStatsPollMs(10000);
      await Promise.resolve();
      await Promise.resolve();

      // After 5s nothing fires (old 5s interval was cleared).
      await vi.advanceTimersByTimeAsync(5000);
      httpMock.expectNone(STATS_URL);

      // After a further 5s (10s total) the re-armed interval fires.
      await vi.advanceTimersByTimeAsync(5000);
      httpMock.expectOne(STATS_URL).flush(MOCK_STATS_RESPONSE);

      release();
      await Promise.resolve();
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(20000);
      httpMock.expectNone(STATS_URL);
    } finally {
      vi.useRealTimers();
    }
  });

  it('focus on "stats" drives a 5s continuous poll; release stops it', async () => {
    vi.useFakeTimers();
    try {
      // Pre-seed app detail so refresh('stats') actually fires (state STARTED).
      svc['_appDetail'].set(MOCK_APP_DETAIL);

      const release = svc.raiseFocusPriority('stats');

      // Allow the effect to schedule the interval.
      await Promise.resolve();
      await Promise.resolve();

      // No request yet — interval hasn't fired.
      httpMock.expectNone(STATS_URL);

      // Advance 5s — first interval fires refresh('stats').
      await vi.advanceTimersByTimeAsync(5000);
      httpMock.expectOne(STATS_URL).flush(MOCK_STATS_RESPONSE);

      // Advance another 5s — second tick fires.
      await vi.advanceTimersByTimeAsync(5000);
      httpMock.expectOne(STATS_URL).flush(MOCK_STATS_RESPONSE);

      // Release focus — effect cleanup clears the interval.
      release();
      await Promise.resolve();
      await Promise.resolve();

      // Advance 10s — no further requests issued.
      await vi.advanceTimersByTimeAsync(10000);
      httpMock.expectNone(STATS_URL);
    } finally {
      vi.useRealTimers();
    }
  });
});
