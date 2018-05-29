import { CfUser, IUserPermissionInOrg, OrgUserRoleNames, SpaceUserRoleNames } from './user.types';

export interface UsersRolesState {
  cfGuid: string;
  users: CfUser[];
  newRoles: IUserPermissionInOrg;
  changedRoles: CfRoleChange[];
}

export interface CfUserRolesSelected {
  [userGuid: string]: {
    [orgGuid: string]: IUserPermissionInOrg
  };
}

export class CfRoleChange {
  userGuid: string;
  orgGuid: string;
  spaceGuid?: string;
  add: boolean;
  role: OrgUserRoleNames | SpaceUserRoleNames;
}

export class CfRoleChangeWithNames extends CfRoleChange {
  userName: string; // Why are all these names set out flat? So we can easily sort in future
  orgName: string;
  spaceName?: string;
  roleName: string;
}

export const UserRoleLabels = {
  org: {
    short: {
      [OrgUserRoleNames.MANAGER]: 'Manager',
      [OrgUserRoleNames.BILLING_MANAGERS]: 'Billing Manager',
      [OrgUserRoleNames.AUDITOR]: 'Auditor',
      [OrgUserRoleNames.USER]: 'User'
    },
    long: {
      [OrgUserRoleNames.MANAGER]: 'Org Manager',
      [OrgUserRoleNames.BILLING_MANAGERS]: 'Org Billing Manager',
      [OrgUserRoleNames.AUDITOR]: 'Org Auditor',
      [OrgUserRoleNames.USER]: 'Org User'
    }
  },
  space: {
    short: {
      [SpaceUserRoleNames.MANAGER]: 'Manager',
      [SpaceUserRoleNames.DEVELOPER]: 'Developer',
      [SpaceUserRoleNames.AUDITOR]: 'Auditor',
    },
    long: {
      [SpaceUserRoleNames.MANAGER]: 'Space Manager',
      [SpaceUserRoleNames.DEVELOPER]: 'Space Developer',
      [SpaceUserRoleNames.AUDITOR]: 'Space Auditor',
    }
  }
};
