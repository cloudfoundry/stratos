import { CfRoleChange } from '../../../store/types/users-roles.types';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../../store/types/cf-user.types';

export interface AddRoleSelection {
  orgRoles: OrgUserRoleNames[];
  spaceRolesBySpace: Record<string, SpaceUserRoleNames[]>;
}

export interface BuildAddOpts {
  orgGuid: string;
  orgName: string;
  spaceNameByGuid?: Map<string, string>;
  selection: AddRoleSelection;
}

/** Build add:true role-grant changes for the given users. */
export function buildAddChanges(userGuids: string[], opts: BuildAddOpts): CfRoleChange[] {
  const out: CfRoleChange[] = [];
  for (const userGuid of userGuids) {
    for (const role of opts.selection.orgRoles) {
      out.push({ userGuid, orgGuid: opts.orgGuid, orgName: opts.orgName, add: true, role });
    }
    for (const [spaceGuid, roles] of Object.entries(opts.selection.spaceRolesBySpace)) {
      for (const role of roles) {
        out.push({
          userGuid, orgGuid: opts.orgGuid, orgName: opts.orgName,
          spaceGuid, spaceName: opts.spaceNameByGuid?.get(spaceGuid), add: true, role,
        });
      }
    }
  }
  return out;
}
