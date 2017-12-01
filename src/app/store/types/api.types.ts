import { stringDistance } from 'codelyzer/util/utils';
import { RequestState } from '../reducers/api-request-reducer/types';
import { Schema } from 'normalizr';
import { RequestOptions } from '@angular/http';
import { Action } from '@ngrx/store';
import { ApiActionTypes } from '../actions/request.actions';
import { PaginatedAction } from './pagination.types';
import { CfEntitiesState } from './entity.types';

export interface EntityInfo {
  entityRequestInfo: RequestState;
  entity: any;
}

export interface APIResource {
  metadata: APIResourceMetadata;
  entity: any;
}

export interface APIResourceMetadata {
  created_at: string;
  guid: string;
  update_at: string;
  url: string;
}

export interface APIEntities<T> {
  [key: string]: T;
}

export interface NormalizedResponse {
  entities: APIEntities<any>;
  result: any[];
}

export type ActionMergeFunction = (oldEntities: CfEntitiesState, newEntities: NormalizedResponseEntities)
  => NormalizedResponseEntities;
export interface NormalizedResponseEntities {
  [key: string]: string;
}
