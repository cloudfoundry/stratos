import { Action } from '@ngrx/store';
import { ApiActionTypes, APIAction } from './APIActionType';

export const LOGIN = '[Auth] Login';
export const LOGIN_SUCCESS = '[Auth] Login success';
export const LOGIN_FAILED = '[Auth] Login failed';

export const VERIFY_SESSION = '[Auth] Verify session';
export const SESSION_VERIFIED = '[Auth] Session verified';
export const SESSION_INVALID = '[Auth] Session invalid';

export interface SessionData {
    endpoints?: {};
    user?: {
        admin: boolean,
        guid: string,
        name: string
    };
    version?: {
        proxy_version: string,
        database_version: number;
    };
    valid: boolean;
}

export class Login implements Action {
    constructor(public username: string, public password: string) {}
    type = LOGIN;
}

export class LoginSuccess implements Action {
    type = LOGIN_SUCCESS;
}

export class LoginFailed implements Action {
    constructor(public message: string) {}
    type = LOGIN_FAILED;
}

export class VerifySession implements Action {
    type = VERIFY_SESSION;
}

export class VerifiedSession implements Action {
    constructor(private sessionData: SessionData) {}
    type = SESSION_VERIFIED;
}

export class InvalidSession implements Action {
    type = SESSION_INVALID;
}


