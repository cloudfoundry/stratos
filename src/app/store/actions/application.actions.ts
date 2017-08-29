import * as url from 'url';
import { ApiActionTypes, APIAction } from './APIActionType';
import { Injectable } from '@angular/core';

export const GET_ALL = '[Application] Get all';
export const GET_ALL_SUCCESS = '[Application] Get all success';
export const GET_ALL_FAILED = '[Application] Get all failed';

export class GetAll implements APIAction {
        actions = [
            GET_ALL,
            GET_ALL_SUCCESS,
            GET_ALL_FAILED
        ];
        url = 'application';
        requestType = 'get';
        type = ApiActionTypes.API_REQUEST;
}
