import { describe, it, expect, vi } from 'vitest';
import { of } from 'rxjs';
import { bulkRemoveUsers } from './cf-users-bulk-remove';
import { CfUsersRolesDataService } from '../../../services/domain-data/cf-users-roles-data.service';
import type { StUser } from '../../../services/endpoint-data/stratos-types';

const u: StUser = { guid: 'u1', username: 'alice', cnsiGuid: 'cnsi',
  orgRoles: [{ orgGuid: 'o1', roles: ['manager'] }], spaceRoles: [] };

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
});
