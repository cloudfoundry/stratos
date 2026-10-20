import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CfServiceInstancesSignalConfigService } from './cf-service-instances-signal-config.service';
import { CloudFoundryService } from '../../data-services/cloud-foundry.service';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import type { StServiceInstance } from '../../../services/endpoint-data/stratos-types';

function makeInstance(overrides: Partial<StServiceInstance> = {}): StServiceInstance {
  return {
    guid: 'si-1',
    name: 'primary-cache',
    cnsiGuid: 'cnsi-1',
    type: 'managed',
    space: { guid: 'sp-1', name: 'dev' },
    org: { guid: 'org-1', name: 'eng' },
    tags: [],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  } as StServiceInstance;
}

function makeHttp(instances: StServiceInstance[] = []): HttpClient {
  return {
    get: vi.fn(() => of({
      resources: instances,
      pagination: {
        totalResults: instances.length,
        totalPages: 1,
        next: null,
        previous: null,
        first: { href: '' },
        last: { href: '' },
      },
    })),
  } as unknown as HttpClient;
}

function makeStubCfService(): CloudFoundryService {
  return { connectedCFEndpoints$: of([]) } as unknown as CloudFoundryService;
}

type FakeDs = {
  guid: string;
  isLoadingServicesDetails: () => boolean;
  serviceInstancesAndBrokers: () => { instances: StServiceInstance[], brokers: any[] } | null;
  setServiceInstancesAndBrokers: ReturnType<typeof vi.fn>;
  orgs: () => Array<{ guid: string; name: string }>;
  spaces: () => Array<{ guid: string; name: string; orgGuid: string }>;
};

function makeRegistry(entries: Array<Partial<FakeDs> & { guid: string }>): { registry: EndpointDataRegistry; fakes: Map<string, FakeDs> } {
  const fakes = new Map<string, FakeDs>();
  for (const e of entries) {
    fakes.set(e.guid, {
      guid: e.guid,
      isLoadingServicesDetails: e.isLoadingServicesDetails ?? (() => false),
      serviceInstancesAndBrokers: e.serviceInstancesAndBrokers ?? (() => null),
      setServiceInstancesAndBrokers: vi.fn(),
      orgs: e.orgs ?? (() => []),
      spaces: e.spaces ?? (() => []),
    });
  }
  const registry = {
    acquire: vi.fn((guid: string) => {
      let f = fakes.get(guid);
      if (!f) {
        f = {
          guid,
          isLoadingServicesDetails: () => false,
          serviceInstancesAndBrokers: () => null,
          setServiceInstancesAndBrokers: vi.fn(),
          orgs: () => [],
          spaces: () => [],
        };
        fakes.set(guid, f);
      }
      return f as any;
    }),
    release: vi.fn(),
  } as unknown as EndpointDataRegistry;
  return { registry, fakes };
}

