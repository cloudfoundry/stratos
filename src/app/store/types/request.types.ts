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
  options?: RequestOptions;
}

export interface RequestAction extends Action, SingleEntityAction {
  cnis?: string;
  updatingKey?: string;
}

export interface IAPIAction extends RequestAction {
  actions: string[];
  options: RequestOptions;
  entity: Schema;
  entityKey: string;
  // For single entity requests
  guid?: string;
}

export interface IStartRequestAction {
  apiAction: IAPIAction | PaginatedAction;
}

export interface ISuccessRequestAction {
  type: string;
  response: NormalizedResponse;
  apiAction: IAPIAction | PaginatedAction;
  totalResults?: number;
}

export interface IFailedRequestAction {
  type: string;
  message: string;
  apiAction: IAPIAction | PaginatedAction;
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
    public apiAction: IAPIAction | PaginatedAction
  ) {
    super();
  }
}

export class WrapperCFActionSuccess extends CFSuccessAction implements ISuccessRequestAction {
  constructor(
    public type: string,
    public response: NormalizedResponse,
    public apiAction: IAPIAction | PaginatedAction,
    public totalResults?: number
  ) {
    super();
  }
}

export class WrapperCFActionFailed extends CFSuccessAction implements IFailedRequestAction {
  constructor(
    public type: string,
    public message: string,
    public apiAction: IAPIAction | PaginatedAction
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
    public apiAction: IAPIAction | PaginatedAction
  ) {
    super();
  }
}

export class WrapperNoneCFActionSuccess extends NoneCFSuccessAction implements ISuccessRequestAction {
  constructor(
    public type: string,
    public response: NormalizedResponse,
    public apiAction: IAPIAction | PaginatedAction,
    public totalResults?: number
  ) {
    super();
  }
}

export class WrapperNoneCFActionFailed extends NoneCFFailedAction implements IFailedRequestAction {
  constructor(
    public type: string,
    public message: string,
    public apiAction: IAPIAction | PaginatedAction
  ) {
    super();
  }
}



