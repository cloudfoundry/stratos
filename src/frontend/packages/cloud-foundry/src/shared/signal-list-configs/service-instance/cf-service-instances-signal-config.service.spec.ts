import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
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

  it('cache-hit: source pre-seeded; orchestrator load() does not fire HTTP', async () => {
    const cached = [makeInstance({ guid: 'cached-1', name: 'cached' })];
    const http = makeHttp([]);
    const { registry } = makeRegistry([
      {
        guid: 'cnsi-1',
        isLoadingServicesDetails: () => false,
        serviceInstancesAndBrokers: () => ({ instances: cached, brokers: [] }),
      },
    ]);
    const svc = makeSvc(http, registry);
    svc.initialize(['cnsi-1']);
    expect(svc.orchestrator.sources[0].items().map(s => s.guid)).toEqual(['cached-1']);
    expect(svc.orchestrator.sources[0].done()).toBe(true);
    await svc.loadAll();
    expect((http.get as any)).not.toHaveBeenCalled();
    expect(svc.orchestrator.sources[0].items().map(s => s.guid)).toEqual(['cached-1']);
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
    expect((http.get as any)).not.toHaveBeenCalled();
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
    expect((http.get as any)).not.toHaveBeenCalled();
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
