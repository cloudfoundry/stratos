import {
    LOGIN_FAILED,
    LOGIN_SUCCESS,
    LoginFailed,
    LoginSuccess,
    SESSION_INVALID,
    SESSION_VERIFIED,
    SessionData,
    VERIFY_SESSION,
    RESET_AUTH
} from './../actions/auth.actions';
import { Login, LOGIN } from '../actions/auth.actions';
import { APIAction, ApiActionTypes } from './../actions/api.actions';
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

const defaultState = {
    loggedIn: false,
    loggingIn: false,
    user: null,
    error: false,
    errorMessage: '',
    sessionData: null,
    verifying: false
};

export function authReducer(state: AuthState = defaultState, action) {
    switch (action.type) {
        case LOGIN:
            return { ...state, loggingIn: true, loggedIn: false, error: false };
        case LOGIN_SUCCESS:
            const loginSuccess = action as LoginSuccess;
            return { ...state, loggingIn: false, loggedIn: true, error: false, uaaError: false, errorMessage: '' };
        case LOGIN_FAILED:
            const loginFailed = action as LoginFailed;
            return { ...state, error: true, errorMessage: loginFailed.message, loggingIn: false, loggedIn: false };
        case VERIFY_SESSION:
            return { ...state, error: false, errorMessage: '', verifying: true };
        case SESSION_VERIFIED:
            return {
                ...state,
                error: false,
                errorMessage: '',
                sessionData: {
                    ...action.sessionData,
                    valid: true,
                    uaaError: false
                },
                verifying: false
            };
        case SESSION_INVALID:
            return { ...state, sessionData: { valid: false, uaaError: action.uaaError }, verifying: false };
        case RESET_AUTH:
            return defaultState;
        default:
            return state;
    }
}
