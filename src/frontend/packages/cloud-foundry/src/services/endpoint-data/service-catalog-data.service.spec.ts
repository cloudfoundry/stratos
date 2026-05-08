import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';

import { ServiceCatalogDataService } from './service-catalog-data.service';

// Drives signal-native consumers of the V3-native catalog endpoints —
// /cf/service_offerings/:cnsi/:offeringGuid (detail), /cf/service_plans
// filtered by service_offering, /cf/service_brokers/:cnsi/:brokerGuid,
// /cf/service_plans/:cnsi/:planGuid/visibility. Each call hits one backend
// endpoint with no auto-drain.

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

  it('serviceOffering hits /cf/service_offerings/:cnsi/:offeringGuid', async () => {
    const promise = new Promise<any>(resolve => service.serviceOffering('cnsi-1', 'off-1').subscribe(resolve));

    const req = httpMock.expectOne('/pp/v1/cf/service_offerings/cnsi-1/off-1');
    expect(req.request.method).toBe('GET');
    req.flush({ guid: 'off-1', name: 'premium', description: 'd', broker: { guid: 'b-1', name: 'b1' }, tags: [], available: true, cnsiGuid: 'cnsi-1', createdAt: '', updatedAt: '' });

    const res = await promise;
    expect(res.guid).toBe('off-1');
    expect(res.broker?.name).toBe('b1');
  });

  it('serviceOffering returns null on 404', async () => {
    const promise = new Promise<any>(resolve => service.serviceOffering('cnsi-1', 'missing').subscribe(resolve));

    const req = httpMock.expectOne('/pp/v1/cf/service_offerings/cnsi-1/missing');
    req.flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });

    const res = await promise;
    expect(res).toBeNull();
  });

  it('servicePlansForOffering filters via ?service_offering', async () => {
    const promise = new Promise<any>(resolve => service.servicePlansForOffering('cnsi-1', 'off-1').subscribe(resolve));

    const req = httpMock.expectOne(r => r.url === '/pp/v1/cf/service_plans/cnsi-1' && r.params.get('service_offering') === 'off-1');
    expect(req.request.method).toBe('GET');
    req.flush({
      resources: [
        { guid: 'plan-1', name: 'small', description: '', available: true, free: false, visibilityType: 'public', serviceOfferingGuid: 'off-1', costs: [], labels: {}, annotations: {}, cnsiGuid: 'cnsi-1', createdAt: '', updatedAt: '' },
      ],
      pagination: { totalResults: 1 },
    });

    const plans = await promise;
    expect(plans).toHaveLength(1);
    expect(plans[0].guid).toBe('plan-1');
  });

  it('serviceBroker hits /cf/service_brokers/:cnsi/:brokerGuid?return=details and reads nested-ref shape', async () => {
    const promise = new Promise<any>(resolve => service.serviceBroker('cnsi-1', 'broker-7').subscribe(resolve));

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

    const broker = await promise;
    expect(broker.guid).toBe('broker-7');
    expect(broker.space?.guid).toBe('space-1');
    expect(broker.space?.name).toBe('alpha');
    expect(broker._meta?.unavailable).toEqual(['authUsername']);
  });

  it('serviceBroker returns null on 404', async () => {
    const promise = new Promise<any>(resolve => service.serviceBroker('cnsi-1', 'missing').subscribe(resolve));

    const req = httpMock.expectOne(r => r.url === '/pp/v1/cf/service_brokers/cnsi-1/missing');
    req.flush({}, { status: 404, statusText: 'Not Found' });

    const res = await promise;
    expect(res).toBeNull();
  });

  it('planVisibility hits /cf/service_plans/:cnsi/:planGuid/visibility', async () => {
    const promise = new Promise<any>(resolve => service.planVisibility('cnsi-1', 'plan-1').subscribe(resolve));

    const req = httpMock.expectOne('/pp/v1/cf/service_plans/cnsi-1/plan-1/visibility');
    expect(req.request.method).toBe('GET');
    req.flush({ type: 'organization', organizations: [{ guid: 'org-1', name: 'first' }] });

    const vis = await promise;
    expect(vis.type).toBe('organization');
    expect(vis.organizations).toHaveLength(1);
  });
});
