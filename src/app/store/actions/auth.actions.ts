import { Action } from '@ngrx/store';
import { ApiActionTypes, APIAction } from './APIActionType';

export const LOGIN = '[Auth] Login';
export const LOGIN_SUCCESS = '[Auth] Login success';
export const LOGIN_FAILED = '[Auth] Login failed';

export class Login implements Action {
    constructor(public username: string, public password: string) {}
    type = LOGIN;
}

export class LoginSuccess implements Action {
    constructor(public user: object) {}
    type = LOGIN_SUCCESS;
}

export class LoginFailed implements Action {
    constructor(public message: string) {}
    type = LOGIN_FAILED;
}

