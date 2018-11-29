import { RequestOptions } from '@angular/http';
import { Action } from '@ngrx/store';

import { ApiActionTypes, RequestTypes } from '../actions/request.actions';
import { EntitySchema } from '../helpers/entity-factory';
import { ApiRequestTypes } from '../reducers/api-request-reducer/request-helpers';
import { NormalizedResponse } from './api.types';
import { PaginatedAction } from './pagination.types';

export interface SingleEntityAction {
  entityKey: string;
  // For single entity requests
  guid?: string;
}

export interface RequestAction extends Action, SingleEntityAction {
  endpointGuid?: string;
  updatingKey?: string;
}

/**
 * The entities in the response can live in a few different places. This will tell us where to look in the response to gather the entities
 * @export
 */
export enum RequestEntityLocation {
  RESOURCE, // The response is an object and the entities list is within a 'resource' param. Falls back to 'OBJECT' if missing.
  ARRAY, // The response is an array which contains the entities
  OBJECT, // The response is the entity
  AUTOSCALER_ARRAY, // The response is for autoscaler
}

export type IRequestActionEntity = EntitySchema | EntitySchema[];
export interface IRequestAction extends RequestAction {
  entity?: IRequestActionEntity;
  entityKey: string;
  /**
   * This is used for multiaction lists where the deleted entity
   * is going to be part of another entities pagination section
   */
  proxyPaginationEntityKey?: string;

  /**
   * For a delete action, clear the pagination section for the given keys.
   * if proxyPaginationEntityKey isn't set, pagination sections for the entityKey will also be deleted.
   */
  clearPaginationEntityKeys?: string[];
  endpointGuid?: string;
  updatingKey?: string;
  /**
   * For single entity requests
   */
  guid?: string;
  entityLocation?: RequestEntityLocation;
  /**
   * For delete requests we clear the pagination sections (include all pages) of all list matching the same entity type. In some cases,
   * like local lists, we want to immediately remove that entry instead of clearing the table and refetching all data. This flag allows that
   */
  removeEntityOnDelete?: boolean;
}

export interface IUpdateRequestAction {
  apiAction: IRequestAction | PaginatedAction;
  busy: boolean;
  error: string;
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
export abstract class RequestUpdateAction implements Action {
  type = RequestTypes.UPDATE;
}

export class UpdateCfAction extends RequestUpdateAction implements IUpdateRequestAction {
  constructor(
    public apiAction: IRequestAction,
    public busy: boolean,
    public error: string,
  ) {
    super();
  }
}

export interface ICFAction extends IRequestAction {
  options: RequestOptions;
  actions: string[];
  skipValidation?: boolean;
}

export class APISuccessOrFailedAction<T = any> implements Action {
  constructor(public type, public apiAction: ICFAction | PaginatedAction, public response?: T) { }
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

export class WrapperRequestActionSuccess<T = any> extends RequestSuccessAction implements ISuccessRequestAction {
  constructor(
    public response: NormalizedResponse<T>,
    public apiAction: IRequestAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch',
    public totalResults?: number,
    public totalPages?: number
  ) {
    super();
  }
}
export interface InternalEndpointError {
  endpointIds: string[];
  eventCode?: string;
  message?: string;
  url: string;
  error?;
}
export class WrapperRequestActionFailed extends RequestFailedAction implements IFailedRequestAction {
  constructor(
    public message: string,
    public apiAction: IRequestAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch',
    public internalEndpointError?: InternalEndpointError
  ) {
    super();
  }
}


