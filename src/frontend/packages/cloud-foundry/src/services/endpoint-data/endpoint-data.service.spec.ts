import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { EndpointDataService } from './endpoint-data.service';
import { EndpointDataShim } from './endpoint-data.shim';

const ORGS_URL = '/pp/v1/cf/orgs/test-cnsi-guid?return=counts';
const APPS_URL = '/pp/v1/cf/apps/test-cnsi-guid?return=recent';
const ROUTES_URL = '/pp/v1/cf/routes/test-cnsi-guid?return=counts';
const ORGS_FULL_URL = '/pp/v1/cf/orgs/test-cnsi-guid?per_page=500&page=1';
const APPS_FULL_URL = '/pp/v1/cf/apps/test-cnsi-guid?per_page=500&page=1';
const SPACES_FULL_URL = '/pp/v1/cf/spaces/test-cnsi-guid?per_page=500&page=1';

const SERVICE_INSTANCES_COUNTS_URL = '/pp/v1/cf/service_instances/test-cnsi-guid?return=counts';
const SERVICE_OFFERINGS_COUNTS_URL = '/pp/v1/cf/service_offerings/test-cnsi-guid?return=counts';
const SERVICE_PLANS_COUNTS_URL = '/pp/v1/cf/service_plans/test-cnsi-guid?return=counts';
const SERVICE_BROKERS_COUNTS_URL = '/pp/v1/cf/service_brokers/test-cnsi-guid?return=counts';

