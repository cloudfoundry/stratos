import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AppDetailDataService } from './app-detail-data.service';
import { AppDetailPrefs } from './app-detail-prefs.service';
import { AppApplicationActionsService } from '../../shared/services/application-actions.service';
import { AppLifecycleStateService } from './app-lifecycle-state.service';
import { ApplicationStateService } from '../../shared/services/application-state.service';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CNSI = 'cnsi-1';
const APP_GUID = 'app-1';
const BASE_URL = `/pp/v1/proxy/v2/apps/${APP_GUID}`;

const MOCK_APP_ENTITY = {
  metadata: { guid: APP_GUID, created_at: '', updated_at: '', url: '' },
  entity: { name: 'my-app', state: 'STARTED', space_guid: 'sp-1', instances: 2 },
};

const MOCK_SUMMARY = {
  guid: APP_GUID,
  name: 'my-app',
  routes: [{ guid: 'r-1', host: 'my-app', path: '', port: null, domain: { name: 'example.com' } }],
  state: 'STARTED',
  instances: 2,
  running_instances: 2,
  package_state: 'STAGED',
};

const MOCK_STATS = {
  '0': {
    cfGuid: CNSI, guid: APP_GUID, state: 'RUNNING',
    stats: { host: 'h', port: 8080, name: 'my-app', disk_quota: 1024, mem_quota: 512, fds_quota: 16384, uptime: 100, uris: [], usage: { cpu: 0, disk: 0, mem: 0, time: '' } },
  },
};

const MOCK_ENV = {
  environment_json: {
    STRATOS_PROJECT: JSON.stringify({
      deploySource: { type: 'github', timestamp: 0, endpointGuid: 'ep-1' },
      deployOverrides: {},
    }),
  },
};

const MOCK_SPACE = {
  metadata: { guid: 'sp-1', created_at: '', updated_at: '', url: '' },
  entity: { name: 'my-space', organization_guid: 'org-1' },
};

const MOCK_ORG = {
  metadata: { guid: 'org-1', created_at: '', updated_at: '', url: '' },
  entity: { name: 'my-org' },
};

const MOCK_DOMAINS_RESPONSE = {
  resources: [
    { metadata: { guid: 'd-1', created_at: '', updated_at: '', url: '' }, entity: { name: 'example.com' } },
  ],
};

// ---------------------------------------------------------------------------
// Async helper — drain the microtask queue
// ---------------------------------------------------------------------------

/**
 * Yield to the microtask queue so that Promise.all / await chains inside
 * AppDetailDataService can advance between HTTP-flush phases.
 * Multiple ticks may be needed because each `await firstValueFrom(...)` in
 * the service resolves across two microtask boundaries (Observable emit +
 * firstValueFrom completion).
 */
