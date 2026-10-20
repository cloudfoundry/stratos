import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OrgDataService } from './org-data.service';

const SPACES_P1 = '/pp/v1/cf/org/cnsi-1/org-1/spaces?per_page=500&page=1';
const SPACES_P2 = '/pp/v1/cf/org/cnsi-1/org-1/spaces?per_page=500&page=2';

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
    httpMock.expectOne(SPACES_P1).flush({ resources: mockSpaces, totalResults: 1 });
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
    // A non-transient failure: the drain retries network errors and 5xx first.
    httpMock.expectOne(SPACES_P1).flush('denied', { status: 403, statusText: 'Forbidden' });
    await Promise.resolve();

    expect(service.org()?.name).toBe('My Org');
    expect(service.errors().length).toBe(1);
    expect(service.errors()[0].resource).toBe('spaces');
    expect(service.isLoading()).toBeFalsy();
  });

  it('records the reason CF gave when a fetch fails', async () => {
    service.load().subscribe({ error: () => {} });
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1').flush(
      { errors: [{ code: 10010, title: 'CF-OrganizationNotFound', detail: 'Organization not found' }] },
      { status: 404, statusText: 'Not Found' },
    );
    httpMock.expectOne(SPACES_P1).flush({ resources: [] });
    await Promise.resolve();

    expect(service.errors().find(e => e.resource === 'org')?.message).toBe('Organization not found');
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
    httpMock.expectOne(SPACES_P1).flush({ resources: mockSpaces, totalResults: 0 });
    await Promise.resolve();

    expect(service.org()?.name).toBe('My Org');
  });

  it('short-circuits load() once warm (no HTTP on second call)', async () => {
    const mockOrg = { guid: 'org-1', name: 'My Org', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', spaces: [] };

    service.load().subscribe();
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1').flush(mockOrg);
    httpMock.expectOne(SPACES_P1).flush({ resources: [], totalResults: 0 });
    await Promise.resolve();

    // Second call: cache is hot — expectNone for both URLs.
    service.load().subscribe();
    httpMock.expectNone('/pp/v1/cf/org/cnsi-1/org-1');
    httpMock.expectNone(SPACES_P1);
  });

  const anOrg = () => ({ guid: 'org-1', name: 'My Org', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', spaces: [] });
  const aSpace = (guid: string) => ({ guid, name: guid, orgGuid: 'org-1', cnsiGuid: 'cnsi-1', createdAt: '', updatedAt: '' } as any);

  // Without per_page the endpoint returns CF's default first page (50), and
  // an org with 61 spaces showed "50" on its Spaces tile.
  it('drains every page of the org spaces', async () => {
    service.load().subscribe();
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1').flush(anOrg());
    httpMock.expectOne(SPACES_P1).flush({ resources: [aSpace('sp-1')], pagination: { totalResults: 2, totalPages: 2 } });
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    httpMock.expectOne(SPACES_P2).flush({ resources: [aSpace('sp-2')], pagination: { totalResults: 2, totalPages: 2 } });
    await Promise.resolve();
    expect(service.spaces().map(s => s.guid)).toEqual(['sp-1', 'sp-2']);
  });

  it('patch() merges partial updates into the cached org detail', async () => {
    const mockOrg = { guid: 'org-1', name: 'Old', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', spaces: [], quotaGuid: 'q-1' };
    service.load().subscribe();
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1').flush(mockOrg);
    httpMock.expectOne(SPACES_P1).flush({ resources: [], totalResults: 0 });
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

  describe('space patches (parent-view sync on space create/delete)', () => {
    const mockOrg = { guid: 'org-1', name: 'My Org', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', spaces: [] };
    const sp = (guid: string) => ({ guid, name: guid, orgGuid: 'org-1', cnsiGuid: 'cnsi-1', createdAt: '', updatedAt: '' } as any);

    const loadWarm = async () => {
      service.load().subscribe();
      httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1').flush(mockOrg);
      httpMock.expectOne(SPACES_P1).flush({ resources: [sp('sp-1')], totalResults: 1 });
      await Promise.resolve();
    };

    it('applySpaceCreated appends to the cached spaces and bumps spaceCount', async () => {
      await loadWarm();
      service.applySpaceCreated(sp('sp-2'));
      expect(service.spaces().map(s => s.guid)).toEqual(['sp-1', 'sp-2']);
      expect(service.spaceCount()).toBe(2);
    });

    it('applySpaceCreated does not duplicate an already-cached space', async () => {
      await loadWarm();
      service.applySpaceCreated(sp('sp-1'));
      expect(service.spaces().map(s => s.guid)).toEqual(['sp-1']);
    });

    it('applySpaceDeleted removes the cached space', async () => {
      await loadWarm();
      service.applySpaceDeleted('sp-1');
      expect(service.spaces()).toEqual([]);
      expect(service.spaceCount()).toBe(0);
    });

    it('space patches are no-ops before the first load (fresh load wins)', () => {
      service.applySpaceCreated(sp('sp-2'));
      service.applySpaceDeleted('sp-2');
      expect(service.spaces()).toEqual([]);
      expect(service.lastFetched()).toBeNull();
    });
  });
});
