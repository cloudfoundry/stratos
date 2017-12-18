import { RequestAction } from '../types/request.types';
import { RequestOptions } from '@angular/http';
import { Schema, schema } from 'normalizr';
import { Action, createSelector } from '@ngrx/store';

import { AppState } from '../app-state';
import { PaginatedAction } from '../types/pagination.types';

export const GET_CNSIS = '[CNSIS] Get all';
export const GET_CNSIS_LOGIN = '[CNSIS] Get all at login';
export const GET_CNSIS_SUCCESS = '[CNSIS] Get all success';
export const GET_CNSIS_FAILED = '[CNSIS] Get all failed';

export const CONNECT_CNSIS = '[CNSIS] Connect';
export const CONNECT_CNSIS_SUCCESS = '[CNSIS] Connect succeed';
export const CONNECT_CNSIS_FAILED = '[CNSIS] Connect failed';

export const DISCONNECT_CNSIS = '[CNSIS] Disconnect';
export const DISCONNECT_CNSIS_SUCCESS = '[CNSIS] Disconnect succeed';
export const DISCONNECT_CNSIS_FAILED = '[CNSIS] Disconnect failed';

export const UNREGISTER_CNSIS = '[CNSIS] Unregister';

export const EndpointSchema = new schema.Entity('endpoint', {}, {
  idAttribute: 'guid'
});

export class GetAllCNSIS implements PaginatedAction {
  constructor(public login = false) { }
  entityKey = EndpointSchema.key;
  paginationKey = 'endpoint-list';
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

export class ConnectCnis implements Action {
  constructor(
    public guid: string,
    public username: string,
    public password: string,
  ) { }
  type = CONNECT_CNSIS;
}

export class DisconnectCnis implements Action {
  constructor(
    public guid: string
  ) { }
  type = DISCONNECT_CNSIS;
}

export class UnregisterCnis implements Action {
  constructor(
    public guid: string
  ) { }
  type = UNREGISTER_CNSIS;
}
