import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SpaceDataService } from './space-data.service';

describe('SpaceDataService', () => {
  let httpMock: HttpTestingController;
  let service: SpaceDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = new SpaceDataService(TestBed.inject(HttpClient), 'cnsi-1', 'sp-1');
  });

  afterEach(() => httpMock.verify());

  it('starts empty', () => {
    expect(service.space()).toBeNull();
    expect(service.isLoading()).toBeFalsy();
    expect(service.errors()).toEqual([]);
    expect(service.lastFetched()).toBeNull();
  });

  it('fetches space detail and preserves backend-echoed cnsiGuid', async () => {
    // Backend (getNativeSpaceDetail) echoes cnsiGuid on every StSpace
    // response so the resource is self-describing once items from multiple
    // CFs are merged; the frontend no longer stamps post-fetch.
    const mockSpace = {
      guid: 'sp-1', name: 'Space One', orgGuid: 'org-1',
      createdAt: '', updatedAt: '', cnsiGuid: 'cnsi-1',
      appCount: 3, routeCount: 5, allowSsh: true, quotaGuid: 'q-1',
    };

    service.load().subscribe();
    httpMock.expectOne('/pp/v1/cf/spaces/cnsi-1/sp-1').flush(mockSpace);
    await Promise.resolve();

    expect(service.space()?.name).toBe('Space One');
    expect(service.space()?.cnsiGuid).toBe('cnsi-1');
    expect(service.space()?.quotaGuid).toBe('q-1');
    expect(service.isLoading()).toBeFalsy();
  });

  it('records error on fetch failure', async () => {
    service.load().subscribe({ error: () => {} });
    httpMock.expectOne('/pp/v1/cf/spaces/cnsi-1/sp-1').error(new ErrorEvent('Network error'));
    await Promise.resolve();

    expect(service.space()).toBeNull();
    expect(service.errors().length).toBe(1);
    expect(service.errors()[0].resource).toBe('space');
  });

  it('dedupes concurrent load() calls into one HTTP fan-out', async () => {
    const mockSpace = {
      guid: 'sp-1', name: 'X', orgGuid: 'org-1',
      createdAt: '', updatedAt: '', cnsiGuid: '',
      appCount: 0, routeCount: 0, allowSsh: false,
    };

    service.load().subscribe();
    service.load().subscribe();
    service.load().subscribe();

    httpMock.expectOne('/pp/v1/cf/spaces/cnsi-1/sp-1').flush(mockSpace);
    await Promise.resolve();

    expect(service.space()?.name).toBe('X');
  });

  it('short-circuits load() once warm', async () => {
    const mockSpace = {
      guid: 'sp-1', name: 'X', orgGuid: 'org-1',
      createdAt: '', updatedAt: '', cnsiGuid: '',
      appCount: 0, routeCount: 0, allowSsh: false,
    };

    service.load().subscribe();
    httpMock.expectOne('/pp/v1/cf/spaces/cnsi-1/sp-1').flush(mockSpace);
    await Promise.resolve();

    service.load().subscribe();
    httpMock.expectNone('/pp/v1/cf/spaces/cnsi-1/sp-1');
  });
});
