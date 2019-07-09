import { RequestOptions } from '@angular/http';

import {
  cfEntityFactory,
  cfUserEntityType,
  organizationEntityType,
  spaceEntityType,
} from '../cf-entity-factory';
import { endpointSchemaKey } from '../../../store/src/helpers/entity-factory';
import {
  createEntityRelationPaginationKey,
  EntityInlineParentAction,
} from '../../../store/src/helpers/entity-relations/entity-relations.types';
import { EntitySchema } from '../../../store/src/helpers/entity-schema';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { CFStartAction, IRequestAction } from '../../../store/src/types/request.types';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../../store/src/types/user.types';
import { getActions } from '../../../store/src/actions/action.helper';
import { createDefaultUserRelations } from './user.actions.helpers';

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
// TODO: Can we get rid of this?
export class GetCFUser extends CFStartAction implements IRequestAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `users/${guid}/summary`;
    this.options.method = 'get';
  }
  actions = [GET_CF_USER, GET_CF_USER_SUCCESS, GET_CF_USER_FAILED];
  entity = cfEntityFactory(cfUserEntityType);
  entityType = cfUserEntityType;
  options: RequestOptions;
}
// TODO: Where do these action sit within the entity catalogue?
// They are user role actions that have the entity type or either space of organization.
export class ChangeUserRole extends CFStartAction implements IRequestAction {
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
  // TODO: Stratos internal entity types don't need a endpoint type.
  // Should we create internal entity catalogue entries with a "fake" endpoint type?
  actions = getActions('Users', 'Fetch User');
  entity = [cfEntityFactory(cfUserEntityType)];
  entityType = cfUserEntityType;
  options: RequestOptions;
}


