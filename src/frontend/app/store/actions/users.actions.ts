import { CFStartAction, IRequestAction } from '../types/request.types';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { ApiActionTypes } from './request.actions';
import { PaginatedAction } from '../types/pagination.types';
import { UserSchema } from '../types/user.types';
import { OrgUserRoles } from '../../features/cloud-foundry/cf.helpers';

export const GET_ALL = '[Users] Get all';
export const GET_ALL_SUCCESS = '[Users] Get all success';
export const GET_ALL_FAILED = '[Users] Get all failed';

export const REMOVE_PERMISSION = '[Users] Remove Permission';
export const REMOVE_PERMISSION_SUCCESS = '[Users]  Remove Permission success';
export const REMOVE_PERMISSION_FAILED = '[Users]  Remove Permission failed';

export class GetAllUsers extends CFStartAction implements PaginatedAction {
  constructor(public paginationKey: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'users';
    this.options.method = 'get';
  }
  actions = [GET_ALL, GET_ALL_SUCCESS, GET_ALL_FAILED];
  entity = [UserSchema];
  entityKey = UserSchema.key;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'inline-relations-depth': 1
  };
}

export class RemoveUserPermission extends CFStartAction implements IRequestAction {
  constructor(
    public guid: string,
    public orgGuid: string,
    public permissionTypeKey: OrgUserRoles
  ) {
    super();
    this.updatingKey = RemoveUserPermission.generateUpdatingKey(orgGuid, permissionTypeKey, guid);
    this.options = new RequestOptions();
    this.options.url = `organizations/${this.updatingKey}`;
    this.options.method = 'delete';
  }
  actions = [REMOVE_PERMISSION, REMOVE_PERMISSION_SUCCESS, REMOVE_PERMISSION_FAILED];
  entity = UserSchema;
  entityKey = UserSchema.key;
  options: RequestOptions;
  updatingKey: string;

  static generateUpdatingKey(orgGuid: string, permissionType: OrgUserRoles, userGuid: string) {
    return `${orgGuid}/${permissionType}/${userGuid}`;
  }
}
