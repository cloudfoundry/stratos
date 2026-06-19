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
