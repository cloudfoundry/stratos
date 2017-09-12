import { Schema } from 'normalizr';
import { RequestOptions } from '@angular/http';
import { Action } from '@ngrx/store';

export const ApiActionTypes = {
  API_REQUEST: 'API_REQUEST',
  API_REQUEST_START: 'API_REQUEST_START',
  API_REQUEST_SUCCESS: 'API_REQUEST_SUCCESS',
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
};

export class APIAction implements Action {
  actions: string[];
  type = ApiActionTypes.API_REQUEST;
  options: RequestOptions;
  entity: Schema;
  entityKey: string;
  paginationKey?: string;
}

export class StartAPIAction implements APIAction {
  constructor(
    public options: RequestOptions,
    public actions: string[],
    public entity: Schema,
    public entityKey: string,
    public paginationKey?: string
  ) { }
  type = ApiActionTypes.API_REQUEST_START;
}

export class WrapperAPIActionSuccess implements Action {
  constructor(
    public type: string,
    public response: {},
    public entityKey: string,
    public paginationKey?: string
  ) { }
  apiType = ApiActionTypes.API_REQUEST_SUCCESS;
}

export class WrapperAPIActionFailed implements Action {
  constructor(
    public type: string,
    public message: string,
    public entity: Schema,
    public entityKey: string,
    public paginationKey?: string
  ) { }
  apiType = ApiActionTypes.API_REQUEST_FAILED;
}

