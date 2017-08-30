import { LOGIN_SUCCESS, LoginSuccess, LoginFailed } from './../actions/auth.actions';
import { Login, LOGIN } from '../actions/auth.actions';
import { APIAction, ApiActionTypes } from './../actions/APIActionType';
import { Action } from '@ngrx/store';

export function authReducer(state = {
    loggedIn: false,
    loggingIn: false,
    user: null,
    error: false,
    errorMessage: ''
}, action) {
    switch (action.type) {
        case LOGIN:
            state.loggedIn = false;
            state.loggingIn = true;
            return { ...state, loggingIn: true, loggedIn: false, error: false};
        case LOGIN_SUCCESS:
            const loginSuccess = action as LoginSuccess;
            return { ...state, user: loginSuccess.user, loggingIn: false, loggedIn: true};
        case LOGIN_SUCCESS:
            const loginFailed = action as LoginFailed;
            return { ...state, error: true, errorMessage: loginFailed.message, loggingIn: false, loggedIn: true};
    }
}
