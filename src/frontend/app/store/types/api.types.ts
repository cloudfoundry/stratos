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

export interface CFResponse<T = any> {
  total_results: number;
  total_pages: number;
  prev_url: string;
  next_url: string;
  resources: APIResource<T>[];
}
