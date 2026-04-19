import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EndpointDataService } from './endpoint-data.service';
import { EndpointDataShim } from './endpoint-data.shim';

describe('EndpointDataService', () => {
  let httpMock: HttpTestingController;
  let shimSpy: { write: ReturnType<typeof vi.fn> };
  let service: EndpointDataService;

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
    service = new EndpointDataService(
      TestBed.inject(HttpClient),
      shimSpy as unknown as EndpointDataShim,
      'test-cnsi-guid',
    );
  });

  afterEach(() => httpMock.verify());

  it('starts with empty signals and isLoading false', () => {
    expect(service.orgs()).toEqual([]);
    expect(service.apps()).toEqual([]);
    expect(service.routeCount()).toBe(0);
    expect(service.isLoading()).toBeFalsy();
    expect(service.errors()).toEqual([]);
    expect(service.lastFetched()).toBeNull();
  });

  it('sets isLoading true while requests are in flight', () => {
    service.load().subscribe();
    expect(service.isLoading()).toBeTruthy();
    httpMock.expectOne('/pp/v1/cf/orgs/test-cnsi-guid').flush({ resources: [], totalResults: 0 });
    httpMock.expectOne('/pp/v1/cf/apps/test-cnsi-guid').flush({ resources: [], totalResults: 0 });
    httpMock.expectOne('/pp/v1/cf/routes/test-cnsi-guid').flush({ totalResults: 0 });
  });

  it('updates orgs signal when orgs fetch completes', async () => {
    const mockOrgs = [{ guid: 'org-1', name: 'Org One', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', spaces: [] }];
    service.load().subscribe();
    httpMock.expectOne('/pp/v1/cf/orgs/test-cnsi-guid').flush({ resources: mockOrgs, totalResults: 1 });
    httpMock.expectOne('/pp/v1/cf/apps/test-cnsi-guid').flush({ resources: [], totalResults: 0 });
    httpMock.expectOne('/pp/v1/cf/routes/test-cnsi-guid').flush({ totalResults: 3 });
    await Promise.resolve();
    expect(service.orgs()).toEqual(mockOrgs);
    expect(service.orgCount()).toBe(1);
    expect(service.routeCount()).toBe(3);
    expect(service.isLoading()).toBeFalsy();
    expect(service.lastFetched()).not.toBeNull();
  });

  it('retains loaded data and adds error when one sub-request fails', async () => {
    const mockOrgs = [{ guid: 'org-1', name: 'Org One', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', spaces: [] }];
    service.load().subscribe({ error: () => {} });
    httpMock.expectOne('/pp/v1/cf/orgs/test-cnsi-guid').flush({ resources: mockOrgs, totalResults: 1 });
    httpMock.expectOne('/pp/v1/cf/apps/test-cnsi-guid').error(new ErrorEvent('Network error'));
    httpMock.expectOne('/pp/v1/cf/routes/test-cnsi-guid').flush({ totalResults: 0 });
    await Promise.resolve();
    expect(service.orgs()).toEqual(mockOrgs);
    expect(service.errors().length).toBe(1);
    expect(service.errors()[0].resource).toBe('apps');
    expect(service.errors()[0].recoverable).toBeTruthy();
    expect(service.isLoading()).toBeFalsy();
  });

  it('retains previously loaded data across a second load that fails', async () => {
    const mockOrgs = [{ guid: 'org-1', name: 'Org One', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', spaces: [] }];
    service.load().subscribe();
    httpMock.expectOne('/pp/v1/cf/orgs/test-cnsi-guid').flush({ resources: mockOrgs, totalResults: 1 });
    httpMock.expectOne('/pp/v1/cf/apps/test-cnsi-guid').flush({ resources: [], totalResults: 0 });
    httpMock.expectOne('/pp/v1/cf/routes/test-cnsi-guid').flush({ totalResults: 0 });
    await Promise.resolve();

    service.load().subscribe({ error: () => {} });
    httpMock.expectOne('/pp/v1/cf/orgs/test-cnsi-guid').error(new ErrorEvent('Network error'));
    httpMock.expectOne('/pp/v1/cf/apps/test-cnsi-guid').flush({ resources: [], totalResults: 0 });
    httpMock.expectOne('/pp/v1/cf/routes/test-cnsi-guid').flush({ totalResults: 0 });
    await Promise.resolve();

    expect(service.orgs()).toEqual(mockOrgs);
  });

  it('calls shim.write() with currentData() when load completes', async () => {
    service.load().subscribe();
    httpMock.expectOne('/pp/v1/cf/orgs/test-cnsi-guid').flush({ resources: [], totalResults: 0 });
    httpMock.expectOne('/pp/v1/cf/apps/test-cnsi-guid').flush({ resources: [], totalResults: 0 });
    httpMock.expectOne('/pp/v1/cf/routes/test-cnsi-guid').flush({ totalResults: 0 });
    await Promise.resolve();
    expect(shimSpy.write).toHaveBeenCalledWith('test-cnsi-guid', expect.objectContaining({ orgs: [], apps: [], routeCount: 0 }));
  });
});
