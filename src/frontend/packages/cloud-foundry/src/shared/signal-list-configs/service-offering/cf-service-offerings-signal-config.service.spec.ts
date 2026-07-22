import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { GlobalEventService } from '@stratosui/core';
import { CfServiceOfferingsSignalConfigService } from './cf-service-offerings-signal-config.service';
import { CloudFoundryService } from '../../data-services/cloud-foundry.service';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import type { StServiceOffering } from '../../../services/endpoint-data/stratos-types';

// Stub the GlobalEventService — its real impl injects the ngrx Store
// which requires module wiring outside this spec's scope. The signal-
// config only calls publishEndpointErrors() from an effect, so a no-op
// fake is sufficient.
function makeStubEventService(): GlobalEventService {
  return { publishEndpointErrors: () => {} } as unknown as GlobalEventService;
}

function makeOffering(overrides: Partial<StServiceOffering> = {}): StServiceOffering {
  return {
    guid: 'off-1',
    name: 'redis',
    cnsiGuid: 'cnsi-1',
    description: 'in-memory data structure store',
    available: true,
    bindable: true,
    tags: ['redis'],
    ...overrides,
  } as StServiceOffering;
}

function makeHttp(offerings: StServiceOffering[] = []): HttpClient {
  return {
    get: vi.fn(() => of({
      resources: offerings,
      pagination: {
        totalResults: offerings.length,
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

// Minimal stub of the EndpointDataRegistry surface the signal-config uses
// (acquire-only). A fake EndpointDataService with the four methods the
// wire-up touches is good enough: serviceOfferingsAndPlans,
// isLoadingServicesDetails, setServiceOfferingsAndPlans + serviceInstancesAndBrokers
// for the two-config symmetry. We track method calls per cnsi guid so the
// tests can assert seed-from-cache vs. write-back-after-load behaviour.
type FakeDs = {
  guid: string;
  isLoadingServicesDetails: () => boolean;
  serviceOfferingsAndPlans: () => { offerings: StServiceOffering[], plans: any[] } | null;
  setServiceOfferingsAndPlans: ReturnType<typeof vi.fn>;
};

function makeRegistry(entries: Array<Partial<FakeDs> & { guid: string }>): { registry: EndpointDataRegistry; fakes: Map<string, FakeDs> } {
  const fakes = new Map<string, FakeDs>();
  for (const e of entries) {
    fakes.set(e.guid, {
      guid: e.guid,
      isLoadingServicesDetails: e.isLoadingServicesDetails ?? (() => false),
      serviceOfferingsAndPlans: e.serviceOfferingsAndPlans ?? (() => null),
      setServiceOfferingsAndPlans: vi.fn(),
    });
  }
  const registry = {
    acquire: vi.fn((guid: string) => {
      let f = fakes.get(guid);
      if (!f) {
        f = {
          guid,
          isLoadingServicesDetails: () => false,
          serviceOfferingsAndPlans: () => null,
          setServiceOfferingsAndPlans: vi.fn(),
        };
        fakes.set(guid, f);
      }
      return f as any;
    }),
  } as unknown as EndpointDataRegistry;
  return { registry, fakes };
}

function makeSvc(http: HttpClient, registry?: EndpointDataRegistry): CfServiceOfferingsSignalConfigService {
  TestBed.configureTestingModule({
    providers: [
      { provide: HttpClient, useValue: http },
      { provide: CloudFoundryService, useValue: makeStubCfService() },
      { provide: GlobalEventService, useValue: makeStubEventService() },
      ...(registry ? [{ provide: EndpointDataRegistry, useValue: registry }] : []),
      CfServiceOfferingsSignalConfigService,
    ],
  });
  return TestBed.inject(CfServiceOfferingsSignalConfigService);
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfServiceOfferingsSignalConfigService cache wiring', () => {
  it('cache-miss: orchestrator fires HTTP and writes back to registry', async () => {
    const seedOffering = makeOffering({ guid: 'srv-1', name: 'mysql' });
    const http = makeHttp([seedOffering]);
    const { registry, fakes } = makeRegistry([
      { guid: 'cnsi-1' /* serviceOfferingsAndPlans defaults to null = cold */ },
    ]);
    const svc = makeSvc(http, registry);
    svc.initialize(['cnsi-1']);
    await svc.loadAll();
    // HTTP fired once (cache cold).
    expect((http.get as any)).toHaveBeenCalled();
    expect(svc.orchestrator.sources[0].items().map(o => o.guid)).toEqual(['srv-1']);
    // Write-back happened.
    const fake = fakes.get('cnsi-1')!;
    expect(fake.setServiceOfferingsAndPlans).toHaveBeenCalledTimes(1);
    const [offeringsArg, plansArg] = fake.setServiceOfferingsAndPlans.mock.calls[0];
    expect(offeringsArg.map((o: StServiceOffering) => o.guid)).toEqual(['srv-1']);
    expect(plansArg).toEqual([]);
  });

  it('cache-hit: source pre-seeded from registry; orchestrator load() does not fire HTTP', async () => {
    const cached = [makeOffering({ guid: 'cached-1', name: 'cached' })];
    const http = makeHttp([]);
    const { registry } = makeRegistry([
      {
        guid: 'cnsi-1',
        isLoadingServicesDetails: () => false,
        serviceOfferingsAndPlans: () => ({ offerings: cached, plans: [] }),
      },
    ]);
    const svc = makeSvc(http, registry);
    svc.initialize(['cnsi-1']);
    // Pre-seed already happened in initialize(); items reflect the cache
    // before load() is even called.
    expect(svc.orchestrator.sources[0].items().map(o => o.guid)).toEqual(['cached-1']);
    expect(svc.orchestrator.sources[0].done()).toBe(true);
    await svc.loadAll();
    // HTTP did NOT fire — preSeed short-circuited _doLoad.
    expect((http.get as any)).not.toHaveBeenCalled();
    // Items still reflect the seeded cache.
    expect(svc.orchestrator.sources[0].items().map(o => o.guid)).toEqual(['cached-1']);
  });

  it('skips pre-seed when isLoadingServicesDetails() is true (race-condition gate)', async () => {
    const cached = [makeOffering({ guid: 'cached-1' })];
    const httpResult = [makeOffering({ guid: 'fresh-1' })];
    const http = makeHttp(httpResult);
    const { registry } = makeRegistry([
      {
        guid: 'cnsi-1',
        isLoadingServicesDetails: () => true,
        serviceOfferingsAndPlans: () => ({ offerings: cached, plans: [] }),
      },
    ]);
    const svc = makeSvc(http, registry);
    svc.initialize(['cnsi-1']);
    // Source NOT seeded — items stay empty until load() drains HTTP.
    expect(svc.orchestrator.sources[0].items()).toEqual([]);
    await svc.loadAll();
    expect((http.get as any)).toHaveBeenCalled();
    expect(svc.orchestrator.sources[0].items().map(o => o.guid)).toEqual(['fresh-1']);
  });

  it('without a registry provided, behaves exactly like before (no preSeed, no write-back)', async () => {
    const http = makeHttp([makeOffering({ guid: 'srv-1' })]);
    const svc = makeSvc(http); // no registry
    svc.initialize(['cnsi-1']);
    await svc.loadAll();
    expect((http.get as any)).toHaveBeenCalled();
    expect(svc.orchestrator.sources[0].items().map(o => o.guid)).toEqual(['srv-1']);
  });
});
