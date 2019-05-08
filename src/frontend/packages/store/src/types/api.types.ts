import { IRequestEntityTypeState } from '../app-state';
import { RequestInfoState } from '../reducers/api-request-reducer/types';
import { IRequestDataState } from './entity.types';

export interface EntityInfo<T = any> {
  entityRequestInfo: RequestInfoState;
  entity: T;
}

export interface APIResource<T = any> {
  metadata: APIResourceMetadata;
  entity: T;
}

export interface CfAPIResource<T = any> extends APIResource {
  entity: {
    [entityKey: string]: any,
    cfGuid: string
  };
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

export interface NormalizedResponse<T = any> {
  entities: IRequestEntityTypeState<{ [entityKey: string]: T }>;
  result: string[];
}

export type ActionMergeFunction = (oldEntities: IRequestDataState, newEntities: NormalizedResponseEntities)
  => NormalizedResponseEntities;
export interface NormalizedResponseEntities {
  [key: string]: string;
}

export function createEmptyCfResponse<T = any>(): CFResponse<T> {
  return {
    total_results: 0,
    total_pages: 0,
    prev_url: '',
    next_url: '',
    resources: new Array<APIResource<T>>()
  };
}

export interface PaginationResponse<T = any> {
  total_results: number;
  total_pages: number;
  prev_url: string;
  next_url: string;
  resources: T[];
}

export interface CFResponse<T = any> extends PaginationResponse<APIResource<T>> {
}
