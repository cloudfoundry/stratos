import { Store } from '@ngrx/store';
import { AppState } from '../src/app-state';
import { StratosBaseCatalogueEntity } from '../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { ApiRequestTypes } from '../src/reducers/api-request-reducer/request-helpers';
import { NormalizedResponse } from '../src/types/api.types';
import { EntityRequestAction } from '../src/types/request.types';
import { Observable } from 'rxjs';
import { HttpClient, HttpRequest } from '@angular/common/http';

export type StartEntityRequestHandler = (
  store: Store<AppState>,
  catalogueEntity: StratosBaseCatalogueEntity,
  requestType: ApiRequestTypes,
  action: EntityRequestAction
) => void;

export type SucceedOrFailEntityRequestHandler = (
  store: Store<any>,
  catalogueEntity: StratosBaseCatalogueEntity,
  requestType: ApiRequestTypes
) => void;

export type EndEntityRequestPipe<
  T = any,
  > = (
    store: Store<T>,
    requestType: ApiRequestTypes,
    action: EntityRequestAction,
    data: NormalizedResponse<T>
  ) => void;

export type MakeEntityRequestPipe<
  T = any,
  > = (
    httpClient: HttpClient,
    request: HttpRequest<any>
  ) => Observable<T>;

export type BuildEntityRequestPipe = (
  requestType: ApiRequestTypes,
  action: EntityRequestAction,
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

export declare function EntityRequestPipeline(
  startPipe: StartEntityRequestHandler,
  requestPipeline: MakeEntityRequestPipe,
  normalizePipeline: NormalizeEntityRequestResponsePipe,
  endPipeline: EndEntityRequestPipe
): void;
export declare function EntityRequestPipeline(
  startPipe: StartEntityRequestHandler,
  requestPipeline: MakeEntityRequestPipe,
  normalizePipeline: NormalizeEntityRequestResponsePipe,
  normalizePipeline1: NormalizeEntityRequestResponsePipe,
  endPipeline: EndEntityRequestPipe
): void;