function makeSvc(http: HttpClient, registry?: EndpointDataRegistry): CfServiceInstancesSignalConfigService {
  TestBed.configureTestingModule({
    providers: [
      { provide: HttpClient, useValue: http },
      { provide: CloudFoundryService, useValue: makeStubCfService() },
      ...(registry ? [{ provide: EndpointDataRegistry, useValue: registry }] : []),
      CfServiceInstancesSignalConfigService,
    ],
  });
  return TestBed.inject(CfServiceInstancesSignalConfigService);
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfServiceInstancesSignalConfigService cache wiring', () => {
  it('cache-miss: orchestrator fires HTTP and writes back to registry', async () => {
    const seedInstance = makeInstance({ guid: 'si-1', name: 'mysql-1' });
    const http = makeHttp([seedInstance]);
    const { registry, fakes } = makeRegistry([{ guid: 'cnsi-1' }]);
    const svc = makeSvc(http, registry);
    svc.initialize(['cnsi-1']);
    await svc.loadAll();
    expect((http.get as any)).toHaveBeenCalled();
    expect(svc.orchestrator.sources[0].items().map(s => s.guid)).toEqual(['si-1']);
    const fake = fakes.get('cnsi-1')!;
    expect(fake.setServiceInstancesAndBrokers).toHaveBeenCalledTimes(1);
    const [instancesArg, brokersArg] = fake.setServiceInstancesAndBrokers.mock.calls[0];
    expect(instancesArg.map((i: StServiceInstance) => i.guid)).toEqual(['si-1']);
    expect(brokersArg).toEqual([]);
  });

  it('cache-hit: source pre-seeded for instant paint; loadAll() still revalidates over HTTP (#5766)', async () => {
    const cached = [makeInstance({ guid: 'cached-1', name: 'cached' })];
    const fresh = [makeInstance({ guid: 'cached-1', name: 'cached' }), makeInstance({ guid: 'fresh-2' })];
    const http = makeHttp(fresh);
    const { registry } = makeRegistry([
      {
        guid: 'cnsi-1',
        isLoadingServicesDetails: () => false,
        serviceInstancesAndBrokers: () => ({ instances: cached, brokers: [] }),
      },
    ]);
    const svc = makeSvc(http, registry);
    svc.initialize(['cnsi-1']);
    // Seed paints immediately, before any fetch resolves.
    expect(svc.orchestrator.sources[0].items().map(s => s.guid)).toEqual(['cached-1']);
    expect(svc.orchestrator.sources[0].done()).toBe(true);
    await svc.loadAll();
    // Stale-while-revalidate: the drain runs and the backend's rows win.
    expect((http.get as any)).toHaveBeenCalled();
    expect(svc.orchestrator.sources[0].items().map(s => s.guid)).toEqual(['cached-1', 'fresh-2']);
  });

  it('skips pre-seed when isLoadingServicesDetails() is true (race-condition gate)', async () => {
    const cached = [makeInstance({ guid: 'cached-1' })];
    const httpResult = [makeInstance({ guid: 'fresh-1' })];
    const http = makeHttp(httpResult);
    const { registry } = makeRegistry([
      {
        guid: 'cnsi-1',
        isLoadingServicesDetails: () => true,
        serviceInstancesAndBrokers: () => ({ instances: cached, brokers: [] }),
      },
    ]);
    const svc = makeSvc(http, registry);
    svc.initialize(['cnsi-1']);
    expect(svc.orchestrator.sources[0].items()).toEqual([]);
    await svc.loadAll();
    expect((http.get as any)).toHaveBeenCalled();
    expect(svc.orchestrator.sources[0].items().map(s => s.guid)).toEqual(['fresh-1']);
  });

  it('initializeForSpace pre-seeds from cache when warm', async () => {
    const cached = [makeInstance({ guid: 'cached-1', space: { guid: 'sp-1', name: 'dev' } })];
    const http = makeHttp([]);
    const { registry } = makeRegistry([
      {
        guid: 'cnsi-1',
        isLoadingServicesDetails: () => false,
        serviceInstancesAndBrokers: () => ({ instances: cached, brokers: [] }),
      },
    ]);
    const svc = makeSvc(http, registry);
    svc.initializeForSpace('cnsi-1', 'sp-1');
    expect(svc.orchestrator.sources[0].items().map(s => s.guid)).toEqual(['cached-1']);
    await svc.loadAll();
    // Seed is paint-only; the space tab still revalidates (#5766).
    expect((http.get as any)).toHaveBeenCalled();
  });

  it('initializeForOffering pre-seeds from cache when warm', async () => {
    const cached = [makeInstance({ guid: 'cached-1' })];
    const http = makeHttp([]);
    const { registry } = makeRegistry([
      {
        guid: 'cnsi-1',
        isLoadingServicesDetails: () => false,
        serviceInstancesAndBrokers: () => ({ instances: cached, brokers: [] }),
      },
    ]);
    const svc = makeSvc(http, registry);
    svc.initializeForOffering('cnsi-1', 'offering-1');
    expect(svc.orchestrator.sources[0].items().map(s => s.guid)).toEqual(['cached-1']);
    await svc.loadAll();
    // Seed is paint-only; the offering tab still revalidates (#5766).
    expect((http.get as any)).toHaveBeenCalled();
  });

  it('without a registry provided, behaves exactly like before (no preSeed, no write-back)', async () => {
    const http = makeHttp([makeInstance({ guid: 'si-1' })]);
    const svc = makeSvc(http);
    svc.initialize(['cnsi-1']);
    await svc.loadAll();
    expect((http.get as any)).toHaveBeenCalled();
    expect(svc.orchestrator.sources[0].items().map(s => s.guid)).toEqual(['si-1']);
  });
});

