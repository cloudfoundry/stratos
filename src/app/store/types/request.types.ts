import { ApiRequestTypes } from '../reducers/api-request-reducer/request-helpers';
import { Schema } from 'normalizr';
import { ApiActionTypes, RequestTypes } from '../actions/request.actions';
import { PaginatedAction } from './pagination.types';
import { NormalizedResponse } from './api.types';
import { RequestOptions } from '@angular/http';
import { Action } from '@ngrx/store';

export interface SingleEntityAction {
  entityKey: string;
  // For single entity requests
  guid?: string;
}

export interface IRequestAction extends Action {
  entity?: Schema;
  entityKey: string;
  cnis?: string;
  updatingKey?: string;
  // For single entity requests
  guid?: string;
}

export interface IStartRequestAction {
  apiAction: IRequestAction | PaginatedAction;
  requestType: ApiRequestTypes;
}

export interface ISuccessRequestAction {
  type: string;
  response: NormalizedResponse;
  apiAction: IRequestAction | PaginatedAction;
  requestType: ApiRequestTypes;
  totalResults?: number;
}

export interface IFailedRequestAction {
  type: string;
  message: string;
  apiAction: IRequestAction | PaginatedAction;
  requestType: ApiRequestTypes;
}

export abstract class CFStartAction implements Action {
  type = ApiActionTypes.API_REQUEST_START;
}
export abstract class RequestAction implements Action {
  type = RequestTypes.START;
}
export abstract class RequestSuccessAction implements Action {
  type = RequestTypes.SUCCESS;
}
export abstract class RequestFailedAction implements Action {
  type = RequestTypes.FAILED;
}

export interface ICFAction extends IRequestAction {
  options: RequestOptions;
  actions: string[];
}

export class StartCFAction extends CFStartAction implements IStartRequestAction {
  constructor(
    public apiAction: ICFAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch'
  ) {
    super();
  }
}

export class StartRequestAction extends RequestAction {
  constructor(
    public apiAction: IRequestAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch'
  ) {
    super();
  }
}


export class WrapperRequestActionSuccess extends RequestSuccessAction implements ISuccessRequestAction {
  constructor(
    public response: NormalizedResponse,
    public apiAction: IRequestAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch',
    public totalResults?: number
  ) {
    super();
  }
}

export class WrapperRequestActionFailed extends RequestFailedAction implements IFailedRequestAction {
  constructor(
    public message: string,
    public apiAction: IRequestAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch'
  ) {
    super();
  }
}


