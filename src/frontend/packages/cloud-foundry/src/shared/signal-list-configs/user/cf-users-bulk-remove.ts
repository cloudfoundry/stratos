import type { StUser } from '../../../services/endpoint-data/stratos-types';
import { CfRoleChange } from '../../../store/types/users-roles.types';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../../store/types/cf-user.types';

export type RemoveScope = 'spaces' | 'orgAndSpaces';

export interface BuildRemoveOpts {
  scope: RemoveScope;
  /** Restrict to a single org (org pages). */
  orgGuid?: string;
  /** Restrict to a single space (space pages). */
  spaceGuid?: string;
  orgNameByGuid?: Map<string, string>;
  spaceNameByGuid?: Map<string, string>;
}

// StUser buckets carry singular backend role names; CfRoleChange.role is the
// plural enum. Map forward here so callers never leak singular names onto the wire.
const ORG_ROLE: Record<string, OrgUserRoleNames> = {
  manager: OrgUserRoleNames.MANAGER,
  billing_manager: OrgUserRoleNames.BILLING_MANAGERS,
  auditor: OrgUserRoleNames.AUDITOR,
  user: OrgUserRoleNames.USER,
};
const SPACE_ROLE: Record<string, SpaceUserRoleNames> = {
  manager: SpaceUserRoleNames.MANAGER,
  auditor: SpaceUserRoleNames.AUDITOR,
  developer: SpaceUserRoleNames.DEVELOPER,
};

/** Build add:false role-removal changes from the selected users' held roles. */
export function buildRemoveChanges(users: StUser[], opts: BuildRemoveOpts): CfRoleChange[] {
  const changes: CfRoleChange[] = [];
  const orgName = (g: string) => opts.orgNameByGuid?.get(g) ?? '';
  const spaceName = (g: string) => opts.spaceNameByGuid?.get(g) ?? '';

  for (const u of users) {
    if (opts.scope === 'orgAndSpaces') {
      for (const b of u.orgRoles) {
        if (opts.orgGuid && b.orgGuid !== opts.orgGuid) { continue; }
        for (const r of b.roles) {
          const role = ORG_ROLE[r];
          if (role) { changes.push({ userGuid: u.guid, orgGuid: b.orgGuid, orgName: orgName(b.orgGuid), add: false, role }); }
        }
      }
    }
    for (const b of u.spaceRoles) {
      if (opts.orgGuid && b.orgGuid !== opts.orgGuid) { continue; }
      if (opts.spaceGuid && b.spaceGuid !== opts.spaceGuid) { continue; }
      for (const r of b.roles) {
        const role = SPACE_ROLE[r];
        if (role) {
          changes.push({
            userGuid: u.guid, orgGuid: b.orgGuid, orgName: orgName(b.orgGuid),
            spaceGuid: b.spaceGuid, spaceName: spaceName(b.spaceGuid), add: false, role,
          });
        }
      }
    }
  }
  return changes;
}

/** True if any selected user holds a space role (optionally within one space). */
export function selectedHasSpaceRole(users: StUser[], spaceGuid?: string): boolean {
  return users.some(u => u.spaceRoles.some(b => (!spaceGuid || b.spaceGuid === spaceGuid) && b.roles.length > 0));
}

/** True if any selected user holds any role (optionally within one org). */
export function selectedHasAnyRole(users: StUser[], orgGuid?: string): boolean {
  return users.some(u =>
    u.orgRoles.some(b => (!orgGuid || b.orgGuid === orgGuid) && b.roles.length > 0) ||
    u.spaceRoles.some(b => (!orgGuid || b.orgGuid === orgGuid) && b.roles.length > 0));
}

// ─── Bulk-remove orchestrator ──────────────────────────────────────────────

import { firstValueFrom, combineLatest, of, map } from 'rxjs';
import { CfUsersRolesDataService } from '../../../services/domain-data/cf-users-roles-data.service';
import {
  CurrentUserPermissionsService,
  ConfirmationDialogService,
  ConfirmationDialogConfig,
  TailwindSnackBarService,
} from '@stratosui/core';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions.types';

export interface BulkRemoveDeps {
  rolesData: CfUsersRolesDataService;
  userPerms: CurrentUserPermissionsService;
  confirmDialog: ConfirmationDialogService;
  snackBar: TailwindSnackBarService;
  cfGuid: string;
}

export interface BulkRemoveRequest {
  users: StUser[];
  opts: BuildRemoveOpts;
  title: string;
  message: string;
  onComplete?: () => void;
}

export async function bulkRemoveUsers(deps: BulkRemoveDeps, req: BulkRemoveRequest): Promise<void> {
  const candidates = buildRemoveChanges(req.users, req.opts);
  if (candidates.length === 0) { return; }

  // Permission-filter per change (mirrors RemoveUserComponent).
  const checks = candidates.map(c => {
    const can$ = c.spaceGuid
      ? deps.userPerms.can(CfCurrentUserPermissions.SPACE_CHANGE_ROLES, deps.cfGuid, c.orgGuid, c.spaceGuid)
      : deps.userPerms.can(CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES, deps.cfGuid, c.orgGuid);
    return can$.pipe(map(can => ({ can, change: c })));
  });
  const verdicts = await firstValueFrom(checks.length ? combineLatest(checks) : of([]));
  const allowed = verdicts.filter(v => v.can).map(v => v.change);
  if (allowed.length === 0) {
    deps.snackBar.error('You do not have permission to remove the selected roles');
    return;
  }

  const config = new ConfirmationDialogConfig(req.title, req.message, 'Remove', true);
  deps.confirmDialog.open(config, async () => {
    deps.rolesData.setUsers(deps.cfGuid, req.users);
    deps.rolesData.setIsRemove(true);
    deps.rolesData.setChanges(allowed);
    await deps.rolesData.executeChanges();
    const status = deps.rolesData.applyStatus();
    const failed = allowed.filter(c => status[CfUsersRolesDataService.changeKey(c)] === 'error');
    if (failed.length) {
      deps.snackBar.error(
        `Removed ${allowed.length - failed.length} of ${allowed.length} role grants; ${failed.length} failed`,
      );
    } else {
      deps.snackBar.open('Selected users removed');
    }
    req.onComplete?.();
  });
}
