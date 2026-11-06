import { CfUserRoleParams, IUserPermissionInOrg, OrgUserRoleNames, SpaceUserRoleNames } from './cf-user.types';
import { StUser } from '../../services/endpoint-data/stratos-types';
import { ORG_ROLE_DEFS, SPACE_ROLE_DEFS, shortLabelOfScoped, longLabelOfScoped, RoleScope } from '../../roles/role-registry';

export interface UsersRolesState {
  cfGuid: string;
  users: StUser[];
  newRoles: IUserPermissionInOrg;
  changedRoles: CfRoleChange[];
  usernameOrigin?: string;
  isRemove?: boolean;
  isSetByUsername?: boolean;
}

export interface CfUserRolesSelected {
  [userGuid: string]: {
    [orgGuid: string]: IUserPermissionInOrg
  };
}

export class CfRoleChange {
  userGuid!: string;
  orgGuid!: string;
  spaceGuid?: string;
  add!: boolean;
  role!: OrgUserRoleNames | SpaceUserRoleNames;
  orgName!: string;
  spaceName?: string;
}

export class CfRoleChangeWithNames extends CfRoleChange {
  username!: string; // Why are all these names set out flat? So we can easily sort in future
  declare orgName: string;
  declare spaceName?: string;
  roleName!: string;
}

function buildLabels(defs: ReadonlyArray<{ stratos: string; bucket: string }>, scope: RoleScope) {
  const short: Record<string, string> = {};
  const long: Record<string, string> = {};
  for (const d of defs) {
    const s = shortLabelOfScoped(d.stratos);
    const l = longLabelOfScoped(d.stratos, scope);
    short[d.stratos] = s; short[d.bucket] = s;
    long[d.stratos] = l;  long[d.bucket] = l;
  }
  return { short, long };
}

export const UserRoleLabels: {
  org: {
    short: Record<OrgUserRoleNames | CfUserRoleParams, string>;
    long: Record<OrgUserRoleNames | CfUserRoleParams, string>;
  };
  space: {
    short: Record<SpaceUserRoleNames | CfUserRoleParams, string>;
    long: Record<SpaceUserRoleNames | CfUserRoleParams, string>;
  };
} = {
  org: buildLabels(ORG_ROLE_DEFS, 'org') as any,
  space: buildLabels(SPACE_ROLE_DEFS, 'space') as any,
};
