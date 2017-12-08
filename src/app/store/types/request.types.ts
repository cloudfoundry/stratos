import { ApiRequestTypes } from '../reducers/api-request-reducer/request-helpers';
import { Schema } from 'normalizr';
import { ApiActionTypes, NonApiActionTypes } from '../actions/request.actions';
import { PaginatedAction } from './pagination.types';
import { NormalizedResponse } from './api.types';
import { RequestOptions } from '@angular/http';
import { Action } from '@ngrx/store';

export interface SingleEntityAction {
  entityKey: string;
  // For single entity requests
  guid?: string;
}

export interface RequestAction extends Action, SingleEntityAction {
  cnis?: string;
  updatingKey?: string;
}

export interface IAPIAction extends RequestAction {
  entity?: Schema;
  entityKey: string;
  // For single entity requests
  guid?: string;
}

export interface ICFAction extends IAPIAction {
  options: RequestOptions;
  actions: string[];
}

export interface IStartRequestAction {
  apiAction: IAPIAction | PaginatedAction;
  requestType: ApiRequestTypes;
}

export interface ISuccessRequestAction {
  type: string;
  response: NormalizedResponse;
  apiAction: IAPIAction | PaginatedAction;
  requestType: ApiRequestTypes;
  totalResults?: number;
}

export interface IFailedRequestAction {
  type: string;
  message: string;
  apiAction: IAPIAction | PaginatedAction;
  requestType: ApiRequestTypes;
}

export abstract class CFStartAction implements Action {
  type = ApiActionTypes.API_REQUEST_START;
}
export abstract class CFAction implements Action {
  type = ApiActionTypes.API_REQUEST;
}
export abstract class CFSuccessAction implements Action {
  type = ApiActionTypes.API_REQUEST_SUCCESS;
}
export abstract class CFFailedAction implements Action {
  type = ApiActionTypes.API_REQUEST_FAILED;
}

export class StartCFAction extends CFStartAction implements IStartRequestAction {
  constructor(
    public apiAction: ICFAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch'
  ) {
    super();
  }
}

export class WrapperCFActionSuccess extends CFSuccessAction implements ISuccessRequestAction {
  constructor(
    public response: NormalizedResponse,
    public apiAction: IAPIAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch',
    public totalResults?: number
  ) {
    super();
  }
}

export class WrapperCFActionFailed extends CFFailedAction implements IFailedRequestAction {
  constructor(
    public message: string,
    public apiAction: IAPIAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch'
  ) {
    super();
  }
}

export abstract class NoneCFAction implements Action {
  type = NonApiActionTypes.START;
}
export abstract class NoneCFSuccessAction implements Action {
  type = NonApiActionTypes.SUCCESS;
}
export abstract class NoneCFFailedAction implements Action {
  type = NonApiActionTypes.FAILED;
}

export class StartNoneCFAction extends NoneCFAction implements IStartRequestAction {
  constructor(
    public apiAction: IAPIAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch'
  ) {
    super();
  }
}

export class WrapperNoneCFActionSuccess extends NoneCFSuccessAction implements ISuccessRequestAction {
  constructor(
    public response: NormalizedResponse,
    public apiAction: IAPIAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch',
    public totalResults?: number
  ) {
    super();
  }
}

export class WrapperNoneCFActionFailed extends NoneCFFailedAction implements IFailedRequestAction {
  constructor(
    public message: string,
    public apiAction: IAPIAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch'
  ) {
    super();
  }
}



