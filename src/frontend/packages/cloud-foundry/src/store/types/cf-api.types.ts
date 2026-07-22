import { APIResource } from '../../../../store/src/types/api.types';


export function createEmptyCfResponse<T = any>(): CFResponse<T> {
  return {
    total_results: 0,
    total_pages: 0,
    prev_url: '',
    next_url: '',
    resources: new Array<APIResource<T>>()
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentional: T is part of the public generic API surface (mirrors PaginationResponse<T>/CFResponse<T>); the entity body is an open string-keyed map so T is not referenced internally.
export interface CfAPIResource<T = any> extends APIResource {
  entity: {
    [entityKey: string]: any,
    cfGuid: string
  };
}

export interface PaginationResponse<T = any> {
  total_results: number;
  total_pages: number;
  prev_url: string;
  next_url: string;
  resources: T[];
}

export type CFResponse<T = any> = PaginationResponse<APIResource<T>>;
