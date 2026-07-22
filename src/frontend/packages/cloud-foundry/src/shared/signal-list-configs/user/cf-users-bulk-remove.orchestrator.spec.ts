import { describe, it, expect, vi } from 'vitest';
import { of } from 'rxjs';
import { bulkRemoveUsers } from './cf-users-bulk-remove';
import { CfUsersRolesDataService } from '../../../services/domain-data/cf-users-roles-data.service';
import type { StUser } from '../../../services/endpoint-data/stratos-types';

const u: StUser = { guid: 'u1', username: 'alice', cnsiGuid: 'cnsi',
  orgRoles: [{ orgGuid: 'o1', roles: ['manager'] }], spaceRoles: [] };

// User with both an org role and a space role, used to test partial permission filtering.
const uWithSpace: StUser = {
  guid: 'u2', username: 'bob', cnsiGuid: 'cnsi',
  orgRoles: [{ orgGuid: 'o1', roles: ['manager'] }],
  spaceRoles: [{ orgGuid: 'o1', spaceGuid: 's1', roles: ['developer'] }],
};

// User with no roles — buildRemoveChanges returns [] for them.
const uNoRoles: StUser = { guid: 'u3', username: 'carol', cnsiGuid: 'cnsi',
  orgRoles: [], spaceRoles: [] };

function makeDeps(over: any = {}) {
  return {
    rolesData: {
      setUsers: vi.fn(), setIsRemove: vi.fn(), setChanges: vi.fn(),
      executeChanges: vi.fn().mockResolvedValue(undefined),
      applyStatus: () => ({}),
      ...over.rolesData,
    },
    userPerms: { can: vi.fn().mockReturnValue(of(true)), ...over.userPerms },
    confirmDialog: { open: vi.fn((_cfg: any, doFn: () => void) => doFn()), ...over.confirmDialog },
    snackBar: { error: vi.fn(), open: vi.fn(), ...over.snackBar },
    cfGuid: 'cnsi',
  } as any;
}

describe('bulkRemoveUsers', () => {
  it('filters by permission, confirms, and executes the allowed changes', async () => {
    const deps = makeDeps();
    const onComplete = vi.fn();
    await bulkRemoveUsers(deps, { users: [u], opts: { scope: 'orgAndSpaces' }, title: 'Remove', message: 'Remove 1 user?', onComplete });
    await Promise.resolve();
    expect(deps.rolesData.setChanges).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ userGuid: 'u1', add: false })]));
    expect(deps.rolesData.setIsRemove).toHaveBeenCalledWith(true);
    expect(deps.rolesData.executeChanges).toHaveBeenCalled();
    expect(deps.snackBar.open).toHaveBeenCalledWith('Selected users removed');
    expect(onComplete).toHaveBeenCalled();
  });

  it('does nothing when the user cancels the dialog', async () => {
    const deps = makeDeps({ confirmDialog: { open: vi.fn() /* never calls doFn */ } });
    await bulkRemoveUsers(deps, { users: [u], opts: { scope: 'orgAndSpaces' }, title: 'T', message: 'M' });
    expect(deps.rolesData.executeChanges).not.toHaveBeenCalled();
  });

  it('skips confirm and reports when permission filtering removes everything', async () => {
    const deps = makeDeps({ userPerms: { can: vi.fn().mockReturnValue(of(false)) } });
    await bulkRemoveUsers(deps, { users: [u], opts: { scope: 'orgAndSpaces' }, title: 'T', message: 'M' });
    expect(deps.confirmDialog.open).not.toHaveBeenCalled();
    expect(deps.rolesData.executeChanges).not.toHaveBeenCalled();
  });

  it('reports a failure when applyStatus has an error key', async () => {
    const change = { userGuid: 'u1', orgGuid: 'o1', orgName: '', add: false, role: 'managers' };
    const key = CfUsersRolesDataService.changeKey(change as any);
    const deps = makeDeps({ rolesData: { applyStatus: () => ({ [key]: 'error' }) } });
    await bulkRemoveUsers(deps, { users: [u], opts: { scope: 'orgAndSpaces' }, title: 'T', message: 'M' });
    await Promise.resolve(); await Promise.resolve();
    expect(deps.snackBar.error).toHaveBeenCalled();
  });

  it('includes skipped count in success message when some changes lack permission', async () => {
    // org changes allowed, space changes denied → skipped = 1
    const canFn = vi.fn().mockImplementation((_perm: any, _cf: any, _org: any, spaceGuid?: string) =>
      of(spaceGuid === undefined), // org-level: true; space-level: false
    );
    const deps = makeDeps({ userPerms: { can: canFn } });
    await bulkRemoveUsers(deps, { users: [uWithSpace], opts: { scope: 'orgAndSpaces' }, title: 'T', message: 'M' });
    await Promise.resolve(); await Promise.resolve();
    expect(deps.snackBar.open).toHaveBeenCalledWith(expect.stringContaining('skipped'));
    expect(deps.rolesData.executeChanges).toHaveBeenCalled();
  });

  it('emits a neutral notice and skips execution when candidates list is empty', async () => {
    const deps = makeDeps();
    await bulkRemoveUsers(deps, { users: [uNoRoles], opts: { scope: 'orgAndSpaces' }, title: 'T', message: 'M' });
    expect(deps.snackBar.open).toHaveBeenCalledWith('Nothing to remove for the selected users');
    expect(deps.rolesData.executeChanges).not.toHaveBeenCalled();
    expect(deps.confirmDialog.open).not.toHaveBeenCalled();
  });
});
