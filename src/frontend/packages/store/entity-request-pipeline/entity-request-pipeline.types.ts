import { Store, Action } from '@ngrx/store';
import { AppState } from '../src/app-state';
import { Observable } from 'rxjs';
import { StratosBaseCatalogueEntity } from '../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { ApiRequestTypes } from '../src/reducers/api-request-reducer/request-helpers';
import { NormalizedResponse } from '../src/types/api.types';
export type StartEntityRequestPipe<
  Y extends Action,
  > = (action: Y) => void;

export type EndEntityRequestPipe<
  T extends object,
  Y extends Action,
  > = (response: T | T[], action: Y) => NormalizedResponse<T>;

export type EntityRequestPipe<A extends [], T> = (...args: A) => T | Observable<T>;

export type EntityRequestPipelineFactory<T extends AppState, Y extends Action> = (
  store: Store<T>,
  catalogueEntity: StratosBaseCatalogueEntity,
  requestType: ApiRequestTypes
) => EntityRequestPipe<T, Y, []>;
