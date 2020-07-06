import { Action } from '@ngrx/store';

import { CfUser } from '../store/types/cf-user.types';
import { CfRoleChange } from '../store/types/users-roles.types';

export const UsersRolesActions = {
  SetUsers: '[Users Roles] Set users',
  Clear: '[Users Roles] Clear users',
  ClearUpdateState: '[Users Roles] Clear update state',
  SetOrg: '[Users Roles] Set org',
  SetOrgRole: '[Users Roles] Set org role',
  SetSpaceRole: '[Users Roles] Set space role',
  FlipSetRoles: '[Users Roles] Flip Set Roles',
  SetIsRemove: '[Users Roles] Set Is Remove',
  SetIsSetByUsername: '[Users Roles] Set Is Set By Username',
  SetChanges: '[Users Roles] Set role changes',
  ExecuteChanges: '[Users Roles] Execute changes',
};

export class UsersRolesSetUsers implements Action {
  type = UsersRolesActions.SetUsers;
  constructor(public cfGuid: string, public users: CfUser[], public origin?: string) { }
}

export class UsersRolesFlipSetRoles implements Action {
  type = UsersRolesActions.FlipSetRoles;
  constructor() { }
}

export class UsersRolesSetIsRemove implements Action {
  type = UsersRolesActions.SetIsRemove;
  constructor(public isRemove: boolean) { }
}

export class UsersRolesSetIsSetByUsername implements Action {
  type = UsersRolesActions.SetIsSetByUsername;
  constructor(public isSetByUsername: boolean) { }
}

export class UsersRolesSetOrgRole implements Action {
  type = UsersRolesActions.SetOrgRole;
  constructor(public orgGuid: string, public orgName: string, public role: string, public setRole: boolean) { }
}

export class UsersRolesSetSpaceRole implements Action {
  type = UsersRolesActions.SetSpaceRole;
  constructor(
    public orgGuid: string,
    public orgName: string,
    public spaceGuid: string,
    public spaceName: string,
    public role: string,
    public setRole: boolean
  ) { }
}

export class UsersRolesClear implements Action {
  type = UsersRolesActions.Clear;
  constructor() { }
}

export class UsersRolesClearUpdateState implements Action {
  type = UsersRolesActions.ClearUpdateState;
  constructor(public changedRoles: CfRoleChange[]) { }
}

export class UsersRolesSetOrg implements Action {
  type = UsersRolesActions.SetOrg;
  constructor(public orgGuid: string, public orgName: string) { }
}

export class UsersRolesSetChanges implements Action {
  type = UsersRolesActions.SetChanges;
  constructor(public changes: CfRoleChange[]) { }
}

export class UsersRolesExecuteChanges implements Action {
  type = UsersRolesActions.ExecuteChanges;
  constructor(public setByUsername = false, public resetOrgUsers?: string, public resetSpaceUsers?: string) { }
}
