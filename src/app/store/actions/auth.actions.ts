import { Action } from '@ngrx/store';
import { ApiActionTypes } from './api.actions';
import { SessionData } from '../types/auth.types';

export const LOGIN = '[Auth] Login';
export const LOGIN_SUCCESS = '[Auth] Login success';
export const LOGIN_FAILED = '[Auth] Login failed';

export const VERIFY_SESSION = '[Auth] Verify session';
export const SESSION_VERIFIED = '[Auth] Session verified';
export const SESSION_INVALID = '[Auth] Session invalid';

export const GET_INFO = '[Auth] Get session info';

export const RESET_AUTH = '[Auth] Reset auth data';

export class Login implements Action {
  constructor(public username: string, public password: string) { }
  type = LOGIN;
}

export class LoginSuccess implements Action {
  type = LOGIN_SUCCESS;
}

export class LoginFailed implements Action {
  constructor(public message: string) { }
  type = LOGIN_FAILED;
}

export class VerifySession implements Action {
  constructor(public login = true, public updateCNSIs = true) { }
  type = VERIFY_SESSION;
}

export class VerifiedSession implements Action {
  constructor(private sessionData: SessionData, public updateCNSIs = true) { }
  type = SESSION_VERIFIED;
}

export class InvalidSession implements Action {
  constructor(public uaaError: boolean = false) { }
  type = SESSION_INVALID;
}

export class ResetAuth implements Action {
  type = RESET_AUTH;
}

export class GetInfo implements Action {
  type = GET_INFO;
}


