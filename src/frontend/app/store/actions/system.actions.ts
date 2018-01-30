import { SystemInfo } from './../types/system.types';
import { Action } from '@ngrx/store';
export const GET_SYSTEM_INFO = '[System] Get info';
export const GET_SYSTEM_INFO_SUCCESS = '[System] Get info success';
export const GET_SYSTEM_INFO_FAILED = '[System] Get info failed';

export class GetSystemInfo implements Action {
    type = GET_SYSTEM_INFO;
}

export class GetSystemSuccess implements Action {
    constructor(public payload: SystemInfo) { }
    type = GET_SYSTEM_INFO_SUCCESS;
}

export class GetSystemFailed implements Action {
    type = GET_SYSTEM_INFO_FAILED;
}