async function tick(times = 4): Promise<void> {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('AppDetailDataService', () => {
  let svc: AppDetailDataService;
  let httpMock: HttpTestingController;

  // Polling disabled so no interval fires during tests.
  const prefsStub = {
    idleSeconds: signal(45),
    activeSeconds: signal(5),
    enabled: signal(false),
  };
  const actionsStub = { inFlight: signal(false) };
  const lifecycleStub = { inFlight: signal(false), setInFlight: () => {} };

  // Configure once per test file — the global afterEach in test-setup.ts
  // calls getTestBed().resetTestingModule() after each test so the next
  // beforeEach finds a clean slate.
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
    // Inject but do NOT call initialize() — tests that need HTTP fetches
    // set cnsiGuid/appGuid and call refresh() themselves to keep the
    // httpMock state clean.
    svc = TestBed.inject(AppDetailDataService);
    svc.cnsiGuid = CNSI;
    svc.appGuid = APP_GUID;
  });

  afterEach(() => httpMock.verify());

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  it('starts with undefined primary signals and no errors', () => {
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

  it('running() reflects app.entity.state', () => {
    svc['_app'].set({ metadata: { guid: 'a', created_at: '', updated_at: '', url: '' }, entity: { name: 'a', state: 'STARTED', space_guid: '' } });
    expect(svc.running()).toBe(true);
    svc['_app'].set({ metadata: { guid: 'a', created_at: '', updated_at: '', url: '' }, entity: { name: 'a', state: 'STOPPED', space_guid: '' } });
    expect(svc.running()).toBe(false);
  });

  it('running() is false when app is undefined', () => {
    expect(svc.running()).toBe(false);
  });

  // -------------------------------------------------------------------------
  // url() derived signal
  // -------------------------------------------------------------------------

  it('url() returns http URL for first non-TCP route', () => {
    svc['_summary'].set(MOCK_SUMMARY as any);
    expect(svc.url()).toBe('http://my-app.example.com');
  });

  it('url() returns null when no routes', () => {
    svc['_summary'].set({ ...MOCK_SUMMARY, routes: [] } as any);
    expect(svc.url()).toBeNull();
  });

  it('url() skips TCP routes and returns the first HTTP route', () => {
    svc['_summary'].set({
      ...MOCK_SUMMARY,
      routes: [
        { guid: 'tcp', host: '', path: '', port: '1234', domain: { name: 'tcp.example.com' } },
        { guid: 'http', host: 'my-app', path: '', port: null, domain: { name: 'example.com' } },
      ],
    } as any);
    expect(svc.url()).toBe('http://my-app.example.com');
  });

  // -------------------------------------------------------------------------
  // stratosProject() derived signal
  // -------------------------------------------------------------------------

  it('stratosProject() returns null when env vars not loaded', () => {
    expect(svc.stratosProject()).toBeNull();
  });

  it('stratosProject() extracts STRATOS_PROJECT from env vars', () => {
    svc['_envVars'].set(MOCK_ENV as any);
    const proj = svc.stratosProject();
    expect(proj).not.toBeNull();
    expect(proj?.deploySource?.type).toBe('github');
  });

  it('stratosProject() returns null when STRATOS_PROJECT is absent', () => {
    svc['_envVars'].set({ environment_json: {} } as any);
    expect(svc.stratosProject()).toBeNull();
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
  // refresh('all') — phased HTTP fan-out
  //
  // Pattern: start the refresh Promise, tick microtasks to let each phase
  // initiate its HTTP requests, flush them, tick again, repeat for each phase.
  // -------------------------------------------------------------------------

  it('refresh("all") phase 1: fetches app, summary, stats, envVars in parallel', async () => {
    const promise = svc.refresh('all');

    // Phase 1: all four requests are in-flight immediately (started in parallel)
    await tick();
    httpMock.expectOne(BASE_URL).flush(MOCK_APP_ENTITY);
    httpMock.expectOne(`${BASE_URL}/summary`).flush(MOCK_SUMMARY);
    httpMock.expectOne(`${BASE_URL}/stats`).flush(MOCK_STATS);
    httpMock.expectOne(`${BASE_URL}/env`).flush(MOCK_ENV);

    // Drain microtasks so Promise.all resolves and phase 2 initiates
    await tick();

    // Phase 2: space request (needs app.space_guid = 'sp-1')
    httpMock.expectOne(`/pp/v1/proxy/v2/spaces/sp-1`).flush(MOCK_SPACE);

    // Drain microtasks so phase 2 resolves and phase 3 initiates
    await tick();

    // Phase 3a: org (needs space.organization_guid = 'org-1')
    httpMock.expectOne(`/pp/v1/proxy/v2/organizations/org-1`).flush(MOCK_ORG);

    // Drain microtasks so org resolves and domains fetch initiates
    await tick();

    // Phase 3b: domains (needs org.metadata.guid = 'org-1')
    httpMock.expectOne(`/pp/v1/proxy/v2/organizations/org-1/domains`).flush(MOCK_DOMAINS_RESPONSE);

    await promise;

    expect(svc.app()).toEqual(MOCK_APP_ENTITY);
    expect(svc.summary()).toEqual(MOCK_SUMMARY);
    expect(svc.stats()).toHaveLength(1);
    expect(svc.envVars()).toEqual(MOCK_ENV);
    expect(svc.space()).toEqual(MOCK_SPACE);
    expect(svc.org()).toEqual(MOCK_ORG);
    expect(svc.domains()).toHaveLength(1);
  });

  it('refresh("all") phased: space only populated after app, org only populated after space', async () => {
    const promise = svc.refresh('all');

    // Phase 1
    await tick();
    httpMock.expectOne(BASE_URL).flush(MOCK_APP_ENTITY);
    httpMock.expectOne(`${BASE_URL}/summary`).flush(MOCK_SUMMARY);
    httpMock.expectOne(`${BASE_URL}/stats`).flush(MOCK_STATS);
    httpMock.expectOne(`${BASE_URL}/env`).flush(MOCK_ENV);

    // Phase 2
    await tick();
    httpMock.expectOne(`/pp/v1/proxy/v2/spaces/sp-1`).flush(MOCK_SPACE);

    // Phase 3a: org
    await tick();
    httpMock.expectOne(`/pp/v1/proxy/v2/organizations/org-1`).flush(MOCK_ORG);

    // Phase 3b: domains (sequential after org)
    await tick();
    httpMock.expectOne(`/pp/v1/proxy/v2/organizations/org-1/domains`).flush(MOCK_DOMAINS_RESPONSE);

    await promise;

    expect(svc.space()).toEqual(MOCK_SPACE);
    expect(svc.org()).toEqual(MOCK_ORG);
  });

  it('refresh("all") skips space/org/domains when app has no space_guid', async () => {
    const promise = svc.refresh('all');

    // Phase 1: flush app without space_guid so phase 2 skips silently
    await tick();
    httpMock.expectOne(BASE_URL).flush({
      ...MOCK_APP_ENTITY,
      entity: { ...MOCK_APP_ENTITY.entity, space_guid: undefined },
    });
    httpMock.expectOne(`${BASE_URL}/summary`).flush(MOCK_SUMMARY);
    httpMock.expectOne(`${BASE_URL}/stats`).flush(MOCK_STATS);
    httpMock.expectOne(`${BASE_URL}/env`).flush(MOCK_ENV);

    // Drain — phase 2 runs but fetchSpace() skips (no space_guid)
    await tick();

    await promise;

    expect(svc.space()).toBeUndefined();
    expect(svc.org()).toBeUndefined();
    httpMock.expectNone(`/pp/v1/proxy/v2/spaces/sp-1`);
  });

  it('sets lastPolledAt after a successful refresh("all")', async () => {
    const before = Date.now();
    const promise = svc.refresh('all');

    await tick();
    httpMock.expectOne(BASE_URL).flush(MOCK_APP_ENTITY);
    httpMock.expectOne(`${BASE_URL}/summary`).flush(MOCK_SUMMARY);
    httpMock.expectOne(`${BASE_URL}/stats`).flush(MOCK_STATS);
    httpMock.expectOne(`${BASE_URL}/env`).flush(MOCK_ENV);

    await tick();
    httpMock.expectOne(`/pp/v1/proxy/v2/spaces/sp-1`).flush(MOCK_SPACE);

    await tick();
    httpMock.expectOne(`/pp/v1/proxy/v2/organizations/org-1`).flush(MOCK_ORG);

    // Domains are sequential after org
    await tick();
    httpMock.expectOne(`/pp/v1/proxy/v2/organizations/org-1/domains`).flush(MOCK_DOMAINS_RESPONSE);

    await promise;

    const ts = svc.lastPolledAt()?.getTime() ?? 0;
    expect(ts).toBeGreaterThanOrEqual(before);
  });

  // -------------------------------------------------------------------------
  // refresh('app') — scoped refetch
  // -------------------------------------------------------------------------

  it('refresh("app") only fetches the app entity', async () => {
    const promise = svc.refresh('app');

    await tick();
    httpMock.expectOne(BASE_URL).flush(MOCK_APP_ENTITY);
    await promise;

    expect(svc.app()).toEqual(MOCK_APP_ENTITY);
    // no other requests issued
    httpMock.expectNone(`${BASE_URL}/summary`);
    httpMock.expectNone(`${BASE_URL}/stats`);
  });

  // -------------------------------------------------------------------------
  // loading / error signal lifecycle
  // -------------------------------------------------------------------------

  it('loading.app is true during fetch and false after', async () => {
    const promise = svc.refresh('app');
    // loading.app is set synchronously before the HTTP request
    expect(svc.loading().app).toBe(true);

    await tick();
    httpMock.expectOne(BASE_URL).flush(MOCK_APP_ENTITY);
    await promise;

    expect(svc.loading().app).toBe(false);
  });

  it('HTTP errors land in errors.<kind> and do not throw', async () => {
    const promise = svc.refresh('app');

    await tick();
    httpMock.expectOne(BASE_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });
    await promise; // must not throw

    expect(svc.errors().app).not.toBeNull();
    expect(svc.errors().app?.code).toBe('FETCH_ERROR');
    expect(svc.app()).toBeUndefined(); // not overwritten on error
  });

  it('clears a previous error on successful re-fetch', async () => {
    // First fetch: fails
    const p1 = svc.refresh('app');
    await tick();
    httpMock.expectOne(BASE_URL).flush('err', { status: 500, statusText: 'Server Error' });
    await p1;
    expect(svc.errors().app).not.toBeNull();

    // Second fetch: succeeds
    const p2 = svc.refresh('app');
    await tick();
    httpMock.expectOne(BASE_URL).flush(MOCK_APP_ENTITY);
    await p2;
    expect(svc.errors().app).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Stats — stopped-app 400 treated as benign
  // -------------------------------------------------------------------------

  it('fetchStats() treats 400 with "STARTED" in message as benign — no error signal', async () => {
    const promise = svc.refresh('stats');

    await tick();
    httpMock.expectOne(`${BASE_URL}/stats`).flush(
      { description: 'App must be in the STARTED state' },
      { status: 400, statusText: 'Bad Request' }
    );
    await promise;

    expect(svc.stats()).toEqual([]);
    expect(svc.errors().stats).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Stats array normalisation
  // -------------------------------------------------------------------------

  it('stats() is an array even when the backend returns an object keyed by index', async () => {
    const promise = svc.refresh('stats');

    await tick();
    httpMock.expectOne(`${BASE_URL}/stats`).flush(MOCK_STATS);
    await promise;

    expect(Array.isArray(svc.stats())).toBe(true);
    expect(svc.stats()[0].state).toBe('RUNNING');
  });
});
