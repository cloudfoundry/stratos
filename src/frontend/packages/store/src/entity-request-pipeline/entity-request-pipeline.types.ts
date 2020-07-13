import { HttpClient, HttpRequest } from '@angular/common/http';
import { Action, Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AppState, GeneralEntityAppState, InternalAppState } from '../app-state';
import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
} from '../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { JetStreamErrorResponse } from '../jetstream';
import { ApiRequestTypes } from '../reducers/api-request-reducer/request-helpers';
import { EntityInfo, NormalizedResponse } from '../types/api.types';
import { EndpointUser } from '../types/endpoint.types';
import { PaginatedAction, PaginationEntityState } from '../types/pagination.types';
import { EntityRequestAction } from '../types/request.types';
import { JetstreamError } from './entity-request-base-handlers/handle-multi-endpoints.pipe';
import { PipelineHttpClient } from './pipline-http-client.service';

export type ActionDispatcher<T extends Action = Action> = (action: T) => void;
export interface JetstreamResponse<T = any> {
  [endpointGuid: string]: T;
}

export type StartEntityRequestHandler = (
  actionDispatcher: ActionDispatcher,
  catalogEntity: StratosBaseCatalogEntity,
  requestType: ApiRequestTypes,
  action: EntityRequestAction | PaginatedAction
) => void;

export type SucceedOrFailEntityRequestHandler = (
  actionDispatcher: ActionDispatcher,
  catalogEntity: StratosBaseCatalogEntity,
  requestType: ApiRequestTypes,
  action: EntityRequestAction,
  response: PipelineResult,
  recursivelyDeleting: boolean
) => void;

export type EndEntityRequestPipe<
  T = any,
  > = (
    actionDispatcher: ActionDispatcher,
    requestType: ApiRequestTypes,
    action: EntityRequestAction,
    data: NormalizedResponse<T>
  ) => void;

export type MakeEntityRequestPipe<
  T = any,
  > = (
    httpClient: PipelineHttpClient,
    request: HttpRequest<any> | Observable<HttpRequest<any>>,
    endpointConfig: StratosCatalogEndpointEntity,
    endpointGuids: string | string[],
    externalRequest?: boolean
  ) => Observable<JetstreamResponse<T>>;

export type BuildEntityRequestPipe = (
  requestType: ApiRequestTypes,
  requestOptions: HttpRequest<any>,
  catalogEntity: StratosBaseCatalogEntity,
  store: Store<any>,
) => HttpRequest<any> | Observable<HttpRequest<any>>;

export type NormalizeEntityRequestResponsePipe<
  T = any,
  > = (
    catalogEntity: StratosBaseCatalogEntity,
  ) => NormalizedResponse<T>;

export type EntityRequestHandler = (...args: any[]) => void;
export type EntityRequestPipe = (...args: any[]) => any;

export interface PipelineResult {
  success: boolean;
  errorMessage?: string;
  response?: NormalizedResponse;
  totalResults?: number;
  totalPages?: number;
}

export type EntityRequestPipeline<> = (
  store: Store<AppState>,
  httpClient: PipelineHttpClient,
  config: BasePipelineConfig
) => Observable<PipelineResult>;


export type SuccessfulApiResponseDataMapper<O = any, I = O> = (
  response: I,
  endpointGuid: string,
  guid: string,
  entityType: string,
  endpointType: string,
  action: EntityRequestAction
) => O;

export type PreApiRequest = (
  request: HttpRequest<any>,
  action: EntityRequestAction,
  catalogEntity: StratosBaseCatalogEntity
) => HttpRequest<any> | Observable<HttpRequest<any>>;

export type PrePaginationApiRequest = (
  request: HttpRequest<any>,
  action: PaginatedAction,
  catalogEntity: StratosBaseCatalogEntity,
  appState: InternalAppState
) => HttpRequest<any> | Observable<HttpRequest<any>>;

export type ApiErrorMessageHandler = (
  errors: JetstreamError[]
) => string;

export interface BasePipelineConfig<T extends AppState = InternalAppState, Y extends Action = Action> {
  requestType: ApiRequestTypes;
  catalogEntity: StratosBaseCatalogEntity;
  action: Y;
  appState: T;
}
export interface PagedJetstreamResponse<T = any> {
  [endpointId: string]: T[] | JetStreamErrorResponse[];
}

export type EntityInfoHandler = (action: EntityRequestAction, actionDispatcher: ActionDispatcher) => (entityInfo: EntityInfo) => void;

export type EntitiesInfoHandler = (
  action: PaginatedAction | PaginatedAction[],
  actionDispatcher: ActionDispatcher,
) => (
    state: PaginationEntityState,
  ) => void;


export type EntityFetch<T = any> = (entity: T) => void;
export type EntityFetchHandler<T = any> = (store: Store<GeneralEntityAppState>, action: EntityRequestAction) => EntityFetch<T>;
export type EntitiesFetchHandler = (store: Store<GeneralEntityAppState>, actions: PaginatedAction[]) => () => void;

export interface EntityUserRolesEndpoint {
  user?: EndpointUser;
  guid?: string;
}

export type EntityUserRolesFetch = (
  endpoints: string[] | EntityUserRolesEndpoint[],
  store: Store<AppState>,
  httpClient: HttpClient
) => Observable<boolean>;

export type EntityUserRolesReducer<T = any> = (state: T, action: Action) => T;