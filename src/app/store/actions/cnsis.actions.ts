import { AppState } from '../app-state';
import { Action, createSelector } from '@ngrx/store';

export const GET_CNSIS = '[CNSIS] Get all';
export const GET_CNSIS_LOGIN = '[CNSIS] Get all at login';
export const GET_CNSIS_SUCCESS = '[CNSIS] Get all success';
export const GET_CNSIS_FAILED = '[CNSIS] Get all failed';

export interface UaaSetupData {
    console_client: string;
    password: string;
    skip_ssl_validation: boolean;
    uaa_endpoint: string;
    username: string;
    console_client_secret?: string;
}

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

export const cnsisSelector = (state: AppState) => state.cnsis;

export const cnsisEntitySelector = createSelector(
    cnsisSelector,
    state => state.entities
);

