import { schema } from 'normalizr';
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
  entity: schema.Entity;
  paginationKey?: string;
}

export class StartAPIAction implements Action {
  constructor(
    public options: RequestOptions,
    public actions: string[],
    public entity: schema.Entity
  ) { }
  type = ApiActionTypes.API_REQUEST_START;
}

export class WrapperAPIActionSuccess implements Action {
  constructor (
    public type: string,
    public response: {}
  ) { }
  apiType = ApiActionTypes.API_REQUEST_SUCCESS;
}

export class WrapperAPIActionFailed implements Action {
  constructor (
    public type: string,
    public message: string,
    public entity: schema.Entity
  ) { }
  apiType = ApiActionTypes.API_REQUEST_FAILED;
}

