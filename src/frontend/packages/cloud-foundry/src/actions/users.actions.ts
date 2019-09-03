import { RequestOptions } from '@angular/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { endpointSchemaKey } from '../../../store/src/helpers/entity-factory';
import {
  createEntityRelationPaginationKey,
  EntityInlineParentAction,
} from '../entity-relations/entity-relations.types';
import { EntitySchema } from '../../../store/src/helpers/entity-schema';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../store/types/user.types';
import { cfEntityFactory, cfUserEntityType, organizationEntityType, spaceEntityType } from '../cf-entity-factory';
import { CFStartAction } from './cf-action.types';
import { createDefaultUserRelations } from './user.actions.helpers';
import { EntityRequestAction } from '../../../store/src/types/request.types';

export const GET_ALL = '[Users] Get all';
export const GET_ALL_SUCCESS = '[Users] Get all success';
export const GET_ALL_FAILED = '[Users] Get all failed';

export const REMOVE_ROLE = '[Users] Remove role';
export const REMOVE_ROLE_SUCCESS = '[Users]  Remove role success';
export const REMOVE_ROLE_FAILED = '[Users]  Remove role failed';

export const ADD_ROLE = '[Users] Add role';
export const ADD_ROLE_SUCCESS = '[Users]  Add role success';
export const ADD_ROLE_FAILED = '[Users]  Add role failed';

export const GET_CF_USER = '[Users] Get cf user ';
export const GET_CF_USER_SUCCESS = '[Users] Get cf user success';
export const GET_CF_USER_FAILED = '[Users] Get cf user failed';

export const GET_CF_USERS_AS_NON_ADMIN = '[Users] Get cf users by org ';
export const GET_CF_USERS_AS_NON_ADMIN_SUCCESS = '[Users] Get cf users by org success';


export class GetAllUsersAsAdmin extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  isGetAllUsersAsAdmin = true;
  constructor(
    public endpointGuid: string,
    public includeRelations: string[] = createDefaultUserRelations(),
    public populateMissing = true,
    public paginationKey = createEntityRelationPaginationKey(endpointSchemaKey, endpointGuid)
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'users';
    this.options.method = 'get';
  }
  actions = [GET_ALL, GET_ALL_SUCCESS, GET_ALL_FAILED];
  entity = [cfEntityFactory(cfUserEntityType)];
  entityType = cfUserEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'username',
  };
  flattenPagination = true;
  flattenPaginationMax = 600;
  static is(action: any): boolean {
    return !!action.isGetAllUsersAsAdmin;
  }
}
// FIXME: These actions are user related however return either an org or space entity. These responses can be ignored and not stored, need
// a flag somewhere to handle that - https://jira.capbristol.com/browse/STRAT-119
export class ChangeUserRole extends CFStartAction implements EntityRequestAction {
  public endpointType = 'cf';
  constructor(
    public endpointGuid: string,
    public userGuid: string,
    public method: string,
    public actions: string[],
    public permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames,
    public entityGuid: string,
    public isSpace = false,
    public updateConnectedUser = false,
    public orgGuid?: string
  ) {
    super();
    this.guid = entityGuid;
    this.updatingKey = ChangeUserRole.generateUpdatingKey(permissionTypeKey, userGuid);
    this.options = new RequestOptions();
    this.options.url = `${isSpace ? 'spaces' : 'organizations'}/${this.guid}/${this.updatingKey}`;
    this.options.method = method;
    this.entityType = isSpace ? spaceEntityType : organizationEntityType;
    this.entity = cfEntityFactory(this.entityType);
  }

  guid: string;
  entity: EntitySchema;
  entityType: string;
  options: RequestOptions;
  updatingKey: string;

  static generateUpdatingKey<T>(permissionType: OrgUserRoleNames | SpaceUserRoleNames, userGuid: string) {
    return `${permissionType}/${userGuid}`;
  }
}

export class AddUserRole extends ChangeUserRole {
  constructor(
    endpointGuid: string,
    userGuid: string,
    entityGuid: string,
    permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames,
    isSpace = false,
    updateConnectedUser = false,
    orgGuid?: string
  ) {
    super(
      endpointGuid,
      userGuid,
      'put',
      [ADD_ROLE, ADD_ROLE_SUCCESS, ADD_ROLE_FAILED],
      permissionTypeKey,
      entityGuid,
      isSpace,
      updateConnectedUser,
      orgGuid
    );
  }
}

export class RemoveUserRole extends ChangeUserRole {
  constructor(
    endpointGuid: string,
    userGuid: string,
    entityGuid: string,
    permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames,
    isSpace = false,
    updateConnectedUser = false,
    orgGuid?: string
  ) {
    super(
      endpointGuid,
      userGuid,
      'delete',
      [REMOVE_ROLE, REMOVE_ROLE_SUCCESS, REMOVE_ROLE_FAILED],
      permissionTypeKey,
      entityGuid,
      isSpace,
      updateConnectedUser,
      orgGuid
    );
  }
}

export class GetUser extends CFStartAction {
  constructor(
    public endpointGuid: string,
    public userGuid: string,
    public includeRelations: string[] = createDefaultUserRelations(),
    public populateMissing = true) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'users/' + userGuid;
    this.options.method = 'get';
  }
  actions = getActions('Users', 'Fetch User');
  entity = [cfEntityFactory(cfUserEntityType)];
  entityType = cfUserEntityType;
  options: RequestOptions;
}


