import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CfUsersPagedDataService } from './cf-users-paged-data.service';

const CNSI = 'cf1';
const P1 = `/pp/v1/cf/users/${CNSI}?per_page=500&page=1`;
const P2 = `/pp/v1/cf/users/${CNSI}?per_page=500&page=2`;
const mkUser = (g: string) => ({ guid: g, username: g, cnsiGuid: CNSI, orgRoles: [], spaceRoles: [] });

describe('CfUsersPagedDataService', () => {
  let svc: CfUsersPagedDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), CfUsersPagedDataService] });
    svc = TestBed.inject(CfUsersPagedDataService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('drains all server pages into the users signal', async () => {
    const p = firstValueFrom(svc.loadUsers(CNSI));
    http.expectOne(P1).flush({ resources: [mkUser('a')], pagination: { totalResults: 2, totalPages: 2 } });
    http.expectOne(P2).flush({ resources: [mkUser('b')], pagination: { totalResults: 2, totalPages: 2 } });
    await p;
    expect(svc.usersSignal(CNSI)().map(u => u.guid)).toEqual(['a', 'b']);
    expect(svc.count(CNSI)()).toBe(2);
  });

  it('dedupes concurrent loads (in-flight guard)', async () => {
    const a = firstValueFrom(svc.loadUsers(CNSI));
    const b = firstValueFrom(svc.loadUsers(CNSI));
    http.expectOne(P1).flush({ resources: [mkUser('a')], pagination: { totalResults: 1, totalPages: 1 } });
    await Promise.all([a, b]);
    http.expectNone(P1); // only one drain issued
  });

  it('surfaces a drain error via errorsByCnsi (not a silent empty success)', async () => {
    const p = firstValueFrom(svc.loadUsers(CNSI));
    http.expectOne(P1).flush('boom', { status: 500, statusText: 'Server Error' });
    await p;
    expect(svc.errorsByCnsi()(CNSI)).toBeTruthy();
    expect(svc.usersSignal(CNSI)()).toEqual([]);
  });

  it('getUser resolves from cache when drained, else hits the detail endpoint', async () => {
    const load = firstValueFrom(svc.loadUsers(CNSI));
    http.expectOne(P1).flush({ resources: [mkUser('a')], pagination: { totalResults: 1, totalPages: 1 } });
    await load;
    expect(await firstValueFrom(svc.getUser(CNSI, 'a'))).toMatchObject({ guid: 'a' });

    const detail = firstValueFrom(svc.getUser('cf2', 'z'));
    http.expectOne(`/pp/v1/cf/users/cf2/z`).flush(mkUser('z'));
    expect(await detail).toMatchObject({ guid: 'z' });
  });
});
