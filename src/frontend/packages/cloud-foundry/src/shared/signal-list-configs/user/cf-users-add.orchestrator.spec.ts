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

    await addUsers(deps, req);

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

    // Should call executeChanges
    expect(deps.rolesData.executeChanges).toHaveBeenCalled();

    // Should NOT call associateUser (grant auto-associates)
    expect(deps.rolesData.associateUser).not.toHaveBeenCalled();

    // Should refresh
    expect(deps.paged.markStale).toHaveBeenCalledWith('cf1');
    expect(deps.snapshot.refreshIfLoaded).toHaveBeenCalledWith('cf1');
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

    await addUsers(deps, req);

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

    await addUsers(deps, req);

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

    // Should execute changes
    expect(deps.rolesData.executeChanges).toHaveBeenCalled();
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

    // Must not throw
    await expect(addUsers(deps, req)).resolves.toBeUndefined();

    // Should report error via snackbar
    expect(deps.snackBar.error).toHaveBeenCalled();
  });
});
