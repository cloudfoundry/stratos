import { IRequestDataState } from './entity.types';
import { IRequestEntityTypeState } from '../app-state';
import { stringDistance } from 'codelyzer/util/utils';
import { RequestInfoState } from '../reducers/api-request-reducer/types';
import { Schema } from 'normalizr';
import { RequestOptions } from '@angular/http';
import { Action } from '@ngrx/store';
import { ApiActionTypes } from '../actions/request.actions';
import { PaginatedAction } from './pagination.types';

export interface EntityInfo<T = any> {
  entityRequestInfo: RequestInfoState;
  entity: T;
}

export interface APIResource<T = any> {
  metadata: APIResourceMetadata;
  entity: T;
}
export function instanceOfAPIResource(object: any): boolean {
  return object && typeof object === 'object' && 'metadata' in object && 'entity' in object;
}

export interface APIResourceMetadata {
  created_at: string;
  guid: string;
  updated_at: string;
  url: string;
}

export interface NormalizedResponse {
  entities: IRequestEntityTypeState<any>;
  result: string[];
}

export type ActionMergeFunction = (oldEntities: IRequestDataState, newEntities: NormalizedResponseEntities)
  => NormalizedResponseEntities;
export interface NormalizedResponseEntities {
  [key: string]: string;
}
