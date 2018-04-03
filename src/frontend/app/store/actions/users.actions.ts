import { CFStartAction, IRequestAction } from '../types/request.types';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { ApiActionTypes } from './request.actions';
import { PaginatedAction } from '../types/pagination.types';
import { entityFactory, organizationSchemaKey, spaceSchemaKey } from '../helpers/entity-factory';
import { cfUserSchemaKey } from '../helpers/entity-factory';
import { OrgUserRoles } from '../../features/cloud-foundry/cf.helpers';
import { EntityInlineParentAction, createEntityRelationKey } from '../helpers/entity-relations.types';

export const GET_ALL = '[Users] Get all';
export const GET_ALL_SUCCESS = '[Users] Get all success';
export const GET_ALL_FAILED = '[Users] Get all failed';

export const REMOVE_PERMISSION = '[Users] Remove Permission';
export const REMOVE_PERMISSION_SUCCESS = '[Users]  Remove Permission success';
export const REMOVE_PERMISSION_FAILED = '[Users]  Remove Permission failed';

export class GetAllUsers extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public paginationKey: string,
    public endpointGuid: string,
    public includeRelations: string[] = [
      createEntityRelationKey(cfUserSchemaKey, organizationSchemaKey),
      createEntityRelationKey(cfUserSchemaKey, 'audited_organizations'),
      createEntityRelationKey(cfUserSchemaKey, 'managed_organizations'),
      createEntityRelationKey(cfUserSchemaKey, 'billing_managed_organizations'),
      createEntityRelationKey(cfUserSchemaKey, spaceSchemaKey),
      createEntityRelationKey(cfUserSchemaKey, 'managed_spaces'),
      createEntityRelationKey(cfUserSchemaKey, 'audited_spaces')
    ],
    public populateMissing = true) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'users';
    this.options.method = 'get';
  }
  actions = [GET_ALL, GET_ALL_SUCCESS, GET_ALL_FAILED];
  entity = [entityFactory(cfUserSchemaKey)];
  entityKey = cfUserSchemaKey;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
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
  entity = entityFactory(cfUserSchemaKey);
  entityKey = cfUserSchemaKey;
  options: RequestOptions;
  updatingKey: string;

  static generateUpdatingKey(orgGuid: string, permissionType: OrgUserRoles, userGuid: string) {
    return `${orgGuid}/${permissionType}/${userGuid}`;
  }
}
