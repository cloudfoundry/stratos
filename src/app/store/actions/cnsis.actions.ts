import { Action, createSelector } from '@ngrx/store';

import { AppState } from '../app-state';

export const GET_CNSIS = '[CNSIS] Get all';
export const GET_CNSIS_LOGIN = '[CNSIS] Get all at login';
export const GET_CNSIS_SUCCESS = '[CNSIS] Get all success';
export const GET_CNSIS_FAILED = '[CNSIS] Get all failed';

export class GetAllCNSIS implements Action {
  constructor(public login = false) { }
  type = GET_CNSIS;
}

export class GetAllCNSISSuccess implements Action {
  constructor(public payload: {}, public login = false) { }
  type = GET_CNSIS_SUCCESS;
}

export class GetAllCNSISFailed implements Action {
  constructor(public message: string, public login = false) { }
  type = GET_CNSIS_FAILED;
}