describe('EndpointDataService', () => {
  let httpMock: HttpTestingController;
  let shimSpy: { write: ReturnType<typeof vi.fn> };
  let service: EndpointDataService;
  let diagnostics: StratosDiagnostics;

  beforeEach(() => {
    shimSpy = { write: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EndpointDataShim, useValue: shimSpy },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    diagnostics = TestBed.inject(StratosDiagnostics);
    diagnostics.reset();
    service = new EndpointDataService(
      TestBed.inject(HttpClient),
      shimSpy as unknown as EndpointDataShim,
      'test-cnsi-guid',
      diagnostics,
    );
  });

  afterEach(() => httpMock.verify());

  it('starts with empty signals and isLoading false', () => {
    expect(service.orgs()).toEqual([]);
    expect(service.apps()).toEqual([]);
    expect(service.recentApps()).toEqual([]);
    expect(service.spaces()).toEqual([]);
    expect(service.orgCount()).toBe(0);
    expect(service.appCount()).toBe(0);
    expect(service.routeCount()).toBe(0);
    expect(service.isLoading()).toBeFalsy();
    expect(service.isLoadingDetails()).toBeFalsy();
    expect(service.errors()).toEqual([]);
    expect(service.lastFetched()).toBeNull();
    expect(service.detailsLastFetched()).toBeNull();
  });

  it('sets isLoading true while counts requests are in flight', () => {
    service.load().subscribe();
    expect(service.isLoading()).toBeTruthy();
    httpMock.expectOne(ORGS_URL).flush({ resources: [], totalResults: 0 });
    httpMock.expectOne(APPS_URL).flush({ resources: [], totalResults: 0 });
    httpMock.expectOne(ROUTES_URL).flush({ totalResults: 0 });
  });

  it('updates count signals and recent apps from load()', async () => {
    // Backend now echoes cnsiGuid on every StApp/StOrg/StSpace; mocks
    // shape responses the same way the real handlers do.
    const mockRecentApps = [
      { guid: 'app-1', name: 'App One', state: 'STARTED', cnsiGuid: 'test-cnsi-guid', orgGuid: '', spaceGuid: 'sp-1', instances: 1, createdAt: '', updatedAt: '' },
    ];
    service.load().subscribe();
    httpMock.expectOne(ORGS_URL).flush({ resources: [], totalResults: 56 });
    httpMock.expectOne(APPS_URL).flush({ resources: mockRecentApps, totalResults: 123 });
    httpMock.expectOne(ROUTES_URL).flush({ totalResults: 47 });
    await Promise.resolve();
    expect(service.orgCount()).toBe(56);
    expect(service.appCount()).toBe(123);
    expect(service.routeCount()).toBe(47);
    expect(service.recentApps()).toEqual(mockRecentApps);
    // load() does not populate the full arrays — that's loadDetails()'s job.
    expect(service.orgs()).toEqual([]);
    expect(service.apps()).toEqual([]);
    expect(service.spaces()).toEqual([]);
    expect(service.isLoading()).toBeFalsy();
    expect(service.lastFetched()).not.toBeNull();
  });

  it('adds error when one sub-request fails', async () => {
    service.load().subscribe({ error: () => {} });
    httpMock.expectOne(ORGS_URL).flush({ resources: [], totalResults: 56 });
    httpMock.expectOne(APPS_URL).error(new ErrorEvent('Network error'));
    httpMock.expectOne(ROUTES_URL).flush({ totalResults: 0 });
    await Promise.resolve();
    expect(service.orgCount()).toBe(56);
    expect(service.errors().length).toBe(1);
    expect(service.errors()[0].resource).toBe('apps');
    expect(service.errors()[0].recoverable).toBeTruthy();
    expect(service.isLoading()).toBeFalsy();
  });

  it('retains count signals across a second load that fails', async () => {
    service.load().subscribe();
    httpMock.expectOne(ORGS_URL).flush({ resources: [], totalResults: 56 });
    httpMock.expectOne(APPS_URL).flush({ resources: [], totalResults: 0 });
    httpMock.expectOne(ROUTES_URL).flush({ totalResults: 0 });
    await Promise.resolve();

    service.load().subscribe({ error: () => {} });
    httpMock.expectOne(ORGS_URL).error(new ErrorEvent('Network error'));
    httpMock.expectOne(APPS_URL).flush({ resources: [], totalResults: 0 });
    httpMock.expectOne(ROUTES_URL).flush({ totalResults: 0 });
    await Promise.resolve();

    expect(service.orgCount()).toBe(56);
  });

  it('does NOT call shim.write() from load() — only loadDetails() dispatches to the store', async () => {
    service.load().subscribe();
    httpMock.expectOne(ORGS_URL).flush({ resources: [], totalResults: 0 });
    httpMock.expectOne(APPS_URL).flush({ resources: [], totalResults: 0 });
    httpMock.expectOne(ROUTES_URL).flush({ totalResults: 0 });
    await Promise.resolve();
    expect(shimSpy.write).not.toHaveBeenCalled();
  });

  it('loadDetails() populates full orgs, apps, spaces and fires shim.write', async () => {
    // Backend echoes cnsiGuid on every StOrg/StApp/StSpace; mocks shape
    // the responses the same way the native handlers do so the service
    // reads the field directly without any client-side stamping.
    const mockOrgs = [{ guid: 'org-1', cnsiGuid: 'test-cnsi-guid', name: 'Org One', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '' }];
    const mockApps = [
      { guid: 'app-1', cnsiGuid: 'test-cnsi-guid', name: 'App One', state: 'STARTED', orgGuid: '', spaceGuid: 'sp-1', instances: 1, createdAt: '', updatedAt: '' },
      { guid: 'app-2', cnsiGuid: 'test-cnsi-guid', name: 'App Two', state: 'STOPPED', orgGuid: '', spaceGuid: 'sp-2', instances: 0, createdAt: '', updatedAt: '' },
    ];
    const mockSpaces = [
      { guid: 'sp-1', cnsiGuid: 'test-cnsi-guid', name: 'Space One', orgGuid: 'org-1', createdAt: '', updatedAt: '' },
    ];
    service.loadDetails().subscribe();
    expect(service.isLoadingDetails()).toBeTruthy();
    httpMock.expectOne(ORGS_FULL_URL).flush({ resources: mockOrgs, totalResults: 1 });
    httpMock.expectOne(APPS_FULL_URL).flush({ resources: mockApps, totalResults: 2 });
    httpMock.expectOne(SPACES_FULL_URL).flush({ resources: mockSpaces, totalResults: 1 });
    await Promise.resolve();
    expect(service.orgs()).toEqual(mockOrgs);
    expect(service.apps()).toEqual(mockApps);
    expect(service.spaces()).toEqual(mockSpaces);
    expect(service.orgCount()).toBe(1);
    expect(service.appCount()).toBe(2);
    expect(service.isLoadingDetails()).toBeFalsy();
    expect(service.detailsLastFetched()).not.toBeNull();
    expect(shimSpy.write).toHaveBeenCalledWith(
      'test-cnsi-guid',
      expect.objectContaining({
        orgs: mockOrgs, orgCount: 1,
        apps: mockApps, appCount: 2,
        spaces: mockSpaces,
      }),
    );
  });

  it('loadDetails() drains all pages when pagination.totalPages > 1', async () => {
    // Regression guard: the previous implementation capped at ?page=1
    // (silently truncating to 500 rows on large CFs). The drain fetches
    // page 1 inline, then pages 2..N in parallel via the totalPages
    // metadata from the StratosPagedResponse envelope.
    const orgsPage1 = [
      { guid: 'org-1', name: 'Org One', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '' },
    ];
    const orgsPage2 = [
      { guid: 'org-2', name: 'Org Two', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '' },
    ];
    const orgsPage3 = [
      { guid: 'org-3', name: 'Org Three', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '' },
    ];

    service.loadDetails().subscribe();

    // Page 1 fires for all three resources; apps + spaces report single-
    // page totalPages so they don't drain further.
    httpMock.expectOne(ORGS_FULL_URL).flush({
      resources: orgsPage1,
      pagination: { totalResults: 3, totalPages: 3 },
    });
    httpMock.expectOne(APPS_FULL_URL).flush({
      resources: [], pagination: { totalResults: 0, totalPages: 1 },
    });
    httpMock.expectOne(SPACES_FULL_URL).flush({
      resources: [], pagination: { totalResults: 0, totalPages: 1 },
    });

    // After page 1 lands, the orgs drain triggers pages 2 + 3 in parallel.
    httpMock.expectOne('/pp/v1/cf/orgs/test-cnsi-guid?per_page=500&page=2').flush({
      resources: orgsPage2,
      pagination: { totalResults: 3, totalPages: 3 },
    });
    httpMock.expectOne('/pp/v1/cf/orgs/test-cnsi-guid?per_page=500&page=3').flush({
      resources: orgsPage3,
      pagination: { totalResults: 3, totalPages: 3 },
    });

    await Promise.resolve();

    expect(service.orgs().length).toBe(3);
    expect(service.orgs().map(o => o.guid)).toEqual(['org-1', 'org-2', 'org-3']);
    expect(service.orgCount()).toBe(3);
  });

  it('loadDetails() reads totalResults from the StratosPagedResponse pagination envelope', async () => {
    // Regression: the bounded ?per_page passthrough wraps responses in
    // StratosPagedResponse — totals live under pagination.totalResults rather
    // than at the top level. dev.38 briefly broke the home card by reading
    // resp.totalResults (undefined) and zeroing the count signal after the
    // counts fast-path had already populated it. The tap reads either shape.
    const mockOrgs = [{ guid: 'org-1', name: 'Org One', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '' }];
    const mockApps = [{ guid: 'app-1', name: 'App One', state: 'STARTED', orgGuid: '', spaceGuid: '', instances: 1, createdAt: '', updatedAt: '' }];
    const mockSpaces = [{ guid: 'sp-1', name: 'Space One', orgGuid: 'org-1', createdAt: '', updatedAt: '' }];
    service.loadDetails().subscribe();
    httpMock.expectOne(ORGS_FULL_URL).flush({ resources: mockOrgs, pagination: { totalResults: 7 } });
    httpMock.expectOne(APPS_FULL_URL).flush({ resources: mockApps, pagination: { totalResults: 4 } });
    httpMock.expectOne(SPACES_FULL_URL).flush({ resources: mockSpaces, pagination: { totalResults: 12 } });
    await Promise.resolve();
    expect(service.orgCount()).toBe(7);
    expect(service.appCount()).toBe(4);
  });

  it('emits service-call-count + cache-miss on first load, cache-hit on warm second load', async () => {
    // First load — cold, should be cache-miss and fire HTTP.
    service.load().subscribe();
    httpMock.expectOne(ORGS_URL).flush({ resources: [], totalResults: 0 });
    httpMock.expectOne(APPS_URL).flush({ resources: [{ guid: 'a1', name: 'A', state: 'STARTED', orgGuid: '', spaceGuid: '', instances: 1, createdAt: '', updatedAt: '' }], totalResults: 1 });
    httpMock.expectOne(ROUTES_URL).flush({ totalResults: 0 });
    await Promise.resolve();

    // Second load — warm (lastFetched non-null, recentApps non-empty) — should
    // be cache-hit and short-circuit WITHOUT firing HTTP. httpMock.verify()
    // below would throw if any of the three URLs were re-requested.
    service.load().subscribe();
    await Promise.resolve();
    await diagnostics.waitForFlush();

    const snap = diagnostics.snapshot();
    const callCount = snap.counters['service-call-count']?.find(c => c.dimensions.method === 'load');
    expect(callCount?.count).toBe(2);
    const miss = snap.counters['cache-miss']?.find(c => c.dimensions.method === 'load');
    const hit = snap.counters['cache-hit']?.find(c => c.dimensions.method === 'load');
    expect(miss?.count).toBe(1);
    expect(hit?.count).toBe(1);
    httpMock.verify(); // no pending requests — confirms the cache-hit short-circuit
  });

  // -------------------------------------------------------------------------
  // Services-domain extension (services-domain signal+V3 slice, step 3)
  // -------------------------------------------------------------------------

  it('starts with empty service signals and 0 counts', () => {
    expect(service.serviceInstances()).toEqual([]);
    expect(service.serviceOfferings()).toEqual([]);
    expect(service.servicePlans()).toEqual([]);
    expect(service.serviceBrokers()).toEqual([]);
    expect(service.serviceCredentialBindings()).toEqual([]);
    expect(service.serviceInstancesCount()).toBe(0);
    expect(service.serviceOfferingsCount()).toBe(0);
    expect(service.servicePlansCount()).toBe(0);
    expect(service.serviceBrokersCount()).toBe(0);
    expect(service.isLoadingServicesCounts()).toBeFalsy();
    expect(service.servicesCountsLastFetched()).toBeNull();
  });

  it('loadServicesCounts() populates all four count signals in parallel', async () => {
    const promise = service.loadServicesCounts();
    expect(service.isLoadingServicesCounts()).toBeTruthy();
    httpMock.expectOne(SERVICE_INSTANCES_COUNTS_URL).flush({ totalResults: 17 });
    httpMock.expectOne(SERVICE_OFFERINGS_COUNTS_URL).flush({ totalResults: 42 });
    httpMock.expectOne(SERVICE_PLANS_COUNTS_URL).flush({ totalResults: 87 });
    httpMock.expectOne(SERVICE_BROKERS_COUNTS_URL).flush({ totalResults: 5 });
    await promise;
    expect(service.serviceInstancesCount()).toBe(17);
    expect(service.serviceOfferingsCount()).toBe(42);
    expect(service.servicePlansCount()).toBe(87);
    expect(service.serviceBrokersCount()).toBe(5);
    expect(service.isLoadingServicesCounts()).toBeFalsy();
    expect(service.servicesCountsLastFetched()).not.toBeNull();
  });

  it('loadServicesCounts() one failed call does not break the others', async () => {
    const promise = service.loadServicesCounts();
    httpMock.expectOne(SERVICE_INSTANCES_COUNTS_URL).flush({ totalResults: 17 });
    httpMock.expectOne(SERVICE_OFFERINGS_COUNTS_URL).error(new ErrorEvent('Network error'));
    httpMock.expectOne(SERVICE_PLANS_COUNTS_URL).flush({ totalResults: 87 });
    httpMock.expectOne(SERVICE_BROKERS_COUNTS_URL).flush({ totalResults: 5 });
    await promise;
    expect(service.serviceInstancesCount()).toBe(17);
    expect(service.serviceOfferingsCount()).toBe(0);
    expect(service.servicePlansCount()).toBe(87);
    expect(service.serviceBrokersCount()).toBe(5);
    const err = service.errors().find(e => e.resource === 'service-offerings-counts');
    expect(err).toBeDefined();
    expect(service.isLoadingServicesCounts()).toBeFalsy();
  });

  it('loadServicesCounts() returns Promise<void>, not Observable', () => {
    const result = service.loadServicesCounts();
    expect(result).toBeInstanceOf(Promise);
    httpMock.expectOne(SERVICE_INSTANCES_COUNTS_URL).flush({ totalResults: 0 });
    httpMock.expectOne(SERVICE_OFFERINGS_COUNTS_URL).flush({ totalResults: 0 });
    httpMock.expectOne(SERVICE_PLANS_COUNTS_URL).flush({ totalResults: 0 });
    httpMock.expectOne(SERVICE_BROKERS_COUNTS_URL).flush({ totalResults: 0 });
  });

  describe('services-cache accessors and setters', () => {
    it('serviceOfferingsAndPlans() returns null before any services-details fetch (cache cold)', () => {
      expect(service.serviceOfferingsAndPlans()).toBeNull();
    });

    it('serviceInstancesAndBrokers() returns null before any services-details fetch (cache cold)', () => {
      expect(service.serviceInstancesAndBrokers()).toBeNull();
    });

    it('setServiceOfferingsAndPlans() stamps timestamp and exposes the bundle on read', () => {
      const offerings = [{ guid: 'off-1', name: 'mysql' } as any];
      const plans = [{ guid: 'pl-1', name: 'small' } as any];
      service.setServiceOfferingsAndPlans(offerings, plans);
      const bundle = service.serviceOfferingsAndPlans();
      expect(bundle).not.toBeNull();
      expect(bundle!.offerings).toBe(offerings);
      expect(bundle!.plans).toBe(plans);
      expect(service.servicesDetailsLastFetched()).not.toBeNull();
    });

    it('setServiceInstancesAndBrokers() stamps timestamp and exposes the bundle on read', () => {
      const instances = [{ guid: 'si-1', name: 'cache' } as any];
      const brokers = [{ guid: 'br-1', name: 'broker' } as any];
      service.setServiceInstancesAndBrokers(instances, brokers);
      const bundle = service.serviceInstancesAndBrokers();
      expect(bundle).not.toBeNull();
      expect(bundle!.instances).toBe(instances);
      expect(bundle!.brokers).toBe(brokers);
      expect(service.servicesDetailsLastFetched()).not.toBeNull();
    });

    it('accessors return empty arrays (not null) when timestamp set but lists empty', () => {
      service.setServiceOfferingsAndPlans([], []);
      const bundle = service.serviceOfferingsAndPlans();
      expect(bundle).not.toBeNull();
      expect(bundle!.offerings).toEqual([]);
      expect(bundle!.plans).toEqual([]);
    });
  });
});
