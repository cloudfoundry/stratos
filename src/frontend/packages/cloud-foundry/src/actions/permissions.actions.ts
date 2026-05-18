import { Action } from '@ngrx/store';

import { APIResource } from '../../../store/src/types/api.types';

// Reducer (current-cf-user-roles.reducer) keys off this single SUCCESS type
// to apply the bucket data produced by fetchCfCurrentUserRoles. The
// historic per-relation success/failed constants (21 of them) and the
// V2-shaped GetCurrentCfUserRelations action (with its embedded
// `users/{guid}/{relType}` URL) are gone — single native call replaces the
// 7-fanout, single success dispatch replaces the 7 per-relation dispatches.
export const GET_CURRENT_CF_USER_RELATION_SUCCESS = '[Current User] Get relation success';

export const GET_CURRENT_CF_USER_RELATIONS = '[Current User] Get CF relations';
export const GET_CURRENT_CF_USER_RELATIONS_SUCCESS = '[Current User] Get CF relations success';
export const GET_CURRENT_CF_USER_RELATIONS_FAILED = '[Current User] Get CF relations failed';

export enum CfUserRelationTypes {
  AUDITED_ORGANIZATIONS = 'audited_organizations',
  BILLING_MANAGED_ORGANIZATION = 'billing_managed_organizations',
  MANAGED_ORGANIZATION = 'managed_organizations',
  ORGANIZATIONS = 'organizations',
  AUDITED_SPACES = 'audited_spaces',
  MANAGED_SPACES = 'managed_spaces',
  SPACES = 'spaces'
}

export class GetCfUserRelations implements Action {
  constructor(public cfGuid: string, public type: string) { }
}

export class GetCurrentCfUserRelationsComplete<T = any> {
  public type = GET_CURRENT_CF_USER_RELATION_SUCCESS;
  constructor(
    public relationType: CfUserRelationTypes, public endpointGuid: string, public data: APIResource<T>[]
  ) { }
}

