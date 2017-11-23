import { stringDistance } from 'codelyzer/util/utils';
import { RequestState } from '../reducers/api-request-reducer/types';
import { Schema } from 'normalizr';
import { RequestOptions } from '@angular/http';
import { Action } from '@ngrx/store';
import { ApiActionTypes } from '../actions/request.actions';
import { PaginatedAction } from './pagination.types';
import { EntitiesState } from './entity.types';

export interface EntityInfo {
  entityRequestInfo: RequestState;
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
  // For single entity requests
  guid?: string;
  options: RequestOptions;
}

export interface RequestAction extends Action, SingleEntityAction {
  cnis?: string;
  updatingKey?: string;
}
export class APIAction implements Action, RequestAction {
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
