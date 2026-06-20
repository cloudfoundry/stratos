import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';

import { MAT_DIALOG_DATA, TailwindDialogRef, TailwindSnackBarService } from '@stratosui/core';

import { CfIdentityProvidersService } from '../../../../shared/data-services/cf-identity-providers.service';
import { CfRolesService } from '../manage-users/cf-roles.service';
import { CfUsersRolesDataService } from '../../../../services/domain-data/cf-users-roles-data.service';
import { UserInviteService } from '../../user-invites/user-invite.service';
import { CfUsersPagedDataService } from '../../../../shared/data-services/cf-users-paged-data.service';
import { CnsiUsersSnapshotService } from '../../../../services/endpoint-data/cnsi-users-snapshot.service';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../../../store/types/cf-user.types';
import * as addModule from '../../../../shared/signal-list-configs/user/cf-users-add';
import { AddUserDialogComponent, AddUserDialogData } from './add-user-dialog.component';

const CF_GUID = 'test-cf-guid';

interface MakeOpts {
  idpsOrigins?: string[];
  orgs?: { guid: string; name: string }[];
  spaces?: { guid: string; name: string }[];
}

function make(data: AddUserDialogData, opts: MakeOpts = {}) {
  const close = vi.fn();
  const listOrigins = vi.fn().mockReturnValue(of(opts.idpsOrigins ?? []));
  const fetchOrgs = vi.fn().mockReturnValue(
    of((opts.orgs ?? []).map(o => ({ metadata: { guid: o.guid }, entity: { name: o.name } }))),
  );
  const fetchSpacesForOrg = vi.fn().mockReturnValue(of(opts.spaces ?? []));

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: TailwindDialogRef, useValue: { close } },
      { provide: CfIdentityProvidersService, useValue: { listOrigins } },
      { provide: CfRolesService, useValue: { fetchOrgs, fetchSpacesForOrg } },
      { provide: CfUsersRolesDataService, useValue: {} },
      { provide: UserInviteService, useValue: {} },
      { provide: TailwindSnackBarService, useValue: { open: vi.fn(), error: vi.fn() } },
      { provide: CfUsersPagedDataService, useValue: {} },
      { provide: CnsiUsersSnapshotService, useValue: {} },
    ],
  });

  // createComponent (no detectChanges) runs constructor — initialising signals
  // from MAT_DIALOG_DATA — without rendering child components.
  const fixture = TestBed.createComponent(AddUserDialogComponent);
  return { cmp: fixture.componentInstance, close, listOrigins, fetchOrgs, fetchSpacesForOrg };
}

