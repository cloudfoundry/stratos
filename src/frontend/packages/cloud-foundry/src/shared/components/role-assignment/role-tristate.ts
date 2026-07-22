import { CfUserRolesSelected, CfRoleChange } from '../../../store/types/users-roles.types';
import { IUserPermissionInOrg, OrgUserRoleNames, SpaceUserRoleNames } from '../../../store/types/cf-user.types';
import { StUser } from '../../../services/endpoint-data/stratos-types';

// A widget-owned selection model: per org, the user's explicit overrides.
// undefined = not set by user (fall through to baseline); true/false = explicit.
export interface RoleSelectionOrg {
  orgGuid: string;
  orgName: string;
  orgRoles: Partial<Record<OrgUserRoleNames, boolean>>;
  spaces: Record<string, { spaceName: string; roles: Partial<Record<SpaceUserRoleNames, boolean>> }>;
}
export type RoleSelection = Record<string, RoleSelectionOrg>; // keyed by orgGuid

/**
 * Lifted from CfRoleCheckboxComponent.hasRole (line 107-121).
 * Returns true/false if the role is set in orgRoles; undefined if the org entry
 * or space entry is absent (meaning no explicit setting in the baseline).
 */
function hasRole(
  role: string,
  orgRoles: IUserPermissionInOrg,
  spaceGuid?: string,
): boolean | undefined {
  if (!orgRoles) {
    return undefined;
  }
  if (spaceGuid) {
    const spaceRoles = orgRoles.spaces?.[spaceGuid];
    return spaceRoles ? spaceRoles.permissions[role] : undefined;
  } else {
    return orgRoles.permissions[role];
  }
}

/**
 * Lifted from CfRoleCheckboxComponent.hasExistingRole (line 92-103).
 * Returns boolean: whether the user has the role in the baseline.
 */
function hasExistingRole(
  role: string,
  roles: CfUserRolesSelected,
  userGuid: string,
  orgGuid: string,
  spaceGuid?: string,
): boolean {
  if (roles && roles[userGuid] && roles[userGuid][orgGuid]) {
    return !!hasRole(role, roles[userGuid][orgGuid], spaceGuid);
  }
  return false;
}

/**
 * Compute the tri-state checked value for a single role cell.
 *
 * Ported from CfRoleCheckboxComponent.getCheckedState (line 129-199).
 *
 * Decision order:
 * 1. If the widget's RoleSelection has an explicit boolean for this role
 *    (not undefined), that wins immediately.
 * 2. Single user: reflect their baseline value (true/false).
 * 3. Multiple users: all have it → true; some → null; none → false.
 */
export function computeChecked(
  role: string,
  users: StUser[],
  baseline: CfUserRolesSelected,
  selection: RoleSelection,
  orgGuid: string,
  spaceGuid?: string,
): boolean | null {
  // Step 1: Check if the widget has an explicit user-set state for this role.
  const selOrg = selection[orgGuid];
  if (selOrg !== undefined) {
    const selVal = spaceGuid
      ? selOrg.spaces?.[spaceGuid]?.roles?.[role as SpaceUserRoleNames]
      : selOrg.orgRoles[role as OrgUserRoleNames];
    if (selVal !== undefined) {
      return selVal;
    }
  }

  // Step 2: Single user — reflect their baseline.
  if (users.length === 1) {
    return hasExistingRole(role, baseline, users[0].guid, orgGuid, spaceGuid);
  }

  // Step 3: Multiple users — all-true/some-null/none-false.
  let tooltip = '';
  let oneWithout = false;
  for (const user of users) {
    if (hasExistingRole(role, baseline, user.guid, orgGuid, spaceGuid)) {
      tooltip += `${user.username}, `;
    } else {
      oneWithout = true;
    }
  }

  if (!tooltip.length) {
    return false;
  }
  if (!oneWithout) {
    return true;
  }
  return null;
}

/**
 * Diff the entire RoleSelection against the baseline, producing one CfRoleChange
 * per (user × scope × role) where the explicit selection differs from that
 * user's baseline.
 *
 * Only entries explicitly set to true/false in the selection are emitted;
 * undefined (indeterminate) entries produce no changes.
 */
export function diffToChanges(
  users: StUser[],
  baseline: CfUserRolesSelected,
  selection: RoleSelection,
): CfRoleChange[] {
  const changes: CfRoleChange[] = [];

  for (const [orgGuid, selOrg] of Object.entries(selection)) {
    const { orgName, orgRoles, spaces } = selOrg;

    // Org-level roles
    for (const [role, selVal] of Object.entries(orgRoles) as [OrgUserRoleNames, boolean | undefined][]) {
      if (selVal === undefined) {
        continue;
      }
      for (const user of users) {
        const baselineVal = hasExistingRole(role, baseline, user.guid, orgGuid);
        if (selVal !== baselineVal) {
          changes.push(Object.assign(new CfRoleChange(), {
            userGuid: user.guid,
            orgGuid,
            orgName,
            add: selVal,
            role,
          }));
        }
      }
    }

    // Space-level roles
    for (const [spaceGuid, spaceEntry] of Object.entries(spaces)) {
      const { spaceName, roles } = spaceEntry;
      for (const [role, selVal] of Object.entries(roles) as [SpaceUserRoleNames, boolean | undefined][]) {
        if (selVal === undefined) {
          continue;
        }
        for (const user of users) {
          const baselineVal = hasExistingRole(role, baseline, user.guid, orgGuid, spaceGuid);
          if (selVal !== baselineVal) {
            changes.push(Object.assign(new CfRoleChange(), {
              userGuid: user.guid,
              orgGuid,
              orgName,
              spaceGuid,
              spaceName,
              add: selVal,
              role,
            }));
          }
        }
      }
    }
  }

  return changes;
}
