import { Action } from '@ngrx/store';

import { IRequestEntityTypeState } from '../app-state';
import { APIResource } from '../types/api.types';
import { CfUser } from '../types/user.types';
import { REMOVE_PERMISSION_SUCCESS, RemoveUserPermission } from '../actions/users.actions';
import { OrgUserRoles } from '../../features/cloud-foundry/cf.helpers';
import { APISuccessOrFailedAction } from '../types/request.types';

export function userReducer(state: IRequestEntityTypeState<APIResource<CfUser>>, action: Action) {
  switch (action.type) {
    case REMOVE_PERMISSION_SUCCESS:
      const successAction = action as APISuccessOrFailedAction;
      const removeUserPermissionAction = successAction.apiAction as RemoveUserPermission;
      const { orgGuid, permissionTypeKey, guid } = removeUserPermissionAction;
      return {
        ...state,
        [guid]: {
          ...state[guid],
          entity: removeUserPermission(state[guid].entity, orgGuid, permissionTypeKey),
        }
      };
    default:
      return state;
  }
}

function removeUserPermission(user: CfUser, orgId: string, permissionType: OrgUserRoles) {
  switch (permissionType) {
    case OrgUserRoles.MANAGER:
      return {
        ...user,
        managed_organizations: user.managed_organizations.filter(org => org.metadata.guid !== orgId)
      };
    case OrgUserRoles.BILLING_MANAGERS:
      return {
        ...user,
        billing_managed_organizations: user.billing_managed_organizations.filter(org => org.metadata.guid !== orgId)
      };
    case OrgUserRoles.AUDITOR:
      return {
        ...user,
        audited_organizations: user.audited_organizations.filter(org => org.metadata.guid !== orgId)
      };
    case OrgUserRoles.USER:
      return {
        ...user,
        organizations: user.organizations.filter(org => org.metadata.guid !== orgId)
      };
    default:
      return user;
  }
}
