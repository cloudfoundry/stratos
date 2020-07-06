import { HttpRequest } from '@angular/common/http';
import { Action } from '@ngrx/store';

import { ApiActionTypes, RequestTypes } from '../actions/request.actions';
import { BasePipelineRequestAction } from '../entity-catalog/action-orchestrator/action-orchestrator';
import { EntityCatalogEntityConfig } from '../entity-catalog/entity-catalog.types';
import { EntitySchema } from '../helpers/entity-schema';
import { ApiRequestTypes } from '../reducers/api-request-reducer/request-helpers';
import { NormalizedResponse } from './api.types';
import { PaginatedAction } from './pagination.types';

export interface SingleEntityAction {
  // For single entity requests
  guid?: string;
}

export interface RequestAction extends Action, BasePipelineRequestAction, SingleEntityAction {
  updatingKey?: string;
}

export type RequestActionEntity = EntitySchema | EntitySchema[];
export interface EntityRequestAction extends EntityCatalogEntityConfig, RequestAction {
  /**
   * This is just to maintain backwards compatibility while transitioning
   * to entity pipeline proper usage
   */
  actions?: string[];
  entity?: RequestActionEntity;
  /**
   * This is used for multiaction lists where the deleted entity
   * is going to be part of another entities pagination section
   */
  proxyPaginationEntityConfig?: EntityCatalogEntityConfig;

  /**
   * For a delete action, clear the pagination section for the given keys.
   * if proxyPaginationEntityConfig isn't set, pagination sections for the entityKey will also be deleted.
   */
  clearPaginationEntityKeys?: string[];
  endpointGuid?: string;
  updatingKey?: string;
  /**
   * For single entity requests
   */
  guid?: string;
  /**
   * For delete requests we clear the pagination sections (include all pages) of all list matching the same entity type. In some cases,
   * like local lists, we want to immediately remove that entry instead of clearing the table and refetching all data. This flag allows that
   */
  removeEntityOnDelete?: boolean;
  options?: HttpRequest<any>;
}

export interface IUpdateRequestAction {
  type: string;
  apiAction: EntityRequestAction | PaginatedAction;
  busy: boolean;
  error: string;
}

export interface IStartRequestAction {
  apiAction: EntityRequestAction | PaginatedAction;
  requestType: ApiRequestTypes;
}

export interface ISuccessRequestAction {
  type: string;
  response: NormalizedResponse;
  apiAction: EntityRequestAction | PaginatedAction;
  requestType: ApiRequestTypes;
  totalResults?: number;
}

export interface IFailedRequestAction {
  type: string;
  message: string;
  apiAction: EntityRequestAction | PaginatedAction;
  requestType: ApiRequestTypes;
  response?: any;
}

export abstract class StartAction implements Action {
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
    public apiAction: EntityRequestAction,
    public busy: boolean,
    public error: string,
  ) {
    super();
  }
}

export interface ICFAction extends EntityRequestAction {
  options: HttpRequest<any>;
  actions: string[];
  skipValidation?: boolean;
  validate?: boolean;
}

export class APISuccessOrFailedAction<T = any> implements Action {
  constructor(public type: string, public apiAction: EntityRequestAction | PaginatedAction, public response?: T) { }
}

export class StartRequestAction extends RequestAction {
  constructor(
    public apiAction: EntityRequestAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch'
  ) {
    super();
  }
}

export class WrapperRequestActionSuccess<T = any> extends RequestSuccessAction implements ISuccessRequestAction {
  constructor(
    public response: NormalizedResponse<T>,
    public apiAction: EntityRequestAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch',
    public totalResults?: number,
    public totalPages?: number,
    public updatingMessage?: string
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
    public apiAction: EntityRequestAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch',
    public internalEndpointError?: InternalEndpointError,
    public response?: any
  ) {
    super();
  }
}


