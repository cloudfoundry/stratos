import { APISuccessOrFailedAction } from '../../../../../store/src/types/request.types';
import { ChangeCfUserRole } from '../../../actions/users.actions';
import { CfPermissionStrings } from '../../../user-permissions/cf-user-permissions-checkers';
import { IAllCfRolesState, ICfRolesState, IOrgRoleState, ISpaceRoleState } from '../../types/cf-current-user-roles.types';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../types/cf-user.types';
import { defaultCfUserOrgRoleState } from './current-cf-user-roles-org.reducer';
import { defaultCfUserSpaceRoleState } from './current-cf-user-roles-space.reducer';

export function updateAfterCfRoleChange(
  state: IAllCfRolesState,
  isAdd: boolean,
  action: APISuccessOrFailedAction): IAllCfRolesState {
  const changePerm = action.apiAction as ChangeCfUserRole;
  if (!changePerm.updateConnectedUser) {
    // We haven't changed the user connected to this cf or the connected user is an admin. No need to update the permission roles
    return state;
  }

  const entityType = changePerm.isSpace ? 'spaces' : 'organizations';

  const cf = state[changePerm.endpointGuid];
  const entity = cf[entityType][changePerm.entityGuid] || createEmptyState(changePerm.isSpace, changePerm.orgGuid);
  const permissionType = userRoleNameToPermissionName(changePerm.permissionTypeKey);

  if (entity && entity[permissionType] === isAdd) {
    // No change, just return the state. Unlikely to happen
    return state;
  }

  // For space... update the space role AND org space guids list... for org just update the org role
  if (changePerm.isSpace) {
    return handleSpaceRoleChange(
      state,
      changePerm.endpointGuid,
      cf,
      changePerm.orgGuid,
      changePerm.entityGuid,
      entity as ISpaceRoleState,
      permissionType,
      isAdd);
  } else {
    return handleOrgRoleChange(state, changePerm.endpointGuid, cf, changePerm.entityGuid, entity as IOrgRoleState, permissionType, isAdd);
  }
}

function createEmptyState(isSpace: boolean, orgId?: string): ISpaceRoleState | IOrgRoleState {
  return isSpace ? {
    ...defaultCfUserSpaceRoleState,
    orgId
  } : {
      ...defaultCfUserOrgRoleState,
    };
}

function userRoleNameToPermissionName(roleName: OrgUserRoleNames | SpaceUserRoleNames): CfPermissionStrings {
  switch (roleName) {
    case OrgUserRoleNames.AUDITOR:
      return CfPermissionStrings.ORG_AUDITOR;
    case OrgUserRoleNames.BILLING_MANAGERS:
      return CfPermissionStrings.ORG_BILLING_MANAGER;
    case OrgUserRoleNames.MANAGER:
      return CfPermissionStrings.ORG_MANAGER;
    case OrgUserRoleNames.USER:
      return CfPermissionStrings.ORG_USER;
    case SpaceUserRoleNames.AUDITOR:
      return CfPermissionStrings.SPACE_AUDITOR;
    case SpaceUserRoleNames.DEVELOPER:
      return CfPermissionStrings.SPACE_DEVELOPER;
    case SpaceUserRoleNames.MANAGER:
      return CfPermissionStrings.SPACE_MANAGER;
  }
}

function handleOrgRoleChange(
  state: IAllCfRolesState,
  endpointGuid: string,
  cf: ICfRolesState,
  orgGuid: string,
  orgState: IOrgRoleState,
  permType: string,
  isAdd: boolean) {
  return spreadState(state, endpointGuid, {
    ...cf,
    organizations: {
      ...cf.organizations,
      [orgGuid]: {
        ...orgState,
        [permType]: isAdd
      }
    }
  });
}
/**
 * Update the space role AND org space guids list
 */
function handleSpaceRoleChange(
  state: IAllCfRolesState,
  endpointGuid: string,
  cf: ICfRolesState,
  orgGuid: string,
  spaceGuid: string,
  spaceState: ISpaceRoleState,
  permType: string,
  isAdd: boolean) {
  const spacePermissions = {
    ...spaceState,
    [permType]: isAdd
  };
  let spaceGuids = cf.organizations[orgGuid].spaceGuids;
  const spaceGuidIndex = spaceGuids.indexOf(spaceGuid);
  if (isAdd && spaceGuidIndex < 0) {
    // Add the space guid to the org's space guid list
    spaceGuids = [...spaceGuids, spaceGuid];
  } else if (
    !isAdd &&
    spaceGuidIndex >= 0 &&
    !spacePermissions.isAuditor && !spacePermissions.isDeveloper && !spacePermissions.isManager) {
    // Remove the space guid from the org's space guid list
    spaceGuids = spaceGuids.filter(guid => guid !== spaceGuid);
  }
  return spreadState(state, endpointGuid, {
    ...cf,
    organizations: {
      ...cf.organizations,
      [orgGuid]: {
        ...cf.organizations[orgGuid],
        spaceGuids
      }
    },
    spaces: {
      ...cf.spaces,
      [spaceGuid]: spacePermissions
    }
  });
}

function spreadState(state: IAllCfRolesState, cfGuid: string, cf: ICfRolesState): IAllCfRolesState {
  return {
    ...state,
    [cfGuid]: {
      ...cf
    }
  };
}
