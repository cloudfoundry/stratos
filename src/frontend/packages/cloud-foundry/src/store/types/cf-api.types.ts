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

export interface CFResponse<T = any> extends PaginationResponse<APIResource<T>> {
}