// Routes instance loads vs the batched service_keys count fetch onto one mock,
// branching on the URL so a single test can drive both.
function makeRoutingHttp(opts: {
  instances: StServiceInstance[];
  keys?: Array<{ owner: string }>;
  keysFail?: boolean;
}): HttpClient {
  const instancesBody = {
    resources: opts.instances,
    pagination: {
      totalResults: opts.instances.length, totalPages: 1,
      next: null, previous: null, first: { href: '' }, last: { href: '' },
    },
  };
  const keysBody = {
    resources: (opts.keys ?? []).map((k, i) => ({
      guid: `key-${i}`,
      relationships: { service_instance: { data: { guid: k.owner } } },
    })),
  };
  return {
    get: vi.fn((url: string) => {
      if (typeof url === 'string' && url.includes('/service_keys/')) {
        return opts.keysFail ? throwError(() => new Error('boom')) : of(keysBody);
      }
      return of(instancesBody);
    }),
  } as unknown as HttpClient;
}

const flush = () => new Promise(r => setTimeout(r));

describe('CfServiceInstancesSignalConfigService — lazy service-key counts', () => {
  it('counts keys per instance from one batched request (2 / 0 split)', async () => {
    const instances = [
      makeInstance({ guid: 'si-a', cnsiGuid: 'cnsi-1' }),
      makeInstance({ guid: 'si-b', cnsiGuid: 'cnsi-1' }),
    ];
    const http = makeRoutingHttp({ instances, keys: [{ owner: 'si-a' }, { owner: 'si-a' }] });
    const svc = makeSvc(http);
    svc.initialize(['cnsi-1']);
    await svc.loadAll();

    svc.ensureServiceKeyCounts();
    await flush();

    expect(svc.serviceKeyCount('si-a')).toBe(2);
    expect(svc.serviceKeyCount('si-b')).toBe(0);
  });

  it('issues a single batched service_keys request for the CNSI', async () => {
    const instances = [
      makeInstance({ guid: 'si-a', cnsiGuid: 'cnsi-1' }),
      makeInstance({ guid: 'si-b', cnsiGuid: 'cnsi-1' }),
    ];
    const http = makeRoutingHttp({ instances, keys: [] });
    const svc = makeSvc(http);
    svc.initialize(['cnsi-1']);
    await svc.loadAll();

    svc.ensureServiceKeyCounts();
    svc.ensureServiceKeyCounts(); // idempotent: no duplicate fetch
    await flush();

    const keyCalls = (http.get as any).mock.calls.filter((c: any[]) => String(c[0]).includes('/service_keys/'));
    expect(keyCalls.length).toBe(1);
  });

  it('leaves counts undefined when the batched request fails (tolerated)', async () => {
    const instances = [makeInstance({ guid: 'si-a', cnsiGuid: 'cnsi-1' })];
    const http = makeRoutingHttp({ instances, keysFail: true });
    const svc = makeSvc(http);
    svc.initialize(['cnsi-1']);
    await svc.loadAll();

    svc.ensureServiceKeyCounts();
    await flush();

    expect(svc.serviceKeyCount('si-a')).toBeUndefined();
  });

  it('does not fetch counts for user-provided instances (no keys page)', async () => {
    const instances = [makeInstance({ guid: 'ups-1', cnsiGuid: 'cnsi-1', type: 'user-provided' })];
    const http = makeRoutingHttp({ instances });
    const svc = makeSvc(http);
    svc.initialize(['cnsi-1']);
    await svc.loadAll();

    svc.ensureServiceKeyCounts();
    await flush();

    const keyCalls = (http.get as any).mock.calls.filter((c: any[]) => String(c[0]).includes('/service_keys/'));
    expect(keyCalls.length).toBe(0);
    expect(svc.serviceKeyCount('ups-1')).toBeUndefined();
  });
});

