import { Schema } from 'normalizr';
import { RequestOptions } from '@angular/http';
import { Action } from '@ngrx/store';
import { ApiActionTypes } from '../actions/api.actions';
import { PaginatedAction } from './pagination.types';
import { EntityRequestState } from '../reducers/api-request-reducer';
import { EntitiesState } from './entity.types';

export interface EntityInfo {
  entityRequestInfo: EntityRequestState;
  entity: any;
}

export interface APIResource {
  metadata: APIResourceMetadata;
  entity: any;
}

export interface APIResourceMetadata {
  created_at: string;
  guid: string;
  update_at: string;
  url: string;
}
export interface SingleEntityAction {
  entityKey: string;
  guid?: string;
}
export class APIAction implements Action, SingleEntityAction {
  actions: string[];
  type = ApiActionTypes.API_REQUEST;
  options: RequestOptions;
  entity: Schema;
  entityKey: string;
  cnis?: string;
  // For single entity requests
  guid?: string;
  updatingKey?: string;
}

export interface NormalizedResponse {
  entities: {
    [key: string]: any
  };
  result: any[];
}

export class StartAPIAction implements Action {
  constructor(
    public apiAction: APIAction | PaginatedAction
  ) {
  }
  type = ApiActionTypes.API_REQUEST_START;
}

export class WrapperAPIActionSuccess implements Action {
  constructor(
    public type: string,
    public response: NormalizedResponse,
    public apiAction: APIAction | PaginatedAction,
    public totalResults?: number
  ) { }
  apiType = ApiActionTypes.API_REQUEST_SUCCESS;
}

export class WrapperAPIActionFailed implements Action {
  constructor(
    public type: string,
    public message: string,
    public apiAction: APIAction | PaginatedAction
  ) { }
  apiType = ApiActionTypes.API_REQUEST_FAILED;
}


export type ActionMergeFunction = (oldEntities: EntitiesState, newEntities: NormalizedResponseEntities)
  => NormalizedResponseEntities;
export interface NormalizedResponseEntities {
  [key: string]: string;
}
