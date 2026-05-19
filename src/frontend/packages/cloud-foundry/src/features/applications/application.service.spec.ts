import { ApplicationRef, provideZonelessChangeDetection, signal, computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { firstValueFrom, take } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Flush Angular effects and drain the microtask queue.
 * In zoneless mode, effects (including toObservable's internal effect) run
 * when ApplicationRef.tick() is called. We also drain the microtask queue
 * to allow Promise continuations to settle.
 */
async function tick(times = 2): Promise<void> {
  TestBed.inject(ApplicationRef).tick();
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
  TestBed.inject(ApplicationRef).tick();
}

import { APP_GUID, CF_GUID } from '@stratosui/core';
import { ApplicationService } from './application.service';
import { AppDetailDataService } from './app-detail-data.service';
import { ApplicationEnvVarsHelper } from './application/application-tabs-base/tabs/build-tab/application-env-vars.service';

// ---------------------------------------------------------------------------
// Minimal stubs
// ---------------------------------------------------------------------------

/** Stub entity catalog entry that satisfies cfEntityCatalog lookups. */
function makeEntityCatalogStub() {
  const entityService = {
    waitForEntity$: { pipe: () => ({ pipe: () => ({ pipe: () => ({}) }) }) },
    updatingSection$: { pipe: () => ({}) },
    entityObs$: { pipe: () => ({}) },
    poll: () => ({ pipe: () => ({}) }),
    isFetchingEntity$: { pipe: () => ({}) },
    isDeletingEntity$: { pipe: () => ({}) },
    entityMonitor: {
      entityRequest$: { pipe: () => ({}) },
      entity$: { pipe: () => ({}) },
      updatingSection$: { pipe: () => ({}) },
      isDeletingEntity$: { pipe: () => ({}) },
      isFetchingEntity$: { pipe: () => ({}) },
    },
    action: { type: 'STUB' },
  };
  return {
    getEntityService: () => entityService,
    store: {
      getEntityService: () => entityService,
      getEntityMonitor: () => entityService.entityMonitor,
    },
    api: {
      update: () => ({ pipe: () => ({}) }),
    },
  };
}

/** Minimal data-service stub that exposes writable signals. */
function makeDataServiceStub() {
  const _app = signal<any>(undefined);
  const _summary = signal<any>(undefined);
  const _stats = signal<any[]>([]);
  const _envVars = signal<any>(undefined);
  const _space = signal<any>(undefined);
  const _org = signal<any>(undefined);
  const _domains = signal<any[]>([]);
  const _loading = signal<Record<string, boolean>>({
    app: false, summary: false, stats: false, envVars: false,
    space: false, org: false, domains: false,
  });
  const _errors = signal<Record<string, any>>({
    app: null, summary: null, stats: null, envVars: null,
    space: null, org: null, domains: null,
  });

  return {
    // expose writable refs so tests can mutate them
    _app, _summary, _stats, _envVars, _space, _org, _domains,
    _loading, _errors,

    // readonly signal views (mirror the real service)
    app: _app.asReadonly(),
    summary: _summary.asReadonly(),
    stats: _stats.asReadonly(),
    envVars: _envVars.asReadonly(),
    space: _space.asReadonly(),
    org: _org.asReadonly(),
    domains: _domains.asReadonly(),
    loading: _loading.asReadonly(),
    errors: _errors.asReadonly(),

    // computed derived signals
    running: computed(() => _app()?.entity?.state === 'STARTED'),
    url: computed((): string | null => null),
    stratosProject: computed(() => null),
    state: computed(() => ({ label: '', indicator: null, actions: {} })),
    fetching: computed(() => false),
  };
}

// ---------------------------------------------------------------------------
// vi.mock — stub cfEntityCatalog so ApplicationService constructor works
// without ngrx entity infrastructure.
// ---------------------------------------------------------------------------

vi.mock('../../cf-entity-catalog', () => {
  const entityService = {
    waitForEntity$: { pipe: () => ({ pipe: () => ({ pipe: () => ({}) }) }) },
    updatingSection$: { pipe: () => ({}) },
    entityObs$: { pipe: () => ({}) },
    poll: () => ({ pipe: () => ({}) }),
    isFetchingEntity$: { pipe: () => ({}) },
    isDeletingEntity$: { pipe: () => ({}) },
    entityMonitor: {
      entityRequest$: { pipe: () => ({}) },
      entity$: { pipe: () => ({}) },
      updatingSection$: { pipe: () => ({}) },
      isDeletingEntity$: { pipe: () => ({}) },
      isFetchingEntity$: { pipe: () => ({}) },
    },
    action: { type: 'STUB' },
  };
  const catalogEntry = {
    getEntityService: () => entityService,
    store: {
      getEntityService: () => entityService,
      getEntityMonitor: () => entityService.entityMonitor,
    },
    api: {
      update: () => ({ pipe: () => ({}) }),
    },
  };
  return {
    cfEntityCatalog: {
      application: catalogEntry,
      appSummary: catalogEntry,
      appEnvVar: catalogEntry,
    },
  };
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('ApplicationService (facade shim)', () => {
  const APP = 'app-1';
  const CF = 'cf-1';

  let dataStub: ReturnType<typeof makeDataServiceStub>;
  let svc: ApplicationService;

  beforeEach(() => {
    dataStub = makeDataServiceStub();

    const envVarsHelperStub = {
      createEnvVarsObs: () => ({ entities$: { pipe: () => ({}) } }),
      FetchStratosProject: () => null,
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStore({}),
        { provide: CF_GUID, useValue: CF },
        { provide: APP_GUID, useValue: APP },
        ApplicationService,
        { provide: AppDetailDataService, useValue: dataStub },
        { provide: ApplicationEnvVarsHelper, useValue: envVarsHelperStub },
      ],
    });

    svc = TestBed.inject(ApplicationService);
  });

  // -------------------------------------------------------------------------
  // Identity properties
  // -------------------------------------------------------------------------

  it('exposes cfGuid and appGuid from injection tokens', () => {
    expect(svc.cfGuid).toBe(CF);
    expect(svc.appGuid).toBe(APP);
  });

  // -------------------------------------------------------------------------
  // app$
  // -------------------------------------------------------------------------

  it('app$ emits undefined entity when data service has no app', async () => {
    const v = await firstValueFrom(svc.app$.pipe(take(1)));
    expect(v.entity).toBeUndefined();
    expect(v.entityRequestInfo.fetching).toBe(false);
  });

  it('app$ reflects the app entity from the data service', async () => {
    dataStub._app.set({
      metadata: { guid: APP, created_at: '', updated_at: '', url: '' },
      entity: { name: 'my-app', state: 'STARTED', space_guid: 'sp-1' },
    });

    const v = await firstValueFrom(svc.app$.pipe(take(1)));
    expect(v.entity).not.toBeUndefined();
    expect(v.entity?.entity?.name).toBe('my-app');
  });

  it('app$ reflects loading state', async () => {
    dataStub._loading.update(m => ({ ...m, app: true }));
    const v = await firstValueFrom(svc.app$.pipe(take(1)));
    expect(v.entityRequestInfo.fetching).toBe(true);
  });

  it('app$ reflects error state', async () => {
    dataStub._errors.update(m => ({ ...m, app: { detail: 'not found', code: 'FETCH_ERROR' } }));
    const v = await firstValueFrom(svc.app$.pipe(take(1)));
    expect(v.entityRequestInfo.error).toBe(true);
  });

  // -------------------------------------------------------------------------
  // waitForAppEntity$
  // -------------------------------------------------------------------------

  it('waitForAppEntity$ only emits once the entity is populated', async () => {
    // No entity yet — waitForAppEntity$ should not emit (filter blocks it)
    let emitted = false;
    const sub = svc.waitForAppEntity$.subscribe(() => { emitted = true; });

    expect(emitted).toBe(false);
    sub.unsubscribe();
  });

  it('waitForAppEntity$ emits after entity is set', async () => {
    dataStub._app.set({
      metadata: { guid: APP, created_at: '', updated_at: '', url: '' },
      entity: { name: 'my-app', state: 'STARTED', space_guid: 'sp-1' },
    });

    const v = await firstValueFrom(svc.waitForAppEntity$.pipe(take(1)));
    expect(v.entity?.entity?.name).toBe('my-app');
  });

  // -------------------------------------------------------------------------
  // appSummary$
  // -------------------------------------------------------------------------

  it('appSummary$ reflects summary from data service', async () => {
    dataStub._summary.set({ guid: APP, routes: [{ host: 'my-app' }] } as any);
    const v = await firstValueFrom(svc.appSummary$.pipe(take(1)));
    expect((v.entity as any)?.routes?.length).toBe(1);
  });

  // -------------------------------------------------------------------------
  // appStats$
  // -------------------------------------------------------------------------

  it('appStats$ reflects stats array', async () => {
    dataStub._stats.set([{ state: 'RUNNING', guid: APP } as any]);
    const v = await firstValueFrom(svc.appStats$.pipe(take(1)));
    expect(v.length).toBe(1);
    expect(v[0].state).toBe('RUNNING');
  });

  // -------------------------------------------------------------------------
  // applicationState$
  // -------------------------------------------------------------------------

  it('applicationState$ emits a state object', async () => {
    const v = await firstValueFrom(svc.applicationState$.pipe(take(1)));
    expect(v).toBeDefined();
    expect(typeof v).toBe('object');
  });

  // -------------------------------------------------------------------------
  // applicationRunning$
  // -------------------------------------------------------------------------

  it('applicationRunning$ is false when app is undefined', async () => {
    const v = await firstValueFrom(svc.applicationRunning$.pipe(take(1)));
    expect(v).toBe(false);
  });

  it('applicationRunning$ is true when app state is STARTED', async () => {
    dataStub._app.set({
      metadata: { guid: APP, created_at: '', updated_at: '', url: '' },
      entity: { state: 'STARTED' },
    });
    const v = await firstValueFrom(svc.applicationRunning$.pipe(take(1)));
    expect(v).toBe(true);
  });

  // -------------------------------------------------------------------------
  // applicationUrl$
  // -------------------------------------------------------------------------

  it('applicationUrl$ emits null when no summary', async () => {
    const v = await firstValueFrom(svc.applicationUrl$.pipe(take(1)));
    expect(v).toBeNull();
  });

  // -------------------------------------------------------------------------
  // applicationStratProject$
  // -------------------------------------------------------------------------

  it('applicationStratProject$ does not emit when stratosProject is null (filters null)', async () => {
    // The facade filters null from applicationStratProject$ so components
    // that do take(1) without null checks don't crash (matches legacy ngrx
    // behavior where env vars were not loaded in test stubs).
    let emitted = false;
    const sub = svc.applicationStratProject$.subscribe(() => { emitted = true; });
    await tick();
    expect(emitted).toBe(false);
    sub.unsubscribe();
  });

  // -------------------------------------------------------------------------
  // appOrg$ / appSpace$
  // -------------------------------------------------------------------------

  it('appOrg$ only emits when org is populated', async () => {
    let count = 0;
    const sub = svc.appOrg$.subscribe(() => count++);

    // toObservable uses an effect — must drain microtasks before asserting
    await tick();
    expect(count).toBe(0);   // filter blocks undefined (initial value)

    dataStub._org.set({
      guid: 'org-1',
      name: 'my-org',
    });
    await tick();
    expect(count).toBe(1);
    sub.unsubscribe();
  });

  it('appSpace$ only emits when space is populated', async () => {
    let count = 0;
    const sub = svc.appSpace$.subscribe(() => count++);

    await tick();
    expect(count).toBe(0);   // filter blocks undefined (initial value)

    dataStub._space.set({
      guid: 'sp-1',
      name: 'my-space',
    });
    await tick();
    expect(count).toBe(1);
    sub.unsubscribe();
  });

  // -------------------------------------------------------------------------
  // orgDomains$
  // -------------------------------------------------------------------------

  it('orgDomains$ emits empty array initially', async () => {
    const v = await firstValueFrom(svc.orgDomains$.pipe(take(1)));
    expect(Array.isArray(v)).toBe(true);
    expect(v.length).toBe(0);
  });

  it('orgDomains$ passes through StDomain entries unchanged', async () => {
    dataStub._domains.set([
      { guid: 'd-1', name: 'example.com' } as any,
    ]);
    const v = await firstValueFrom(svc.orgDomains$.pipe(take(1)));
    expect(v.length).toBe(1);
    expect(v[0].guid).toBe('d-1');
    expect(v[0].name).toBe('example.com');
  });

  // -------------------------------------------------------------------------
  // isFetchingApp$
  // -------------------------------------------------------------------------

  it('isFetchingApp$ starts false', async () => {
    const v = await firstValueFrom(svc.isFetchingApp$.pipe(take(1)));
    expect(v).toBe(false);
  });

  it('isFetchingApp$ reflects loading.app signal', async () => {
    dataStub._loading.update(m => ({ ...m, app: true }));
    const v = await firstValueFrom(svc.isFetchingApp$.pipe(take(1)));
    expect(v).toBe(true);
  });

  // -------------------------------------------------------------------------
  // isFetchingEnvVars$ / isFetchingStats$
  // -------------------------------------------------------------------------

  it('isFetchingEnvVars$ reflects loading.envVars signal', async () => {
    dataStub._loading.update(m => ({ ...m, envVars: true }));
    const v = await firstValueFrom(svc.isFetchingEnvVars$.pipe(take(1)));
    expect(v).toBe(true);
  });

  it('isFetchingStats$ reflects loading.stats signal', async () => {
    dataStub._loading.update(m => ({ ...m, stats: true }));
    const v = await firstValueFrom(svc.isFetchingStats$.pipe(take(1)));
    expect(v).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Signal reactivity — re-emission when underlying signal changes
  // -------------------------------------------------------------------------

  it('app$ re-emits when data-service app signal changes', async () => {
    const seen: string[] = [];
    const sub = svc.app$.subscribe(v => seen.push(v.entity?.entity?.state ?? 'none'));

    // toObservable effect fires asynchronously — drain between signal updates
    await tick();

    dataStub._app.set({
      metadata: { guid: APP, created_at: '', updated_at: '', url: '' },
      entity: { name: 'my-app', state: 'STARTED', space_guid: 'sp-1' },
    });
    await tick();

    dataStub._app.set({
      metadata: { guid: APP, created_at: '', updated_at: '', url: '' },
      entity: { name: 'my-app', state: 'STOPPED', space_guid: 'sp-1' },
    });
    await tick();

    sub.unsubscribe();
    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen).toContain('STARTED');
    expect(seen).toContain('STOPPED');
  });

  // entityService accessor and updateApplication method were dropped in
  // the W2 ngrx-strip; both were thin passthroughs to cfEntityCatalog
  // primitives that no longer exist. The signal-native replacements live
  // on AppDetailDataService (.app() / .update()) and are covered by
  // app-detail-data.service.spec.
});
