import { PermissionStrings } from '../../../core/current-user-permissions.config';
import { ChangeUserRole } from '../../actions/users.actions';
import { ICfRolesState, ICurrentUserRolesState } from '../../types/current-user-roles.types';
import { APISuccessOrFailedAction } from '../../types/request.types';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../types/user.types';

export function updateAfterRoleChange(
  state: ICurrentUserRolesState,
  isAdd: boolean,
  action: APISuccessOrFailedAction): ICurrentUserRolesState {
  const changePerm = action.apiAction as ChangeUserRole;
  if (!changePerm.updateConnectedUser) {
    // We haven't changed the user connected to this cf or the connected user is an admin. No need to update the permission roles
    return state;
  }

  const entityType = changePerm.isSpace ? 'spaces' : 'organizations';

  const cf = state.cf[changePerm.endpointGuid];
  const entity = cf[entityType][changePerm.entityGuid];

  const permissionType = userRoleNameToPermissionName(changePerm.permissionTypeKey);
  const currentValue = entity[permissionType];

  if (currentValue === isAdd) {
    // No change, just return the state. Unlikely to happen
    return state;
  }

  const newCf = {
    ...cf,
    [entityType]: {
      ...cf[entityType],
      [changePerm.entityGuid]: {
        ...entity,
        [permissionType]: isAdd
      }
    }
  };
  return spreadState(state, changePerm.endpointGuid, newCf);
}

function userRoleNameToPermissionName(roleName: OrgUserRoleNames | SpaceUserRoleNames): PermissionStrings {
  switch (roleName) {
    case OrgUserRoleNames.AUDITOR:
      return PermissionStrings.ORG_AUDITOR;
    case OrgUserRoleNames.BILLING_MANAGERS:
      return PermissionStrings.ORG_BILLING_MANAGER;
    case OrgUserRoleNames.MANAGER:
      return PermissionStrings.ORG_MANAGER;
    case OrgUserRoleNames.USER:
      return PermissionStrings.ORG_USER;
    case SpaceUserRoleNames.AUDITOR:
      return PermissionStrings.SPACE_AUDITOR;
    case SpaceUserRoleNames.DEVELOPER:
      return PermissionStrings.SPACE_DEVELOPER;
    case SpaceUserRoleNames.MANAGER:
      return PermissionStrings.SPACE_MANAGER;
  }
}

function spreadState(state: ICurrentUserRolesState, cfGuid: string, cf: ICfRolesState): ICurrentUserRolesState {
  return {
    ...state,
    cf: {
      ...state.cf,
      [cfGuid]: {
        ...cf
      }
    }
  };
}
