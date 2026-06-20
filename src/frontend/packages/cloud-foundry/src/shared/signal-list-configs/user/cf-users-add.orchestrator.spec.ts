import { describe, it, expect, vi } from 'vitest';
import { of } from 'rxjs';
import { addUsers } from './cf-users-add';
import type { AddUsersDeps, AddUsersRequest } from './cf-users-add';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../../store/types/cf-user.types';
import { CfUsersRolesDataService } from '../../../services/domain-data/cf-users-roles-data.service';

// ─── Minimal deps factory ─────────────────────────────────────────────────────

function makeDeps(over: Partial<{
  rolesData: any;
  invite: any;
  snackBar: any;
  paged: any;
  snapshot: any;
}> = {}): AddUsersDeps {
  return {
    rolesData: {
      setUsers: vi.fn(),
      setIsSetByUsername: vi.fn(),
      setChanges: vi.fn(),
      executeChanges: vi.fn().mockResolvedValue(undefined),
      applyStatus: vi.fn().mockReturnValue({}),
      associateUser: vi.fn().mockResolvedValue({ guid: 'real-u1', associated: true }),
      ...over.rolesData,
    },
    invite: {
      invite: vi.fn().mockReturnValue(of({ error: false, new_invites: [], failed_invites: [] })),
      ...over.invite,
    },
    snackBar: { error: vi.fn(), open: vi.fn(), ...over.snackBar },
    paged: { markStale: vi.fn(), ...over.paged },
    snapshot: { refreshIfLoaded: vi.fn(), ...over.snapshot },
    cfGuid: 'cf1',
  } as any;
}

