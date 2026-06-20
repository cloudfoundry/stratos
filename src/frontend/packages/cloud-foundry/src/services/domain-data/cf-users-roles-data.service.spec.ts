import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TailwindSnackBarService } from '@stratosui/core';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { firstValueFrom } from 'rxjs';

import { StUser } from '../endpoint-data/stratos-types';
import { CnsiUsersSnapshotService } from '../endpoint-data/cnsi-users-snapshot.service';
import { CfUsersPagedDataService } from '../../shared/data-services/cf-users-paged-data.service';
import { CfRoleChange } from '../../store/types/users-roles.types';
import { CfUsersRolesDataService } from './cf-users-roles-data.service';

const userA = { guid: 'u-a', username: 'alice' } as unknown as StUser;

describe('CfUsersRolesDataService', () => {
  let svc: CfUsersRolesDataService;
  let httpMock: HttpTestingController;
  let snackBar: { open: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    snackBar = { open: vi.fn(), error: vi.fn() };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TailwindSnackBarService, useValue: snackBar },
        CfUsersRolesDataService,
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    svc = TestBed.inject(CfUsersRolesDataService);
  });

  it('starts from an empty default state', () => {
    expect(svc.cfGuid()).toBe('');
    expect(svc.users()).toEqual([]);
    expect(svc.changedRoles()).toEqual([]);
    expect(svc.orgGuid()).toBe('');
  });

  it('setUsers seeds users + cfGuid, retains the selected org, and records origin', () => {
    svc.setOrg('org-1', 'Org 1');
    svc.setUsers('cf-1', [userA], 'ldap');

    expect(svc.cfGuid()).toBe('cf-1');
    expect(svc.users().map(u => u.guid)).toEqual(['u-a']);
    expect(svc.orgGuid()).toBe('org-1');
    expect(svc.state().usernameOrigin).toBe('ldap');
  });

  it('clear resets to defaults', () => {
    svc.setUsers('cf-1', [userA]);
    svc.setIsRemove(true);
    svc.clear();

    expect(svc.cfGuid()).toBe('');
    expect(svc.users()).toEqual([]);
    expect(svc.isRemove()).toBeUndefined();
  });

  it('setOrgRole sets the requested role', () => {
    svc.setOrg('org-1', 'Org 1');
    svc.setOrgRole('org-1', 'Org 1', 'auditors', true);

    expect(svc.newRoles().permissions.auditors).toBe(true);
  });

  it('setOrgRole for a non-user role auto-adds the org user role', () => {
    svc.setOrg('org-1', 'Org 1');
    svc.setOrgRole('org-1', 'Org 1', 'managers', true);

    expect(svc.newRoles().permissions.managers).toBe(true);
    expect(svc.newRoles().permissions.users).toBe(true);
  });

  it('setSpaceRole sets the space role and auto-adds the org user role', () => {
    svc.setOrg('org-1', 'Org 1');
    svc.setSpaceRole('org-1', 'Org 1', 'sp-1', 'Space 1', 'developers', true);

    expect(svc.newRoles().spaces!['sp-1'].permissions.developers).toBe(true);
    expect(svc.newRoles().permissions.users).toBe(true);
  });

  it('does not auto-add the org user role when setting by username', () => {
    svc.setOrg('org-1', 'Org 1');
    svc.setIsSetByUsername(true);
    svc.setOrgRole('org-1', 'Org 1', 'managers', true);

    expect(svc.newRoles().permissions.managers).toBe(true);
    expect(svc.newRoles().permissions.users).toBeUndefined();
  });

  it('flipSetRoles inverts add on every change', () => {
    const c1: CfRoleChange = { userGuid: 'u-a', orgGuid: 'org-1', add: true, role: 'managers' as any, orgName: 'Org 1' };
    const c2: CfRoleChange = { userGuid: 'u-a', orgGuid: 'org-1', add: false, role: 'auditors' as any, orgName: 'Org 1' };
    svc.setChanges([c1, c2]);
    svc.flipSetRoles();

    expect(svc.changedRoles().map(c => c.add)).toEqual([false, true]);
  });

  it('executeChanges posts changes mapped to V3 role types and scope', async () => {
    svc.setUsers('cf-1', [userA]);
    svc.setChanges([
      { userGuid: 'u-a', orgGuid: 'org-1', add: true, role: 'managers' as any, orgName: 'Org 1' },
      { userGuid: 'u-a', orgGuid: 'org-1', spaceGuid: 'sp-1', add: false, role: 'developers' as any, orgName: 'Org 1', spaceName: 'Space 1' },
    ]);

    const done = svc.executeChanges();

    const req = httpMock.expectOne('/pp/v1/cf/roles/cf-1/changes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.changes).toEqual([
      { userGuid: 'u-a', orgGuid: 'org-1', type: 'organization_manager', add: true },
      { userGuid: 'u-a', spaceGuid: 'sp-1', type: 'space_developer', add: false },
    ]);
    req.flush({ results: [{ index: 0, success: true }, { index: 1, success: true }] });

    await expect(done).resolves.toBeUndefined();
    expect(snackBar.open).toHaveBeenCalled();
  });

  it('executeChanges identifies users by username+origin when setting by username', async () => {
    // Set-by-username users carry synthetic guids (username/cfGuid/orgGuid);
    // the wire payload must use username+origin instead so the backend can
    // create/resolve the real user.
    const synthetic = { guid: 'newbie/cf-1/org-1', username: 'newbie' } as unknown as StUser;
    svc.setIsSetByUsername(true);
    svc.setUsers('cf-1', [synthetic], 'uaa');
    svc.setChanges([
      { userGuid: 'newbie/cf-1/org-1', orgGuid: 'org-1', spaceGuid: 'sp-1', add: true, role: 'developers' as any, orgName: 'Org 1', spaceName: 'Space 1' },
    ]);

    const done = svc.executeChanges();

    const req = httpMock.expectOne('/pp/v1/cf/roles/cf-1/changes');
    expect(req.request.body.changes).toEqual([
      { username: 'newbie', origin: 'uaa', spaceGuid: 'sp-1', type: 'space_developer', add: true },
    ]);
    req.flush({ results: [{ index: 0, success: true }] });

    await expect(done).resolves.toBeUndefined();
  });

  describe('executeChanges user-cache sync (legacy cfUserReducer equivalent)', () => {
    const PAGED_P1 = '/pp/v1/cf/users/cf-1?per_page=500&page=1';
    const SNAPSHOT = '/pp/v1/cf/users/cf-1';
    const cachedAlice = (): StUser => ({
      guid: 'u-a', username: 'alice', cnsiGuid: 'cf-1',
      orgRoles: [{ orgGuid: 'org-1', roles: ['auditor'] }],
      spaceRoles: [{ orgGuid: 'org-1', spaceGuid: 'sp-1', roles: ['developer'] }],
    });
    let paged: CfUsersPagedDataService;

    const seedPagedCache = async () => {
      paged = TestBed.inject(CfUsersPagedDataService);
      const p = firstValueFrom(paged.loadUsers('cf-1'));
      httpMock.expectOne(PAGED_P1).flush({ resources: [cachedAlice()], pagination: { totalResults: 1, totalPages: 1 } });
      await p;
    };

    it('patches cached role buckets, marks the cache stale, and refreshes a loaded snapshot', async () => {
      await seedPagedCache();
      const snapshot = TestBed.inject(CnsiUsersSnapshotService);
      snapshot.users('cf-1');
      httpMock.expectOne(SNAPSHOT).flush({ resources: [cachedAlice()], totalResults: 1 });
      // Let the snapshot's promise chain settle so its in-flight guard clears.
      await new Promise<void>(resolve => setTimeout(resolve, 0));

      svc.setUsers('cf-1', [userA]);
      svc.setChanges([
        { userGuid: 'u-a', orgGuid: 'org-1', add: true, role: 'managers' as any, orgName: 'Org 1' },
        { userGuid: 'u-a', orgGuid: 'org-1', spaceGuid: 'sp-1', add: false, role: 'developers' as any, orgName: 'Org 1', spaceName: 'Space 1' },
      ]);
      const done = svc.executeChanges();
      httpMock.expectOne('/pp/v1/cf/roles/cf-1/changes')
        .flush({ results: [{ index: 0, success: true }, { index: 1, success: true }] });
      await done;

      // Inline patch: mounted lists + cache-first wizard baselines see the change now.
      const alice = paged.usersSignal('cf-1')()[0];
      expect(alice.orgRoles).toEqual([{ orgGuid: 'org-1', roles: ['auditor', 'manager'] }]);
      expect(alice.spaceRoles).toEqual([]);

      // Snapshot was already loaded, so the summary tiles re-fetch.
      httpMock.expectOne(SNAPSHOT).flush({ resources: [cachedAlice()], totalResults: 1 });

      // Stale flag: the next list visit re-fetches server truth.
      const reload = firstValueFrom(paged.loadUsers('cf-1'));
      httpMock.expectOne(PAGED_P1).flush({ resources: [cachedAlice()], pagination: { totalResults: 1, totalPages: 1 } });
      await reload;
    });

    it('only marks the cache stale for set-by-username changes (synthetic guids are unknown to the cache)', async () => {
      await seedPagedCache();
      const synthetic = { guid: 'newbie/cf-1/org-1', username: 'newbie' } as unknown as StUser;
      svc.setIsSetByUsername(true);
      svc.setUsers('cf-1', [synthetic], 'uaa');
      svc.setChanges([
        { userGuid: 'newbie/cf-1/org-1', orgGuid: 'org-1', add: true, role: 'managers' as any, orgName: 'Org 1' },
      ]);
      const done = svc.executeChanges();
      httpMock.expectOne('/pp/v1/cf/roles/cf-1/changes').flush({ results: [{ index: 0, success: true }] });
      await done;

      expect(paged.usersSignal('cf-1')()[0].orgRoles).toEqual([{ orgGuid: 'org-1', roles: ['auditor'] }]);
      const reload = firstValueFrom(paged.loadUsers('cf-1'));
      httpMock.expectOne(PAGED_P1).flush({ resources: [cachedAlice()], pagination: { totalResults: 1, totalPages: 1 } });
      await reload;
    });

    it('does not patch or invalidate anything when every change fails', async () => {
      await seedPagedCache();
      svc.setUsers('cf-1', [userA]);
      svc.setChanges([
        { userGuid: 'u-a', orgGuid: 'org-1', add: true, role: 'managers' as any, orgName: 'Org 1' },
      ]);
      const done = svc.executeChanges();
      httpMock.expectOne('/pp/v1/cf/roles/cf-1/changes').flush({ results: [{ index: 0, success: false, error: 'boom' }] });
      await done;

      expect(paged.usersSignal('cf-1')()[0].orgRoles).toEqual([{ orgGuid: 'org-1', roles: ['auditor'] }]);
      await firstValueFrom(paged.loadUsers('cf-1')); // cache hit — no request expected
      httpMock.verify();
    });
  });

  it('executeChanges records per-change applyStatus and surfaces failures via snackbar', async () => {
    svc.setUsers('cf-1', [userA]);
    const ok: CfRoleChange = { userGuid: 'u-a', orgGuid: 'org-1', add: true, role: 'managers' as any, orgName: 'Org 1' };
    const bad: CfRoleChange = { userGuid: 'u-a', orgGuid: 'org-1', spaceGuid: 'sp-1', add: false, role: 'developers' as any, orgName: 'Org 1', spaceName: 'Space 1' };
    svc.setChanges([ok, bad]);

    const done = svc.executeChanges();
    const req = httpMock.expectOne('/pp/v1/cf/roles/cf-1/changes');
    req.flush({ results: [{ index: 0, success: true }, { index: 1, success: false, error: 'boom' }] });
    await done;

    expect(svc.applyStatus()[CfUsersRolesDataService.changeKey(ok)]).toBe('done');
    expect(svc.applyStatus()[CfUsersRolesDataService.changeKey(bad)]).toBe('error');
    expect(snackBar.error).toHaveBeenCalled();
  });

  it('changeKey distinguishes add from remove of the same role', () => {
    const add: CfRoleChange = { userGuid: 'u-a', orgGuid: 'org-1', add: true, role: 'managers' as any, orgName: 'Org 1' };
    const remove: CfRoleChange = { ...add, add: false };

    expect(CfUsersRolesDataService.changeKey(add)).not.toBe(CfUsersRolesDataService.changeKey(remove));
  });

  it('associateUser POSTs username+origin and resolves the guid', async () => {
    const p = svc.associateUser('cf-1', 'alice', 'ldap');
    const req = httpMock.expectOne('/pp/v1/cf/users/cf-1/associate');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'alice', origin: 'ldap' });
    req.flush({ guid: 'u-1', associated: true });
    await expect(p).resolves.toEqual({ guid: 'u-1', associated: true });
  });

  it('clear resets applyStatus so a new wizard run does not inherit "Done" rows', async () => {
    svc.setUsers('cf-1', [userA]);
    const change: CfRoleChange = { userGuid: 'u-a', orgGuid: 'org-1', add: true, role: 'managers' as any, orgName: 'Org 1' };
    svc.setChanges([change]);

    const done = svc.executeChanges();
    httpMock.expectOne('/pp/v1/cf/roles/cf-1/changes').flush({ results: [{ index: 0, success: true }] });
    await done;
    expect(svc.applyStatus()[CfUsersRolesDataService.changeKey(change)]).toBe('done');

    svc.clear();

    expect(svc.applyStatus()).toEqual({});
  });
});
