import { HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { EntitySchema } from '../../../store/src/helpers/entity-schema';
import { endpointEntityType } from '../../../store/src/helpers/stratos-entity-factory';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { EntityRequestAction } from '../../../store/src/types/request.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { cfUserEntityType, organizationEntityType, spaceEntityType } from '../cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
  EntityInlineParentAction,
} from '../entity-relations/entity-relations.types';
import { CfUserRoleParams, OrgUserRoleNames, SpaceUserRoleNames } from '../store/types/cf-user.types';
import { CFStartAction } from './cf-action.types';

export const GET_ALL_CF_USERS = '[Users] Get all';
export const GET_ALL_CF_USERS_SUCCESS = '[Users] Get all success';
export const GET_ALL_CF_USERS_FAILED = '[Users] Get all failed';

export const REMOVE_CF_ROLE = '[Users] Remove role';
export const REMOVE_CF_ROLE_SUCCESS = '[Users]  Remove role success';
export const REMOVE_CF_ROLE_FAILED = '[Users]  Remove role failed';

export const ADD_CF_ROLE = '[Users] Add role';
export const ADD_CF_ROLE_SUCCESS = '[Users]  Add role success';
export const ADD_CF_ROLE_FAILED = '[Users]  Add role failed';


export function createDefaultCfUserRelations() {
  return [
    createEntityRelationKey(cfUserEntityType, CfUserRoleParams.ORGANIZATIONS),
    createEntityRelationKey(cfUserEntityType, CfUserRoleParams.AUDITED_ORGS),
    createEntityRelationKey(cfUserEntityType, CfUserRoleParams.MANAGED_ORGS),
    createEntityRelationKey(cfUserEntityType, CfUserRoleParams.BILLING_MANAGER_ORGS),
    createEntityRelationKey(cfUserEntityType, CfUserRoleParams.SPACES),
    createEntityRelationKey(cfUserEntityType, CfUserRoleParams.MANAGED_SPACES),
    createEntityRelationKey(cfUserEntityType, CfUserRoleParams.AUDITED_SPACES)
  ];
}


export class GetAllCfUsersAsAdmin extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  isGetAllUsersAsAdmin = true;
  paginationKey: string;
  constructor(
    public endpointGuid: string,
    public includeRelations: string[] = createDefaultCfUserRelations(),
    public populateMissing = true,
    paginationKey?: string
  ) {
    super();
    this.paginationKey = paginationKey || createEntityRelationPaginationKey(endpointEntityType, endpointGuid);
    this.options = new HttpRequest(
      'GET',
      'users'
    );
  }
  actions = [GET_ALL_CF_USERS, GET_ALL_CF_USERS_SUCCESS, GET_ALL_CF_USERS_FAILED];
  entity = [cfEntityFactory(cfUserEntityType)];
  entityType = cfUserEntityType;
  options: HttpRequest<any>;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'username',
  };
  flattenPagination = true;
  flattenPaginationMax = true;
  static is(action: any): boolean {
    return !!action.isGetAllUsersAsAdmin;
  }
}

interface HttpParamsPayload {
  [param: string]: string;
}
interface ChangeUserRoleByUsernameParams extends HttpParamsPayload {
  username: string;
  origin?: string;
}
enum ChangeUserRoleType {
  ADD,
  REMOVE
}


// FIXME: These actions are user related however return either an org or space entity. These responses can be ignored and not stored, need
// a flag somewhere to handle that - https://jira.capbristol.com/browse/STRAT-119
/**
 *  Add or remove a user's role, either by user guid or name
 */
export class ChangeCfUserRole extends CFStartAction implements EntityRequestAction {
  public endpointType = 'cf';
  constructor(
    public endpointGuid: string,
    public userGuid: string,
    public changeRoleType: ChangeUserRoleType,
    public actions: string[],
    public permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames,
    public entityGuid: string,
    public isSpace = false,
    public updateConnectedUser = false,
    public orgGuid?: string,
    public username = '',
    public usernameOrigin = '',
  ) {
    super();
    this.guid = entityGuid;
    this.updatingKey = ChangeCfUserRole.generateUpdatingKey(permissionTypeKey, userGuid);
    this.options = new HttpRequest(
      this.createMethod(),
      this.createUrl(),
      this.createParams()
    );
    this.entityType = isSpace ? spaceEntityType : organizationEntityType;
    this.entity = cfEntityFactory(this.entityType);
  }

  guid: string;
  entity: EntitySchema;
  entityType: string;
  options: HttpRequest<any>;
  updatingKey: string;

  static generateUpdatingKey<T>(permissionType: OrgUserRoleNames | SpaceUserRoleNames, userGuid: string) {
    return `${permissionType}/${userGuid}`;
  }

  createMethod(): string {
    if (this.changeRoleType === ChangeUserRoleType.ADD) {
      return 'PUT';
    }
    return this.username ? 'POST' : 'DELETE';
  }

  createUrl(): string {
    const spaceOrOrg = this.isSpace ? 'spaces' : 'organizations';
    if (this.username) {
      // Change role via the username url
      return `${spaceOrOrg}/${this.guid}/${this.permissionTypeKey}${this.changeRoleType === ChangeUserRoleType.REMOVE ? '/remove' : ''}`;
    } else {
      return `${spaceOrOrg}/${this.guid}/${this.updatingKey}`;
    }
  }

  createParams(): object {
    if (this.username) {
      const payload: ChangeUserRoleByUsernameParams = {
        username: this.username,
      };
      if (this.usernameOrigin) {
        payload.origin = this.usernameOrigin;
      }
      return payload;
    }
    return null;
  }
}

export class AddCfUserRole extends ChangeCfUserRole {
  constructor(
    endpointGuid: string,
    userGuid: string,
    entityGuid: string,
    permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames,
    isSpace = false,
    updateConnectedUser = false,
    orgGuid?: string,
    username = '',
    usernameOrigin = '',
  ) {
    super(
      endpointGuid,
      userGuid,
      ChangeUserRoleType.ADD,
      [ADD_CF_ROLE, ADD_CF_ROLE_SUCCESS, ADD_CF_ROLE_FAILED],
      permissionTypeKey,
      entityGuid,
      isSpace,
      updateConnectedUser,
      orgGuid,
      username,
      usernameOrigin
    );
  }
}

export class RemoveCfUserRole extends ChangeCfUserRole {
  constructor(
    endpointGuid: string,
    userGuid: string,
    entityGuid: string,
    permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames,
    isSpace = false,
    updateConnectedUser = false,
    orgGuid?: string,
    username = '',
    usernameOrigin = '',
  ) {
    super(
      endpointGuid,
      userGuid,
      ChangeUserRoleType.REMOVE,
      [REMOVE_CF_ROLE, REMOVE_CF_ROLE_SUCCESS, REMOVE_CF_ROLE_FAILED],
      permissionTypeKey,
      entityGuid,
      isSpace,
      updateConnectedUser,
      orgGuid,
      username,
      usernameOrigin
    );
  }
}

export class GetCfUser extends CFStartAction {
  constructor(
    public endpointGuid: string,
    public guid: string,
    public includeRelations: string[] = createDefaultCfUserRelations(),
    public populateMissing = true) {
    super();
    this.options = new HttpRequest(
      'GET',
      'users/' + guid
    );
  }
  actions = getActions('Users', 'Fetch User');
  entity = [cfEntityFactory(cfUserEntityType)];
  entityType = cfUserEntityType;
  options: HttpRequest<any>;
}


