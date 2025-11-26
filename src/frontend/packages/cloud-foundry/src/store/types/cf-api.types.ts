import type { APIResource } from '../../../../store/src/types/api.types';


export function createEmptyCfResponse<T = unknown>(): CFResponse<T> {
  return {
    total_results: 0,
    total_pages: 0,
    prev_url: '',
    next_url: '',
    resources: [] as APIResource<T>[]
  };
}

export interface CfAPIResource<_T = unknown> extends APIResource {
  entity: {
    [entityKey: string]: unknown,
    cfGuid: string
  };
}

export interface PaginationResponse<T = unknown> {
  total_results: number;
  total_pages: number;
  prev_url: string;
  next_url: string;
  resources: T[];
}

export interface CFResponse<T = unknown> extends PaginationResponse<APIResource<T>> {
}
