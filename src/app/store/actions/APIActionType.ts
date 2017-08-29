import { Action } from '@ngrx/store';

function strEnum<T extends string>(o: Array<T>): {[K in T]: K} {
  return o.reduce((res, key) => {
    res[key] = key;
    return res;
  }, Object.create(null));
}

export const ApiActionTypes = {
    API_REQUEST: 'API_REQUEST',
    API_REQUEST_START: 'API_REQUEST_START',
    API_REQUEST_SUCCESS: 'API_REQUEST_SUCCESS',
    API_REQUEST_FAILED: 'API_REQUEST_FAILED',
};

export class APIAction implements Action {
    actions: string[];
    url: string;
    requestType: string;
    payload?: object;
    type: string = ApiActionTypes.API_REQUEST;
}
