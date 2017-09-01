import {
    LOGIN_FAILED,
    LOGIN_SUCCESS,
    LoginFailed,
    LoginSuccess,
    SESSION_INVALID,
    SESSION_VERIFIED,
    SessionData,
    VERIFY_SESSION,
} from './../actions/auth.actions';
import { Login, LOGIN } from '../actions/auth.actions';
import { APIAction, ApiActionTypes } from './../actions/APIActionType';
import { Action } from '@ngrx/store';

export interface AuthState {
    loggedIn: boolean;
    loggingIn: boolean;
    user: object;
    error: boolean;
    errorMessage: string;
    sessionData: SessionData;
    verifying: boolean;
}

export function authReducer(state: AuthState = {
    loggedIn: false,
    loggingIn: false,
    user: null,
    error: false,
    errorMessage: '',
    sessionData: null,
    verifying: false
}, action) {
    switch (action.type) {
        case LOGIN:
            return { ...state, loggingIn: true, loggedIn: false, error: false };
        case LOGIN_SUCCESS:
            const loginSuccess = action as LoginSuccess;
            return { ...state, loggingIn: false, loggedIn: true };
        case LOGIN_FAILED:
            const loginFailed = action as LoginFailed;
            return { ...state, error: true, errorMessage: loginFailed.message, loggingIn: false, loggedIn: false };
        case VERIFY_SESSION:
            return { ...state, verifying: true };
        case SESSION_VERIFIED:
            return { ...state, sessionData: { ...action.sessionData, valid: true }, verifying: false };
        case SESSION_INVALID:
            return { ...state, sessionData: { valid: false }, verifying: false };
        default:
            return state;
    }
}
