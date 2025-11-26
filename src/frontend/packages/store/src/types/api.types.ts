import type { IRequestEntityTypeState } from '../app-state';
import type { RequestInfoState } from '../reducers/api-request-reducer/types';
import type { BaseEntityValues } from './entity.types';

export interface EntityInfo<T = unknown> {
  entityRequestInfo: RequestInfoState;
  entity: T;
}

export interface APIResource<T = unknown> {
  metadata: APIResourceMetadata;
  entity: T;
}

export function instanceOfAPIResource(object: unknown): boolean {
  return object && typeof object === 'object' && 'metadata' in object && 'entity' in object;
}

export interface APIResourceMetadata {
  created_at: string;
  guid: string;
  updated_at: string;
  url: string;
}

/**
 * Create a partial APIResourceMetadata object with optional fields
 */
export function createPartialMetadata(metadata?: Partial<APIResourceMetadata>): Partial<APIResourceMetadata> {
  return {
    created_at: metadata?.created_at,
    guid: metadata?.guid,
    updated_at: metadata?.updated_at,
    url: metadata?.url
  };
}

/**
 * Create an empty APIResource with partial metadata
 */
export function createPartialAPIResource<T>(entity?: Partial<T>, metadata?: Partial<APIResourceMetadata>): Partial<APIResource<T>> {
  return {
    entity: entity as T,
    metadata: createPartialMetadata(metadata) as APIResourceMetadata
  };
}

export interface NormalizedResponse<T = unknown> {
  entities: IRequestEntityTypeState<{ [entityKey: string]: T }>;
  result: string[];
  totalPages?: number;
  totalResults?: number;
}

export interface NormalizedResponseEntities {
  [key: string]: unknown;
}

export type ActionMergeFunction = (oldEntities: BaseEntityValues, newEntities: NormalizedResponseEntities)
  => NormalizedResponseEntities;
