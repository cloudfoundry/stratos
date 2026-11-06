import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';

import { CnsiUsersSnapshotService } from './cnsi-users-snapshot.service';

// Minimal StUser-shaped rows — the service stores them opaquely.
const user = (guid: string) => ({
  guid,
  username: guid,
  presentationName: guid,
  origin: 'uaa',
  cnsiGuid: 'cnsi-1',
  orgRoles: [],
  spaceRoles: [],
  createdAt: '',
  updatedAt: '',
});

describe('CnsiUsersSnapshotService', () => {
  let service: CnsiUsersSnapshotService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CnsiUsersSnapshotService,
      ],
    });
    service = TestBed.inject(CnsiUsersSnapshotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('seeds null (loading sentinel) and populates from a single-page drain', async () => {
    const sig = service.users('cnsi-1');
    expect(sig()).toBeNull();

    const done = service.refresh('cnsi-1'); // dedupes onto the in-flight fetch
    const req = httpMock.expectOne('/pp/v1/cf/users/cnsi-1?per_page=500&page=1');
    expect(req.request.method).toBe('GET');
    req.flush({ resources: [user('u-1')], pagination: { totalResults: 1, totalPages: 1 } });
    await done;

    expect(sig()!.map(u => u.guid)).toEqual(['u-1']);
  });

  // Regression (#5805): a bare GET returned only the server's default first
  // page (50 users), so every summary-tile count derived from the snapshot
  // undercounted on foundations with more users. The drain must follow the
  // pagination meta to the last page.
  it('drains every page, not just the first', async () => {
    service.users('cnsi-1');
    const done = service.refresh('cnsi-1');

    const page1 = httpMock.expectOne('/pp/v1/cf/users/cnsi-1?per_page=500&page=1');
    page1.flush({ resources: [user('u-1')], pagination: { totalResults: 2, totalPages: 2 } });

    // Page 2 is requested only after page 1's meta arrives.
    await new Promise(resolve => setTimeout(resolve));
    const page2 = httpMock.expectOne('/pp/v1/cf/users/cnsi-1?per_page=500&page=2');
    page2.flush({ resources: [user('u-2')], pagination: { totalResults: 2, totalPages: 2 } });
    await done;

    expect(service.users('cnsi-1')()!.map(u => u.guid).sort()).toEqual(['u-1', 'u-2']);
  });

  it('marks the snapshot loaded-empty on a failed drain', async () => {
    const sig = service.users('cnsi-1');
    const done = service.refresh('cnsi-1');
    const req = httpMock.expectOne('/pp/v1/cf/users/cnsi-1?per_page=500&page=1');
    req.flush('boom', { status: 500, statusText: 'Server Error' });
    await done;

    expect(sig()).toEqual([]);
  });
});
