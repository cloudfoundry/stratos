import { IRequestEntityTypeState } from '../app-state';
import { RequestInfoState } from '../reducers/api-request-reducer/types';
import { BaseEntityValues } from './entity.types';

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

export interface NormalizedResponse<T = any> {
  entities: IRequestEntityTypeState<{ [entityKey: string]: T }>;
  result: string[];
}

export type ActionMergeFunction = (oldEntities: BaseEntityValues, newEntities: NormalizedResponseEntities)
  => NormalizedResponseEntities;

export interface NormalizedResponseEntities {
  [key: string]: string;
}
