import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TailwindSnackBarService } from '@stratosui/core';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { StUser } from '../endpoint-data/stratos-types';
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
});
