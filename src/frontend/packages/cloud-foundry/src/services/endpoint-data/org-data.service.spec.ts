import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OrgDataService } from './org-data.service';

describe('OrgDataService', () => {
  let httpMock: HttpTestingController;
  let service: OrgDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = new OrgDataService(TestBed.inject(HttpClient), 'cnsi-1', 'org-1');
  });

  afterEach(() => httpMock.verify());

  it('starts with null org, empty spaces, isLoading false', () => {
    expect(service.org()).toBeNull();
    expect(service.spaces()).toEqual([]);
    expect(service.isLoading()).toBeFalsy();
    expect(service.errors()).toEqual([]);
    expect(service.lastFetched()).toBeNull();
  });

  it('fetches org detail and spaces in parallel', async () => {
    const mockOrg = { guid: 'org-1', name: 'My Org', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', spaces: [] };
    const mockSpaces = [{ guid: 'sp-1', name: 'Space One', orgGuid: 'org-1', createdAt: '', updatedAt: '' }];

    service.load().subscribe();
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1').flush(mockOrg);
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1/spaces').flush({ resources: mockSpaces, totalResults: 1 });
    await Promise.resolve();

    expect(service.org()?.name).toBe('My Org');
    expect(service.spaces().length).toBe(1);
    expect(service.spaceCount()).toBe(1);
    expect(service.isLoading()).toBeFalsy();
    expect(service.lastFetched()).not.toBeNull();
  });

  it('retains org when spaces fetch fails', async () => {
    const mockOrg = { guid: 'org-1', name: 'My Org', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', spaces: [] };

    service.load().subscribe({ error: () => {} });
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1').flush(mockOrg);
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1/spaces').error(new ErrorEvent('Network error'));
    await Promise.resolve();

    expect(service.org()?.name).toBe('My Org');
    expect(service.errors().length).toBe(1);
    expect(service.errors()[0].resource).toBe('spaces');
    expect(service.isLoading()).toBeFalsy();
  });

  it('dedupes concurrent load() calls into a single HTTP fan-out', async () => {
    const mockOrg = { guid: 'org-1', name: 'My Org', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', spaces: [] };
    const mockSpaces: any[] = [];

    service.load().subscribe();
    service.load().subscribe();
    service.load().subscribe();

    // Concurrent callers must share one HTTP fan-out — expectOne would fail if
    // any caller spawned its own request.
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1').flush(mockOrg);
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1/spaces').flush({ resources: mockSpaces, totalResults: 0 });
    await Promise.resolve();

    expect(service.org()?.name).toBe('My Org');
  });

  it('short-circuits load() once warm (no HTTP on second call)', async () => {
    const mockOrg = { guid: 'org-1', name: 'My Org', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', spaces: [] };

    service.load().subscribe();
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1').flush(mockOrg);
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1/spaces').flush({ resources: [], totalResults: 0 });
    await Promise.resolve();

    // Second call: cache is hot — expectNone for both URLs.
    service.load().subscribe();
    httpMock.expectNone('/pp/v1/cf/org/cnsi-1/org-1');
    httpMock.expectNone('/pp/v1/cf/org/cnsi-1/org-1/spaces');
  });

  it('patch() merges partial updates into the cached org detail', async () => {
    const mockOrg = { guid: 'org-1', name: 'Old', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', spaces: [], quotaGuid: 'q-1' };
    service.load().subscribe();
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1').flush(mockOrg);
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1/spaces').flush({ resources: [], totalResults: 0 });
    await Promise.resolve();

    service.patch({ name: 'New', quotaGuid: 'q-2' });

    expect(service.org()?.name).toBe('New');
    expect(service.org()?.quotaGuid).toBe('q-2');
    expect(service.org()?.status).toBe('active');
    expect(service.org()?.guid).toBe('org-1');
  });

  it('patch() is a no-op before the first load', () => {
    service.patch({ name: 'X' });
    expect(service.org()).toBeNull();
  });
});
