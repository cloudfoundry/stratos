import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';

import { ServiceCatalogDataService } from './service-catalog-data.service';

// Drives signal-native consumers of the V3-native catalog endpoints —
// /cf/service_offerings/:cnsi/:offeringGuid (detail), /cf/service_plans
// filtered by service_offering, /cf/service_brokers/:cnsi/:brokerGuid,
// /cf/service_plans/:cnsi/:planGuid/visibility. Each call hits one backend
// endpoint with no auto-drain and returns a SignalSource — value flips
// synchronously after req.flush() completes.

describe('ServiceCatalogDataService', () => {
  let service: ServiceCatalogDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ServiceCatalogDataService,
      ],
    });
    service = TestBed.inject(ServiceCatalogDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('serviceOffering hits /cf/service_offerings/:cnsi/:offeringGuid?return=details', () => {
    const source = service.serviceOffering('cnsi-1', 'off-1');
    expect(source.isLoading()).toBe(true);

    const req = httpMock.expectOne(r => r.url === '/pp/v1/cf/service_offerings/cnsi-1/off-1' && r.params.get('return') === 'details');
    expect(req.request.method).toBe('GET');
    req.flush({ guid: 'off-1', name: 'premium', description: 'd', broker: { guid: 'b-1', name: 'b1' }, tags: [], available: true, cnsiGuid: 'cnsi-1', createdAt: '', updatedAt: '' });

    expect(source.isLoading()).toBe(false);
    const res = source.value();
    expect(res?.guid).toBe('off-1');
    expect(res?.broker?.name).toBe('b1');
  });

  it('serviceOffering returns null on 404', () => {
    const source = service.serviceOffering('cnsi-1', 'missing');

    const req = httpMock.expectOne(r => r.url === '/pp/v1/cf/service_offerings/cnsi-1/missing' && r.params.get('return') === 'details');
    req.flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });

    expect(source.value()).toBeNull();
    expect(source.isLoading()).toBe(false);
    expect(source.error()).toBeNull();
  });

  it('servicePlansForOffering filters via ?service_offering and requests summary tier', () => {
    const source = service.servicePlansForOffering('cnsi-1', 'off-1');

    const req = httpMock.expectOne(r =>
      r.url === '/pp/v1/cf/service_plans/cnsi-1'
      && r.params.get('service_offering') === 'off-1'
      && r.params.get('return') === 'summary',
    );
    expect(req.request.method).toBe('GET');
    // Backend emits the nested-ref shape natively at summary+; offering
    // ref carries name + broker via the v3 include chain.
    req.flush({
      resources: [
        {
          guid: 'plan-1', cnsiGuid: 'cnsi-1', name: 'small', description: 'small plan',
          free: false, available: true, visibilityType: 'public',
          serviceOffering: { guid: 'off-1', name: 'redis', broker: { guid: 'broker-1', name: 'alpha' } },
          createdAt: '', updatedAt: '',
        },
      ],
      pagination: { totalResults: 1 },
    });

    const plans = source.value();
    expect(plans).toHaveLength(1);
    expect(plans[0].guid).toBe('plan-1');
    expect(plans[0].serviceOffering?.name).toBe('redis');
    expect(plans[0].serviceOffering?.broker?.name).toBe('alpha');
  });

  it('serviceBroker hits /cf/service_brokers/:cnsi/:brokerGuid?return=details and reads nested-ref shape', () => {
    const source = service.serviceBroker('cnsi-1', 'broker-7');

    const req = httpMock.expectOne(r => r.url === '/pp/v1/cf/service_brokers/cnsi-1/broker-7' && r.params.get('return') === 'details');
    expect(req.request.method).toBe('GET');
    // Backend emits the nested-ref shape natively at every non-counts tier
    // and stamps `_meta.unavailable: ['authUsername']` design-time.
    req.flush({
      guid: 'broker-7',
      cnsiGuid: 'cnsi-1',
      name: 'global',
      url: 'https://b.example',
      space: { guid: 'space-1', name: 'alpha' },
      labels: { team: 'platform' },
      annotations: {},
      createdAt: '',
      updatedAt: '',
      _meta: { unavailable: ['authUsername'] },
    });

    const broker = source.value();
    expect(broker?.guid).toBe('broker-7');
    expect(broker?.space?.guid).toBe('space-1');
    expect(broker?.space?.name).toBe('alpha');
    expect(broker?._meta?.unavailable).toEqual(['authUsername']);
  });

  it('serviceBroker returns null on 404', () => {
    const source = service.serviceBroker('cnsi-1', 'missing');

    const req = httpMock.expectOne(r => r.url === '/pp/v1/cf/service_brokers/cnsi-1/missing');
    req.flush({}, { status: 404, statusText: 'Not Found' });

    expect(source.value()).toBeNull();
  });

  it('planVisibility hits /cf/service_plans/:cnsi/:planGuid/visibility', () => {
    const source = service.planVisibility('cnsi-1', 'plan-1');

    const req = httpMock.expectOne('/pp/v1/cf/service_plans/cnsi-1/plan-1/visibility');
    expect(req.request.method).toBe('GET');
    req.flush({ type: 'organization', organizations: [{ guid: 'org-1', name: 'first' }] });

    const vis = source.value();
    expect(vis?.type).toBe('organization');
    expect(vis?.organizations).toHaveLength(1);
  });
});
