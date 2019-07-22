import { RequestOptions } from '@angular/http';
import { Action } from '@ngrx/store';

import { APIResource } from '../../../store/src/types/api.types';
import { organizationEntityType, spaceEntityType } from '../cf-entity-factory';

export const GET_AUDITED_ORG_CURRENT_USER_RELATIONS = '[Current User] Get audited org Relations';
export const GET_AUDITED_ORG_CURRENT_USER_RELATIONS_SUCCESS = '[Current User] Get audited org Relations success';
export const GET_AUDITED_ORG_CURRENT_USER_RELATIONS_FAILED = '[Current User] Get audited org Relations failed';

export const GET_BILLING_MANAGED_ORG_CURRENT_USER_RELATIONS = '[Current User] Get BILLING_MANAGED org Relations';
export const GET_BILLING_MANAGED_ORG_CURRENT_USER_RELATIONS_SUCCESS = '[Users] Get BILLING_MANAGED org Relations success';
export const GET_BILLING_MANAGED_ORG_CURRENT_USER_RELATIONS_FAILED = '[Users] Get BILLING_MANAGED org Relations failed';

export const GET_MANAGED_ORG_CURRENT_USER_RELATIONS = '[Current User] Get MANAGED org Relations';
export const GET_MANAGED_ORG_CURRENT_USER_RELATIONS_SUCCESS = '[Current User] Get MANAGED org Relations success';
export const GET_MANAGED_ORG_CURRENT_USER_RELATIONS_FAILED = '[Current User] Get MANAGED org Relations failed';

export const GET_ORG_CURRENT_USER_RELATIONS = '[Current User] Get org Relations';
export const GET_ORG_CURRENT_USER_RELATIONS_SUCCESS = '[Current User] Get org Relations success';
export const GET_ORG_CURRENT_USER_RELATIONS_FAILED = '[Current User] Get org Relations failed';

export const GET_AUDITED_SPACE_CURRENT_USER_RELATIONS = '[Current User] Get AUDITED_SPACE Relations';
export const GET_AUDITED_SPACE_CURRENT_USER_RELATIONS_SUCCESS = '[Current User] Get AUDITED_SPACE Relations success';
export const GET_AUDITED_SPACE_CURRENT_USER_RELATIONS_FAILED = '[Current User] Get AUDITED_SPACE Relations failed';

export const GET_MANAGED_SPACE_CURRENT_USER_RELATIONS = '[Current User] Get MANAGED_SPACE Relations';
export const GET_MANAGED_SPACE_CURRENT_USER_RELATIONS_SUCCESS = '[Current User] Get MANAGED_SPACE Relations success';
export const GET_MANAGED_SPACE_CURRENT_USER_RELATIONS_FAILED = '[Current User] Get MANAGED_SPACE Relations failed';

export const GET_SPACE_CURRENT_USER_RELATIONS = '[Current User] Get SPACE Relations';
export const GET_SPACE_CURRENT_USER_RELATIONS_SUCCESS = '[Current User] Get SPACE Relations success';
export const GET_SPACE_CURRENT_USER_RELATIONS_FAILED = '[Current User] Get SPACE Relations failed';

export const GET_CURRENT_USER_RELATION = '[Current User] Get relation';
export const GET_CURRENT_USER_RELATION_SUCCESS = '[Current User] Get relation success';
export const GET_CURRENT_USER_RELATION_FAILED = '[Current User] Get relation failed';

export const GET_CURRENT_USER_RELATIONS = '[Current User] Get relations';
export const GET_CURRENT_USER_RELATIONS_SUCCESS = '[Current User] Get relations success';
export const GET_CURRENT_USER_RELATIONS_FAILED = '[Current User] Get relations failed';

export const GET_CURRENT_USER_CF_RELATIONS = '[Current User] Get CF relations';
export const GET_CURRENT_USER_CF_RELATIONS_SUCCESS = '[Current User] Get CF relations success';
export const GET_CURRENT_USER_CF_RELATIONS_FAILED = '[Current User] Get CF relations failed';

export class GetCurrentUsersRelations implements Action {
  type = GET_CURRENT_USER_RELATIONS;
}

export enum UserRelationTypes {
  AUDITED_ORGANIZATIONS = 'audited_organizations',
  BILLING_MANAGED_ORGANIZATION = 'billing_managed_organizations',
  MANAGED_ORGANIZATION = 'managed_organizations',
  ORGANIZATIONS = 'organizations',
  AUDITED_SPACES = 'audited_spaces',
  MANAGED_SPACES = 'managed_spaces',
  SPACES = 'spaces'
}

export interface IUserRelationTypes {
  [key: string]: {
    actions: [
      string,
      string,
      string
    ];
    entityType: string;
  };
}

export class GetUserCfRelations implements Action {
  constructor(public cfGuid: string, public type: string) { }
}

/**
 * Used in conjunction with `permissions.effects.ts` to fetch roles of a user connected to a cf that power the permissions model
 */
