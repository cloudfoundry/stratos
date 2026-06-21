import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
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
import {
  provideRoleAssignmentTestDeps,
  RoleAssignmentDriver,
} from '../../../../shared/components/role-assignment/role-assignment.test-deps';
import * as addModule from '../../../../shared/signal-list-configs/user/cf-users-add';
import { AddUserDialogComponent, AddUserDialogData } from './add-user-dialog.component';

const CF_GUID = 'test-cf-guid';

// Harness cfg: one org (org-1 / Org One) with no spaces, all permissions granted.
const TEST_HARNESS_CFG = {
  orgs: [{ guid: 'org-1', name: 'Org One' }],
  spacesByOrg: { 'org-1': [] },
};

interface MakeOpts {
  idpsOrigins?: string[];
}

function make(data: AddUserDialogData, opts: MakeOpts = {}): {
  cmp: AddUserDialogComponent;
  fixture: ComponentFixture<AddUserDialogComponent>;
  close: ReturnType<typeof vi.fn>;
  listOrigins: ReturnType<typeof vi.fn>;
} {
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
      // Real RoleAssignmentComponent services (no stub, no overrideComponent).
      ...provideRoleAssignmentTestDeps(TEST_HARNESS_CFG),
    ],
  });

  const fixture = TestBed.createComponent(AddUserDialogComponent);
  fixture.detectChanges();
  return { cmp: fixture.componentInstance, fixture, close, listOrigins };
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
    const { cmp } = make({ cfGuid: CF_GUID, orgGuid: 'org-1', userInviteAllowed: false });
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

  // ── sentinel-user regression guard ────────────────────────────────────────
  // Ensures the [users] binding to RoleAssignmentComponent is never [] so
  // diffToChanges inner loops run and the widget can emit role changes.

  it('pendingUsers is a stable array with exactly one sentinel entry', () => {
    const { cmp } = make({ cfGuid: CF_GUID, userInviteAllowed: false });
    const pending = (cmp as any).pendingUsers as any[];
    expect(pending).toHaveLength(1);
    expect(pending[0].guid).toBeTruthy();
    expect(pending[0].guid).toBe('pending-add-user');
    expect(pending[0].cnsiGuid).toBe(CF_GUID);
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

  // ── EMPTY-GRANTS REGRESSION TEST ──────────────────────────────────────────
  // This is the regression net for the Phase 4 Critical: "Add User granting no
  // roles because diffToChanges iterated over an empty users array."
  //
  // Path: pick org → click Manager checkbox via the real widget DOM → submit
  //   → addUsers called with req.changes containing the toggled role.
  //
  // The real RoleAssignmentComponent is rendered (no stub). The driver drives
  // its DOM to produce a real changeSet emission. Confirms that the sentinel
  // [users] binding is non-empty (so diffToChanges runs) and the change flows
  // all the way to addUsers.

  it('grants the selected roles when adding a user (no empty change set)', async () => {
    const spy = vi.spyOn(addModule, 'addUsers').mockResolvedValue({ ok: true, total: 1, failed: 0 });

    // Open with a locked org so the org section is auto-shown (picker hidden).
    const { cmp, fixture } = make({
      cfGuid: CF_GUID,
      orgGuid: 'org-1',
      orgName: 'Org One',
      userInviteAllowed: false,
    });
    const c = cmp as any;

    // Wait for async init (fetchOrgs subscription + permission resolution).
    await fixture.whenStable();
    fixture.detectChanges();

    // The real widget is now rendered.  Drive it: toggle the Manager org role.
    const driver = new RoleAssignmentDriver(fixture);
    driver.toggleOrgRole('org-1', 'Manager');
    await fixture.whenStable();
    fixture.detectChanges();

    // The widget should have emitted a changeSet with one role grant.
    const roleChanges: CfRoleChange[] = c.roleChanges();
    expect(roleChanges.length).toBeGreaterThan(0);
    expect(roleChanges.some(r => r.role === OrgUserRoleNames.MANAGER && r.add === true)).toBe(true);

    // Provide a valid identity and submit.
    c.identities.set(['alice']);
    c.identitiesValid.set(true);
    await c.submit();

    expect(spy).toHaveBeenCalledOnce();
    const [, req] = spy.mock.calls[0];
    // req.changes must NOT be empty — this is the regression guard.
    expect(req.changes.length).toBeGreaterThan(0);
    expect(req.changes.some((r: CfRoleChange) => r.role === OrgUserRoleNames.MANAGER && r.add === true)).toBe(true);

    spy.mockRestore();
  });
});
