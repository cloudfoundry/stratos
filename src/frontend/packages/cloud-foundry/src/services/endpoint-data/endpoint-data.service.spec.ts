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
const ORGS_FULL_URL = '/pp/v1/cf/orgs/test-cnsi-guid';
const APPS_FULL_URL = '/pp/v1/cf/apps/test-cnsi-guid';
const SPACES_FULL_URL = '/pp/v1/cf/spaces/test-cnsi-guid';

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
    const mockRecentApps = [
      { guid: 'app-1', name: 'App One', state: 'STARTED', orgGuid: '', spaceGuid: 'sp-1', instances: 1, createdAt: '', updatedAt: '' },
    ];
    service.load().subscribe();
    httpMock.expectOne(ORGS_URL).flush({ resources: [], totalResults: 56 });
    httpMock.expectOne(APPS_URL).flush({ resources: mockRecentApps, totalResults: 123 });
    httpMock.expectOne(ROUTES_URL).flush({ totalResults: 47 });
    await Promise.resolve();
    expect(service.orgCount()).toBe(56);
    expect(service.appCount()).toBe(123);
    expect(service.routeCount()).toBe(47);
    expect(service.recentApps()).toEqual(mockRecentApps.map(a => ({ ...a, cnsiGuid: 'test-cnsi-guid' })));
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
    // HTTP responses from Jetstream don't carry cnsiGuid today — the service
    // injects it per-resource (Stratos contract direction, FWT-934) so every
    // entity carries cnsiGuid as a first-class field downstream.
    const mockOrgs = [{ guid: 'org-1', name: 'Org One', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '' }];
    const mockApps = [
      { guid: 'app-1', name: 'App One', state: 'STARTED', orgGuid: '', spaceGuid: 'sp-1', instances: 1, createdAt: '', updatedAt: '' },
      { guid: 'app-2', name: 'App Two', state: 'STOPPED', orgGuid: '', spaceGuid: 'sp-2', instances: 0, createdAt: '', updatedAt: '' },
    ];
    const mockSpaces = [
      { guid: 'sp-1', name: 'Space One', orgGuid: 'org-1', createdAt: '', updatedAt: '' },
    ];
    const withCnsi = <T>(arr: T[]) => arr.map(item => ({ ...item, cnsiGuid: 'test-cnsi-guid' }));
    service.loadDetails().subscribe();
    expect(service.isLoadingDetails()).toBeTruthy();
    httpMock.expectOne(ORGS_FULL_URL).flush({ resources: mockOrgs, totalResults: 1 });
    httpMock.expectOne(APPS_FULL_URL).flush({ resources: mockApps, totalResults: 2 });
    httpMock.expectOne(SPACES_FULL_URL).flush({ resources: mockSpaces, totalResults: 1 });
    await Promise.resolve();
    expect(service.orgs()).toEqual(withCnsi(mockOrgs));
    expect(service.apps()).toEqual(withCnsi(mockApps));
    expect(service.spaces()).toEqual(withCnsi(mockSpaces));
    expect(service.orgCount()).toBe(1);
    expect(service.appCount()).toBe(2);
    expect(service.isLoadingDetails()).toBeFalsy();
    expect(service.detailsLastFetched()).not.toBeNull();
    expect(shimSpy.write).toHaveBeenCalledWith(
      'test-cnsi-guid',
      expect.objectContaining({
        orgs: withCnsi(mockOrgs), orgCount: 1,
        apps: withCnsi(mockApps), appCount: 2,
        spaces: withCnsi(mockSpaces),
      }),
    );
  });

  it('emits service-call-count + cache-miss on first load, cache-hit on warm second load', async () => {
    // First load — cold, should be cache-miss
    service.load().subscribe();
    httpMock.expectOne(ORGS_URL).flush({ resources: [], totalResults: 0 });
    httpMock.expectOne(APPS_URL).flush({ resources: [{ guid: 'a1', name: 'A', state: 'STARTED', orgGuid: '', spaceGuid: '', instances: 1, createdAt: '', updatedAt: '' }], totalResults: 1 });
    httpMock.expectOne(ROUTES_URL).flush({ totalResults: 0 });
    await Promise.resolve();

    // Second load — warm (lastFetched non-null, recentApps non-empty) — should be cache-hit
    service.load().subscribe();
    httpMock.expectOne(ORGS_URL).flush({ resources: [], totalResults: 0 });
    httpMock.expectOne(APPS_URL).flush({ resources: [], totalResults: 0 });
    httpMock.expectOne(ROUTES_URL).flush({ totalResults: 0 });
    await Promise.resolve();
    await diagnostics.waitForFlush();

    const snap = diagnostics.snapshot();
    const callCount = snap.counters['service-call-count']?.find(c => c.dimensions.method === 'load');
    expect(callCount?.count).toBe(2);
    const miss = snap.counters['cache-miss']?.find(c => c.dimensions.method === 'load');
    const hit = snap.counters['cache-hit']?.find(c => c.dimensions.method === 'load');
    expect(miss?.count).toBe(1);
    expect(hit?.count).toBe(1);
  });
});