describe('AddUserDialogComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true).forEach(req => req.flush({}));
    httpMock.verify();
  });

  it('defaults origin to "uaa"', () => {
    const { cmp } = make({ cfGuid: CF_GUID, userInviteAllowed: false });
    expect(cmp.origin()).toBe('uaa');
  });

  it('hides the Invite tab when userInviteAllowed is false', () => {
    const { cmp } = make({ cfGuid: CF_GUID, userInviteAllowed: false });
    expect(cmp.inviteTabVisible()).toBe(false);
  });

  it('shows the Invite tab when userInviteAllowed is true', () => {
    const { cmp } = make({ cfGuid: CF_GUID, userInviteAllowed: true });
    expect(cmp.inviteTabVisible()).toBe(true);
  });

  it('canSubmit is false when there are no valid identities', () => {
    const { cmp } = make({ cfGuid: CF_GUID, userInviteAllowed: false });
    // No identities set — default state
    expect(cmp.canSubmit()).toBe(false);
  });

  it('locks org when opened with an orgGuid', () => {
    const { cmp } = make({ cfGuid: CF_GUID, orgGuid: 'org-123', userInviteAllowed: false });
    expect(cmp.orgLocked()).toBe(true);
  });

  it('populates originOptions from listOrigins and degrades gracefully on empty', () => {
    const { cmp: cmpWithOptions, listOrigins: spy1 } = make(
      { cfGuid: CF_GUID, userInviteAllowed: false },
      { idpsOrigins: ['uaa', 'ldap'] }
    );
    expect(spy1).toHaveBeenCalledWith(CF_GUID);
    // After the promise resolves (synchronously via of()) originOptions should
    // contain the two options returned by the service.
    expect(cmpWithOptions.originOptions()).toEqual(['uaa', 'ldap']);

    const { cmp: cmpEmpty } = make(
      { cfGuid: CF_GUID, userInviteAllowed: false },
      {}
    );
    // Service returned [] — originOptions stays empty, component still works
    // (free-text entry is always available).
    expect(cmpEmpty.originOptions()).toEqual([]);
  });

  it('CF-level (no orgGuid): orgOptions maps metadata.guid + entity.name correctly', () => {
    const { cmp, fetchOrgs } = make(
      { cfGuid: CF_GUID, userInviteAllowed: false }, // no orgGuid → CF-level, unlocked
      { orgs: [
        { guid: 'o1', name: 'Org One' },
        { guid: 'o2', name: 'Org Two' },
      ] },
    );

    // fetchOrgs should have been called (org picker not locked)
    expect(fetchOrgs).toHaveBeenCalledWith(CF_GUID);

    // orgOptions() should reflect the APIResource-shaped mock
    expect((cmp as any).orgOptions()).toEqual([
      { guid: 'o1', name: 'Org One' },
      { guid: 'o2', name: 'Org Two' },
    ]);

    // org is NOT locked at the CF level
    expect(cmp.orgLocked()).toBe(false);
  });

  it('role picker writes orgRoles and spaceRolesBySpace into selection', () => {
    const { cmp } = make(
      { cfGuid: CF_GUID, orgGuid: 'org-1', orgName: 'Org One', userInviteAllowed: false },
      { spaces: [{ guid: 'space-1', name: 'Space One' }] }
    );

    // Org locked → chosenOrgGuid seeded from data.orgGuid; spaces loaded.
    const c = cmp as any;
    expect(c.chosenOrgGuid()).toBe('org-1');
    expect(c.spaceOptions()).toEqual([{ guid: 'space-1', name: 'Space One' }]);

    // Toggle an org role on.
    c.toggleOrgRole(OrgUserRoleNames.MANAGER, true);
    expect(cmp.selection().orgRoles).toEqual([OrgUserRoleNames.MANAGER]);

    // Toggle a space role on, then verify the map.
    c.toggleSpaceRole('space-1', SpaceUserRoleNames.DEVELOPER, true);
    expect(cmp.selection().spaceRolesBySpace).toEqual({ 'space-1': [SpaceUserRoleNames.DEVELOPER] });

    // Toggle the org role back off — empties orgRoles.
    c.toggleOrgRole(OrgUserRoleNames.MANAGER, false);
    expect(cmp.selection().orgRoles).toEqual([]);

    // Toggle the only space role off — removes the space key entirely.
    c.toggleSpaceRole('space-1', SpaceUserRoleNames.DEVELOPER, false);
    expect(cmp.selection().spaceRolesBySpace).toEqual({});
  });

  it('submit calls addUsers with the assembled request and closes(true) on ok', async () => {
    const spy = vi.spyOn(addModule, 'addUsers').mockResolvedValue({ ok: true, total: 1, failed: 0 });
    const { cmp, close } = make(
      { cfGuid: CF_GUID, orgGuid: 'org-1', orgName: 'Org One', userInviteAllowed: false },
      { spaces: [] }
    );
    const c = cmp as any;

    // Provide a valid identity so canSubmit() is true.
    c.identities.set(['alice']);
    c.identitiesValid.set(true);

    await c.submit();

    expect(spy).toHaveBeenCalledOnce();
    const [, req] = spy.mock.calls[0];
    expect(req.mode).toBe('associate');
    expect(req.identities).toEqual(['alice']);
    expect(req.orgGuid).toBe('org-1');
    expect(req.orgName).toBe('Org One');

    // Full success → closed with true; submitting need not be reset (view gone).
    expect(close).toHaveBeenCalledWith(true);
    spy.mockRestore();
  });

  it('submit stays open (submitting false, not closed) on partial failure', async () => {
    const spy = vi.spyOn(addModule, 'addUsers').mockResolvedValue({ ok: false, total: 2, failed: 1 });
    const { cmp, close } = make(
      { cfGuid: CF_GUID, orgGuid: 'org-1', orgName: 'Org One', userInviteAllowed: false },
      { spaces: [] }
    );
    const c = cmp as any;

    c.identities.set(['alice', 'bob']);
    c.identitiesValid.set(true);

    await c.submit();

    expect(spy).toHaveBeenCalledOnce();
    // Partial failure → dialog stays open and submit re-enables.
    expect(close).not.toHaveBeenCalled();
    expect(c.submitting()).toBe(false);
    spy.mockRestore();
  });
});