export class GetUserRelations implements Action {
  public type = GET_CURRENT_USER_RELATION;
  public actions: string[];
  public options: RequestOptions;
  constructor(public guid: string, public relationType: UserRelationTypes, public endpointGuid: string) {
    const typeOptions = this.types[relationType];
    this.options = new RequestOptions();
    this.options.url = `users/${guid}/${relationType}`;
    this.options.method = 'get';

    this.actions = typeOptions.actions;
    this.type = GET_CURRENT_USER_RELATION;
  }
  private types: IUserRelationTypes = {
    [UserRelationTypes.AUDITED_ORGANIZATIONS]: {
      actions: [
        GET_AUDITED_ORG_CURRENT_USER_RELATIONS,
        GET_AUDITED_ORG_CURRENT_USER_RELATIONS_SUCCESS,
        GET_AUDITED_ORG_CURRENT_USER_RELATIONS_FAILED
      ],
      entityType: organizationEntityType
    },
    [UserRelationTypes.BILLING_MANAGED_ORGANIZATION]: {
      actions: [
        GET_BILLING_MANAGED_ORG_CURRENT_USER_RELATIONS,
        GET_BILLING_MANAGED_ORG_CURRENT_USER_RELATIONS_SUCCESS,
        GET_BILLING_MANAGED_ORG_CURRENT_USER_RELATIONS_FAILED
      ],
      entityType: organizationEntityType
    },
    [UserRelationTypes.MANAGED_ORGANIZATION]: {
      actions: [
        GET_MANAGED_ORG_CURRENT_USER_RELATIONS,
        GET_MANAGED_ORG_CURRENT_USER_RELATIONS_SUCCESS,
        GET_MANAGED_ORG_CURRENT_USER_RELATIONS_FAILED
      ],
      entityType: organizationEntityType
    },
    [UserRelationTypes.ORGANIZATIONS]: {
      actions: [GET_ORG_CURRENT_USER_RELATIONS, GET_ORG_CURRENT_USER_RELATIONS_SUCCESS, GET_ORG_CURRENT_USER_RELATIONS_FAILED],
      entityType: organizationEntityType
    },
    [UserRelationTypes.AUDITED_SPACES]: {
      actions: [
        GET_AUDITED_SPACE_CURRENT_USER_RELATIONS,
        GET_AUDITED_SPACE_CURRENT_USER_RELATIONS_SUCCESS,
        GET_AUDITED_SPACE_CURRENT_USER_RELATIONS_FAILED
      ],
      entityType: spaceEntityType
    },
    [UserRelationTypes.MANAGED_SPACES]: {
      actions: [
        GET_MANAGED_SPACE_CURRENT_USER_RELATIONS,
        GET_MANAGED_SPACE_CURRENT_USER_RELATIONS_SUCCESS,
        GET_MANAGED_SPACE_CURRENT_USER_RELATIONS_FAILED
      ],
      entityType: spaceEntityType
    },
    [UserRelationTypes.SPACES]: {
      actions: [
        GET_SPACE_CURRENT_USER_RELATIONS,
        GET_SPACE_CURRENT_USER_RELATIONS_SUCCESS,
        GET_SPACE_CURRENT_USER_RELATIONS_SUCCESS
      ],
      entityType: spaceEntityType
    }
  };
}

export class GetCurrentUserRelationsComplete<T = any> {
  public type = GET_CURRENT_USER_RELATION_SUCCESS;
  constructor(
    public relationType: UserRelationTypes, public endpointGuid: string, public data: APIResource<T>[]
  ) { }
}

export class GetCurrentUsersAuditedOrganizations extends GetUserRelations {
  constructor(public guid: string, endpointGuid: string) {
    super(guid, UserRelationTypes.AUDITED_ORGANIZATIONS, endpointGuid);
  }
}

export class GetCurrentUsersBillingOrganizations extends GetUserRelations {
  constructor(public guid: string, endpointGuid: string) {
    super(guid, UserRelationTypes.BILLING_MANAGED_ORGANIZATION, endpointGuid);
  }
}

export class GetCurrentUsersManagedOrganizations extends GetUserRelations {
  constructor(public guid: string, endpointGuid: string) {
    super(guid, UserRelationTypes.MANAGED_ORGANIZATION, endpointGuid);
  }
}

export class GetCurrentUsersOrganizations extends GetUserRelations {
  constructor(public guid: string, endpointGuid: string) {
    super(guid, UserRelationTypes.ORGANIZATIONS, endpointGuid);
  }
}

export class GetCurrentUsersAuditedSpaces extends GetUserRelations {
  constructor(public guid: string, endpointGuid: string) {
    super(guid, UserRelationTypes.AUDITED_SPACES, endpointGuid);
  }
}

export class GetCurrentUsersManagedSpaces extends GetUserRelations {
  constructor(public guid: string, endpointGuid: string) {
    super(guid, UserRelationTypes.MANAGED_SPACES, endpointGuid);
  }
}

export class GetCurrentUsersSpaces extends GetUserRelations {
  constructor(public guid: string, endpointGuid: string) {
    super(guid, UserRelationTypes.SPACES, endpointGuid);
  }
}

