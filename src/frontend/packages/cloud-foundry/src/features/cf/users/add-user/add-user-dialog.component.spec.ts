import { Component, EventEmitter, Input, Output, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';

import { MAT_DIALOG_DATA, TailwindDialogRef, TailwindSnackBarService } from '@stratosui/core';

import { CfIdentityProvidersService } from '../../../../shared/data-services/cf-identity-providers.service';
import { CfUsersRolesDataService } from '../../../../services/domain-data/cf-users-roles-data.service';
import { UserInviteService } from '../../user-invites/user-invite.service';
import { CfUsersPagedDataService } from '../../../../shared/data-services/cf-users-paged-data.service';
import { CnsiUsersSnapshotService } from '../../../../services/endpoint-data/cnsi-users-snapshot.service';
import { CfRoleChange } from '../../../../store/types/users-roles.types';
import { OrgUserRoleNames } from '../../../../store/types/cf-user.types';
import { RoleAssignmentComponent } from '../../../../shared/components/role-assignment/role-assignment.component';
import * as addModule from '../../../../shared/signal-list-configs/user/cf-users-add';
import { AddUserDialogComponent, AddUserDialogData } from './add-user-dialog.component';

const CF_GUID = 'test-cf-guid';

// ── Stub for RoleAssignmentComponent ──────────────────────────────────────────
// Avoids pulling in CfRolesService / CurrentUserPermissionsService in dialog specs.
@Component({
  selector: 'app-role-assignment',
  standalone: true,
  template: '<div class="role-assignment-stub"></div>',
})
class RoleAssignmentStub {
  @Input() cfGuid!: string;
  @Input() users: any[] = [];
  @Input() baseline: any = {};
  @Input() lockedOrg: { guid: string; name: string } | undefined = undefined;
  @Output() changeSet = new EventEmitter<CfRoleChange[]>();
}

interface MakeOpts {
  idpsOrigins?: string[];
}

function make(data: AddUserDialogData, opts: MakeOpts = {}) {
  const close = vi.fn();
  const listOrigins = vi.fn().mockReturnValue(of(opts.idpsOrigins ?? []));

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: TailwindDialogRef, useValue: { close } },
      { provide: CfIdentityProvidersService, useValue: { listOrigins } },
      { provide: CfUsersRolesDataService, useValue: {} },
      { provide: UserInviteService, useValue: {} },
      { provide: TailwindSnackBarService, useValue: { open: vi.fn(), error: vi.fn() } },
      { provide: CfUsersPagedDataService, useValue: {} },
      { provide: CnsiUsersSnapshotService, useValue: {} },
    ],
  })
  // Override the real RoleAssignmentComponent with a stub to keep tests hermetic.
  .overrideComponent(AddUserDialogComponent, {
    remove: { imports: [RoleAssignmentComponent] },
    add: { imports: [RoleAssignmentStub] },
  });

  const fixture = TestBed.createComponent(AddUserDialogComponent);
  return { cmp: fixture.componentInstance, close, listOrigins };
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
    expect(cmpWithOptions.originOptions()).toEqual(['uaa', 'ldap']);

    const { cmp: cmpEmpty } = make(
      { cfGuid: CF_GUID, userInviteAllowed: false },
      {}
    );
    expect(cmpEmpty.originOptions()).toEqual([]);
  });

  // ── Widget integration tests ───────────────────────────────────────────────

  it('renders the shared role widget with an empty baseline (orgLocked false at CF level)', () => {
    const { cmp } = make({ cfGuid: CF_GUID, userInviteAllowed: false });
    // No orgGuid → orgLocked is false
    expect(cmp.orgLocked()).toBe(false);
    // roleChanges starts empty
    expect((cmp as any).roleChanges()).toEqual([]);
  });

  it('locks the org in the widget when opened from an org page', () => {
    const { cmp } = make({
      cfGuid: CF_GUID,
      orgGuid: 'org-1',
      orgName: 'Org One',
      userInviteAllowed: false,
    });
    expect(cmp.orgLocked()).toBe(true);
    // The lockedOrg binding in the template resolves to { guid, name }
    // We verify the data fields that feed the binding:
    expect(cmp.data.orgGuid).toBe('org-1');
    expect(cmp.data.orgName).toBe('Org One');
  });

  it('onRoleChangeSet captures widget changeSet into roleChanges signal', () => {
    const { cmp } = make({ cfGuid: CF_GUID, orgGuid: 'org-1', orgName: 'Org One', userInviteAllowed: false });
    const change: CfRoleChange = {
      userGuid: '',
      orgGuid: 'org-1',
      orgName: 'Org One',
      add: true,
      role: OrgUserRoleNames.MANAGER,
    };
    (cmp as any).onRoleChangeSet([change]);
    expect((cmp as any).roleChanges()).toEqual([change]);
  });

  it('submit forwards the widget grants to addUsers via req.changes', async () => {
    const spy = vi.spyOn(addModule, 'addUsers').mockResolvedValue({ ok: true, total: 1, failed: 0 });
    const { cmp, close } = make(
      { cfGuid: CF_GUID, orgGuid: 'org-1', orgName: 'Org One', userInviteAllowed: false },
    );
    const c = cmp as any;

    // Simulate widget emitting a role change
    const change: CfRoleChange = {
      userGuid: '',
      orgGuid: 'org-1',
      orgName: 'Org One',
      add: true,
      role: OrgUserRoleNames.MANAGER,
    };
    c.onRoleChangeSet([change]);

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
    // changes (not selection) carries the widget output
    expect(req.changes).toEqual([change]);
    expect(req.selection).toEqual({ orgRoles: [], spaceRolesBySpace: {} });

    // Full success → closed with true
    expect(close).toHaveBeenCalledWith(true);
    spy.mockRestore();
  });

  it('submit stays open (submitting false, not closed) on partial failure', async () => {
    const spy = vi.spyOn(addModule, 'addUsers').mockResolvedValue({ ok: false, total: 2, failed: 1 });
    const { cmp, close } = make(
      { cfGuid: CF_GUID, orgGuid: 'org-1', orgName: 'Org One', userInviteAllowed: false },
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