// A host page: its DestroyRef ends the poll when the page closes.
function makeHost(): { host: DestroyRef; close: () => void } {
  const hooks: Array<() => void> = [];
  const host = { destroyed: false, onDestroy: (fn: () => void) => { hooks.push(fn); return () => {}; } };
  return {
    host: host as unknown as DestroyRef,
    close: () => { host.destroyed = true; hooks.forEach(fn => fn()); },
  };
}

// Answers each list read with whatever rows() holds at that moment.
function makeLiveHttp(rows: () => StServiceInstance[]) {
  return {
    get: vi.fn(() => of({
      resources: rows(),
      pagination: { totalResults: rows().length, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } },
    })),
  };
}

const withState = (state: string, overrides: Partial<StServiceInstance> = {}) =>
  makeInstance({ lastOperation: { type: 'create', state, description: '' }, ...overrides } as Partial<StServiceInstance>);

describe('CfServiceInstancesSignalConfigService — progress polling (#6002)', () => {
  afterEach(() => vi.useRealTimers());

  async function start(rows: () => StServiceInstance[], scope: (svc: CfServiceInstancesSignalConfigService) => void) {
    vi.useFakeTimers();
    const http = makeLiveHttp(rows);
    const svc = makeSvc(http as unknown as HttpClient, makeRegistry([{ guid: 'cnsi-1' }]).registry);
    scope(svc);
    await svc.loadAll();
    const page = makeHost();
    svc.startProgressPolling(page.host);
    TestBed.tick();
    const reads = () => http.get.mock.calls.length;
    return { svc, page, reads };
  }

  it('re-reads the list while a row is in progress and stops once it ends', async () => {
    let state = 'in progress';
    const { reads } = await start(() => [withState(state)], svc => svc.initialize(['cnsi-1']));

    const before = reads();
    await vi.advanceTimersByTimeAsync(10000);
    expect(reads()).toBe(before + 1);

    state = 'succeeded';
    await vi.advanceTimersByTimeAsync(10000);
    TestBed.tick();
    const settled = reads();
    await vi.advanceTimersByTimeAsync(60000);
    expect(reads()).toBe(settled);
  });

  // CF reports a queued operation as "initial" before "in progress".
  it('re-reads the list while an operation is queued', async () => {
    const { reads } = await start(() => [withState('initial')], svc => svc.initialize(['cnsi-1']));
    const before = reads();
    await vi.advanceTimersByTimeAsync(10000);
    expect(reads()).toBe(before + 1);
  });

  it('does not poll when nothing is in progress', async () => {
    const { reads } = await start(() => [withState('succeeded')], svc => svc.initialize(['cnsi-1']));
    const before = reads();
    await vi.advanceTimersByTimeAsync(60000);
    expect(reads()).toBe(before);
  });

  it('stops when the page closes', async () => {
    const { page, reads } = await start(() => [withState('in progress')], svc => svc.initialize(['cnsi-1']));
    page.close();
    const before = reads();
    await vi.advanceTimersByTimeAsync(60000);
    expect(reads()).toBe(before);
  });

  it('ignores an operation in progress outside the page scope', async () => {
    const rows = () => [withState('succeeded'), withState('in progress', { guid: 'si-2', space: { guid: 'sp-2', name: 'other' } } as Partial<StServiceInstance>)];
    const { reads } = await start(rows, svc => svc.initializeForSpace('cnsi-1', 'sp-1'));
    const before = reads();
    await vi.advanceTimersByTimeAsync(60000);
    expect(reads()).toBe(before);
  });

  it('follows a scope change made after the poll started', async () => {
    const rows = () => [withState('succeeded'), withState('in progress', { guid: 'si-2', space: { guid: 'sp-2', name: 'other' } } as Partial<StServiceInstance>)];
    const { svc, reads } = await start(rows, s => s.initializeForSpace('cnsi-1', 'sp-1'));
    svc.initializeForSpace('cnsi-1', 'sp-2');
    await svc.loadAll();
    TestBed.tick();
    const before = reads();
    await vi.advanceTimersByTimeAsync(10000);
    expect(reads()).toBe(before + 1);
  });
});