function makeReq(over: Partial<AddUsersRequest> = {}): AddUsersRequest {
  return {
    mode: 'associate',
    identities: ['alice'],
    origin: 'ldap',
    orgGuid: 'org1',
    orgName: 'My Org',
    spaceNameByGuid: new Map(),
    selection: { orgRoles: [], spaceRolesBySpace: {} },
    ...over,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('addUsers', () => {
  it('associate + roles: seeds username+origin, sets changes, executes, refreshes', async () => {
    const deps = makeDeps();
    const req = makeReq({
      mode: 'associate',
      identities: ['alice'],
      origin: 'ldap',
      selection: { orgRoles: [OrgUserRoleNames.MANAGER], spaceRolesBySpace: {} },
    });

    const r = await addUsers(deps, req);

    // Full success: one identity, no failures.
    expect(r).toEqual({ ok: true, total: 1, failed: 0 });

    // Should seed synthetic user with username 'alice' and origin 'ldap'
    expect(deps.rolesData.setUsers).toHaveBeenCalledOnce();
    const [cfGuid, users, origin] = (deps.rolesData.setUsers as any).mock.calls[0];
    expect(cfGuid).toBe('cf1');
    expect(users).toHaveLength(1);
    expect(users[0].username).toBe('alice');
    // guid = username/cfGuid/orgGuid
    expect(users[0].guid).toBe('alice/cf1/org1');
    expect(origin).toBe('ldap');

    // Should flag set-by-username
    expect(deps.rolesData.setIsSetByUsername).toHaveBeenCalledWith(true);

    // Should set non-empty changes
    expect(deps.rolesData.setChanges).toHaveBeenCalledOnce();
    const [changes] = (deps.rolesData.setChanges as any).mock.calls[0];
    expect(changes.length).toBeGreaterThan(0);
    expect(changes[0].add).toBe(true);

    // Should call executeChanges with silent:true so executeChanges owns the snackbar suppression
    expect(deps.rolesData.executeChanges).toHaveBeenCalledWith({ silent: true });

    // Should NOT call associateUser (grant auto-associates)
    expect(deps.rolesData.associateUser).not.toHaveBeenCalled();

    // Cache refresh is owned by executeChanges on this path; orchestrator must
    // NOT call markStale/refreshIfLoaded a second time (no double-refresh).
    expect(deps.paged.markStale).not.toHaveBeenCalled();
    expect(deps.snapshot.refreshIfLoaded).not.toHaveBeenCalled();

    // Exactly ONE snackbar from the orchestrator; none from executeChanges (silent).
    const snackCalls = (deps.snackBar.open as any).mock.calls.length + (deps.snackBar.error as any).mock.calls.length;
    expect(snackCalls).toBe(1);
  });

  it('associate, no roles: calls associateUser per username, no executeChanges', async () => {
    const deps = makeDeps({
      rolesData: {
        associateUser: vi.fn()
          .mockResolvedValueOnce({ guid: 'u-alice', associated: true })
          .mockResolvedValueOnce({ guid: 'u-bob', associated: true }),
        setUsers: vi.fn(),
        setIsSetByUsername: vi.fn(),
        setChanges: vi.fn(),
        executeChanges: vi.fn().mockResolvedValue(undefined),
        applyStatus: vi.fn().mockReturnValue({}),
      },
    });
    const req = makeReq({
      mode: 'associate',
      identities: ['alice', 'bob'],
      selection: { orgRoles: [], spaceRolesBySpace: {} },
    });

    const r = await addUsers(deps, req);

    // Two identities, both associated.
    expect(r).toEqual({ ok: true, total: 2, failed: 0 });

    expect(deps.rolesData.associateUser).toHaveBeenCalledTimes(2);
    expect(deps.rolesData.associateUser).toHaveBeenCalledWith('cf1', 'alice', 'ldap');
    expect(deps.rolesData.associateUser).toHaveBeenCalledWith('cf1', 'bob', 'ldap');
    expect(deps.rolesData.executeChanges).not.toHaveBeenCalled();

    // Should refresh after associate-only
    expect(deps.paged.markStale).toHaveBeenCalledWith('cf1');
    expect(deps.snapshot.refreshIfLoaded).toHaveBeenCalledWith('cf1');
  });

  it('invite: invites role-free, then grants full matrix by returned userid', async () => {
    const deps = makeDeps({
      invite: {
        invite: vi.fn().mockReturnValue(of({
          error: false,
          new_invites: [{ userid: 'u9', email: 'alice@example.com', success: true, errorCode: '', errorMessage: '', inviteLink: '' }],
          failed_invites: [],
        })),
      },
    });
    const req = makeReq({
      mode: 'invite',
      identities: ['alice@example.com'],
      selection: { orgRoles: [], spaceRolesBySpace: { s1: [SpaceUserRoleNames.DEVELOPER] } },
      spaceNameByGuid: new Map([['s1', 'Space One']]),
    });

    const r = await addUsers(deps, req);

    // One invite, no failures.
    expect(r).toEqual({ ok: true, total: 1, failed: 0 });

    // Should call invite with empty spaceRole (role-free)
    expect(deps.invite.invite).toHaveBeenCalledOnce();
    const inviteCall = (deps.invite.invite as any).mock.calls[0];
    expect(inviteCall[0]).toBe('cf1');
    expect(inviteCall[1]).toBe('org1');
    // spaceGuid arg (index 2) is the first key of spaceRolesBySpace or '' — s1
    expect(inviteCall[3]).toBe('');   // empty spaceRole for role-free

    // Should seed with returned guid 'u9'
    expect(deps.rolesData.setUsers).toHaveBeenCalledOnce();
    const [, users] = (deps.rolesData.setUsers as any).mock.calls[0];
    expect(users[0].guid).toBe('u9');

    // Should NOT set by username (uses real guid from invite)
    expect(deps.rolesData.setIsSetByUsername).toHaveBeenCalledWith(false);

    // Should build changes using the returned guid
    expect(deps.rolesData.setChanges).toHaveBeenCalledOnce();
    const [changes] = (deps.rolesData.setChanges as any).mock.calls[0];
    expect(changes.some((c: any) => c.userGuid === 'u9')).toBe(true);

    // Should execute changes with silent:true (orchestrator posts the snackbar)
    expect(deps.rolesData.executeChanges).toHaveBeenCalledWith({ silent: true });

    // No double-refresh: executeChanges owns the cache flush on this path.
    expect(deps.paged.markStale).not.toHaveBeenCalled();
    expect(deps.snapshot.refreshIfLoaded).not.toHaveBeenCalled();

    // Exactly one snackbar (orchestrator's reportSnackBar only).
    const snackCalls = (deps.snackBar.open as any).mock.calls.length + (deps.snackBar.error as any).mock.calls.length;
    expect(snackCalls).toBe(1);
  });

  it('partial failure: does not throw, reports failures via snackbar', async () => {
    // Build a change that executeChanges will mark as error
    const change = { userGuid: 'alice/cf1/org1', orgGuid: 'org1', orgName: 'My Org', add: true, role: OrgUserRoleNames.MANAGER };
    const key = CfUsersRolesDataService.changeKey(change);
    const deps = makeDeps({
      rolesData: {
        setUsers: vi.fn(),
        setIsSetByUsername: vi.fn(),
        setChanges: vi.fn(),
        executeChanges: vi.fn().mockResolvedValue(undefined),
        applyStatus: vi.fn().mockReturnValue({ [key]: 'error' }),
        associateUser: vi.fn().mockResolvedValue({ guid: 'g', associated: true }),
      },
    });
    const req = makeReq({
      mode: 'associate',
      identities: ['alice'],
      origin: 'ldap',
      selection: { orgRoles: [OrgUserRoleNames.MANAGER], spaceRolesBySpace: {} },
    });

    // Must not throw; returns a partial-failure summary (ok:false, failed>0).
    await expect(addUsers(deps, req)).resolves.toEqual({ ok: false, total: 1, failed: 1 });

    // Should report error via snackbar
    expect(deps.snackBar.error).toHaveBeenCalled();
  });

  it('partial failure: multiple errored role-changes for one identity count as 1 failed identity', async () => {
    // alice fails 2 of 3 role grants; bob succeeds all. Total identities = 2,
    // failed identities = 1 (alice), NOT 2 (the errored change count).
    const aliceGuid = 'alice/cf1/org1';
    const changeA = { userGuid: aliceGuid, orgGuid: 'org1', orgName: 'My Org', add: true, role: OrgUserRoleNames.MANAGER };
    const changeB = { userGuid: aliceGuid, orgGuid: 'org1', orgName: 'My Org', add: true, role: OrgUserRoleNames.AUDITOR };
    const bobGuid = 'bob/cf1/org1';
    const changeC = { userGuid: bobGuid, orgGuid: 'org1', orgName: 'My Org', add: true, role: OrgUserRoleNames.MANAGER };

    const keyA = CfUsersRolesDataService.changeKey(changeA);
    const keyB = CfUsersRolesDataService.changeKey(changeB);
    const keyC = CfUsersRolesDataService.changeKey(changeC);

    const deps = makeDeps({
      rolesData: {
        setUsers: vi.fn(),
        setIsSetByUsername: vi.fn(),
        setChanges: vi.fn(),
        executeChanges: vi.fn().mockResolvedValue(undefined),
        // alice's 2 changes errored; bob's succeeded
        applyStatus: vi.fn().mockReturnValue({
          [keyA]: 'error',
          [keyB]: 'error',
          [keyC]: 'done',
        }),
        associateUser: vi.fn().mockResolvedValue({ guid: 'g', associated: true }),
      },
    });
    const req = makeReq({
      mode: 'associate',
      identities: ['alice', 'bob'],
      origin: 'ldap',
      selection: { orgRoles: [OrgUserRoleNames.MANAGER, OrgUserRoleNames.AUDITOR], spaceRolesBySpace: {} },
    });

    // Identity-based: 2 total, 1 failed (alice), NOT 2 (the errored change count).
    await expect(addUsers(deps, req)).resolves.toEqual({ ok: false, total: 2, failed: 1 });

    // Snackbar should report "Added 1 of 2 users; 1 failed" (not "Added -1 of 2 users; 2 failed")
    expect(deps.snackBar.error).toHaveBeenCalledWith('Added 1 of 2 users; 1 failed');
  });
});
