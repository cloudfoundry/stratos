import { Store, Action } from '@ngrx/store';
import { AppState } from '../app-state';
import { StratosBaseCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { ApiRequestTypes } from '../reducers/api-request-reducer/request-helpers';
import { NormalizedResponse } from '../types/api.types';
import { EntityRequestAction } from '../types/request.types';
import { Observable } from 'rxjs';
import { HttpClient, HttpRequest } from '@angular/common/http';
import { PipelineConfig } from './entity-request-pipeline';
import { JetStreamErrorResponse } from '../../../core/src/jetstream.helpers';
import { RequestOptions } from '@angular/http';
export type ActionDispatcher = (action: Action) => void;
export interface JetstreamResponse<T = any> {
  [endpointGuid: string]: T | JetStreamErrorResponse;
}

export type StartEntityRequestHandler = (
  actionDispatcher: ActionDispatcher,
  catalogueEntity: StratosBaseCatalogueEntity,
  requestType: ApiRequestTypes,
  action: EntityRequestAction
) => void;

export type SucceedOrFailEntityRequestHandler = (
  actionDispatcher: ActionDispatcher,
  catalogueEntity: StratosBaseCatalogueEntity,
  requestType: ApiRequestTypes
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
    httpClient: HttpClient,
    request: HttpRequest<any> | Observable<HttpRequest<any>>
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

export type EntityRequestPipeline = (
  store: Store<AppState>,
  httpClient: HttpClient,
  config: PipelineConfig
) => Observable<PipelineResult>;
