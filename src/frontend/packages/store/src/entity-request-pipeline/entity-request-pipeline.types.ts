import type { HttpClient, HttpRequest } from '@angular/common/http';
import type { Action, Store } from '@ngrx/store';
import type { Observable } from 'rxjs';

import type { AppState, GeneralEntityAppState, InternalAppState } from '../app-state';
import type {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
} from '../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import type { JetStreamErrorResponse } from '../jetstream';
import type { ApiRequestTypes } from '../reducers/api-request-reducer/request-helpers';
import type { EntityInfo, NormalizedResponse } from '../types/api.types';
import type { EndpointUser } from '../types/endpoint.types';
import type { PaginatedAction, PaginationEntityState } from '../types/pagination.types';
import type { EntityRequestAction } from '../types/request.types';
import type { JetstreamError } from './entity-request-base-handlers/handle-multi-endpoints.pipe';
import type { PipelineHttpClient } from './pipline-http-client.service';

export type ActionDispatcher<T extends Action = Action> = (action: T) => void;
export interface JetstreamResponse<T = unknown> {
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
  T = unknown,
  > = (
    actionDispatcher: ActionDispatcher,
    requestType: ApiRequestTypes,
    action: EntityRequestAction,
    data: NormalizedResponse<T>
  ) => void;

export type MakeEntityRequestPipe<
  T = unknown,
  > = (
    httpClient: PipelineHttpClient,
    request: HttpRequest<unknown> | Observable<HttpRequest<unknown>>,
    endpointConfig: StratosCatalogEndpointEntity,
    endpointGuids: string | string[],
    externalRequest?: boolean
  ) => Observable<JetstreamResponse<T>>;

export type BuildEntityRequestPipe = (
  requestType: ApiRequestTypes,
  requestOptions: HttpRequest<unknown>,
  catalogEntity: StratosBaseCatalogEntity,
  store: Store<AppState>,
) => HttpRequest<unknown> | Observable<HttpRequest<unknown>>;

export type NormalizeEntityRequestResponsePipe<
  T = unknown,
  > = (
    catalogEntity: StratosBaseCatalogEntity,
  ) => NormalizedResponse<T>;

export type EntityRequestHandler = (...args: unknown[]) => void;
export type EntityRequestPipe = (...args: unknown[]) => unknown;

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


export type SuccessfulApiResponseDataMapper<O = unknown, I = O> = (
  response: I,
  endpointGuid: string,
  guid: string,
  entityType: string,
  endpointType: string,
  action: EntityRequestAction
) => O;

export type PreApiRequest = (
  request: HttpRequest<unknown>,
  action: EntityRequestAction,
  catalogEntity: StratosBaseCatalogEntity
) => HttpRequest<unknown> | Observable<HttpRequest<unknown>>;

export type PrePaginationApiRequest = (
  request: HttpRequest<unknown>,
  action: PaginatedAction,
  catalogEntity: StratosBaseCatalogEntity,
  appState: InternalAppState
) => HttpRequest<unknown> | Observable<HttpRequest<unknown>>;

export type ApiErrorMessageHandler = (
  errors: JetstreamError[]
) => string;

export interface BasePipelineConfig<T extends AppState = InternalAppState, Y extends Action = Action> {
  requestType: ApiRequestTypes;
  catalogEntity: StratosBaseCatalogEntity;
  action: Y;
  appState: T;
}
export interface PagedJetstreamResponse<T = unknown> {
  [endpointId: string]: T[] | JetStreamErrorResponse[];
}

export type EntityInfoHandler = (action: EntityRequestAction, actionDispatcher: ActionDispatcher) => (entityInfo: EntityInfo) => void;

export type EntitiesInfoHandler = (
  action: PaginatedAction | PaginatedAction[],
  actionDispatcher: ActionDispatcher,
) => (
    state: PaginationEntityState,
  ) => void;


export type EntityFetch<T = unknown> = (entity: T) => void;
export type EntityFetchHandler<T = unknown> = (store: Store<GeneralEntityAppState>, action: EntityRequestAction) => EntityFetch<T>;
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

export type EntityUserRolesReducer<T = unknown> = (state: T, action: Action) => T;
