import { Store, Action } from '@ngrx/store';
import { AppState, InternalAppState } from '../app-state';
import { StratosBaseCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { ApiRequestTypes } from '../reducers/api-request-reducer/request-helpers';
import { NormalizedResponse } from '../types/api.types';
import { EntityRequestAction } from '../types/request.types';
import { Observable } from 'rxjs';
import { HttpRequest } from '@angular/common/http';
import { JetStreamErrorResponse } from '../../../core/src/jetstream.helpers';
import { RequestOptions } from '@angular/http';
import { PipelineHttpClient } from './pipline-http-client.service';
import { PaginatedAction } from '../types/pagination.types';
export type ActionDispatcher<T extends Action = Action> = (action: T) => void;
export interface JetstreamResponse<T = any> {
  [endpointGuid: string]: T;
}

export type StartEntityRequestHandler = (
  actionDispatcher: ActionDispatcher,
  catalogueEntity: StratosBaseCatalogueEntity,
  requestType: ApiRequestTypes,
  action: EntityRequestAction | PaginatedAction
) => void;

export type SucceedOrFailEntityRequestHandler = (
  actionDispatcher: ActionDispatcher,
  catalogueEntity: StratosBaseCatalogueEntity,
  requestType: ApiRequestTypes,
  action: EntityRequestAction,
  response: NormalizedResponse,
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
    endpointType: string,
    endpointGuids: string | string[]
  ) => Observable<JetstreamResponse<T>>;

export type BuildEntityRequestPipe = (
  requestType: ApiRequestTypes,
  requestOptions: RequestOptions | HttpRequest<any>,
  catalogueEntity: StratosBaseCatalogueEntity,
  store: Store<any>,
) => HttpRequest<any> | Observable<HttpRequest<any>>;

export type NormalizeEntityRequestResponsePipe<
  T = any,
  > = (
    catalogueEntity: StratosBaseCatalogueEntity,
  ) => NormalizedResponse<T>;

export type EntityRequestHandler = (...args: any[]) => void;
export type EntityRequestPipe = (...args: any[]) => any;

export interface PipelineResult {
  success: boolean;
  errorMessage?: string;
  response?: NormalizedResponse;
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
  catalogueEntity: StratosBaseCatalogueEntity
) => HttpRequest<any> | Observable<HttpRequest<any>>;

export type PrePaginationApiRequest = (
  request: HttpRequest<any>,
  action: PaginatedAction,
  catalogueEntity: StratosBaseCatalogueEntity
) => HttpRequest<any> | Observable<HttpRequest<any>>;

export interface BasePipelineConfig<T extends AppState = InternalAppState, Y extends Action = Action> {
  requestType: ApiRequestTypes;
  catalogueEntity: StratosBaseCatalogueEntity;
  action: Y;
  appState: T;
}
export interface PagedJetstreamResponse<T = any> {
  [endpointId: string]: T[] | JetStreamErrorResponse;
}
