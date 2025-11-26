import type { Action } from '@ngrx/store';

import {
  LOGIN,
  LOGIN_FAILED,
  LOGIN_SUCCESS,
  type LoginFailed,
  LOGOUT_FAILED,
  RESET_AUTH,
  SESSION_INVALID,
  SESSION_VERIFIED,
  VERIFY_SESSION,
  type VerifiedSession,
  type InvalidSession,
} from '../actions/auth.actions';
import { RouterActions, type RouterNav } from '../actions/router.actions';
import { GET_SYSTEM_INFO_SUCCESS, type GetSystemSuccess } from '../actions/system.actions';
import type { AuthOnlyAppState } from '../app-state';
import type { SessionData } from '../types/auth.types';
import type { LogoutFailed } from './../actions/auth.actions';
import type { RouterRedirect } from './routing.reducer';

export interface AuthUser {
  guid: string;
  name: string;
  admin: boolean;
}

export interface AuthState {
  loggedIn: boolean;
  loggingIn: boolean;
  user: AuthUser;
  error: boolean;
  errorResponse: string | unknown;
  sessionData: SessionData;
  verifying: boolean;
  redirect?: RouterRedirect;
  keepAlive?: boolean;
}

const defaultState: AuthState = {
  loggedIn: false,
  loggingIn: false,
  user: null,
  error: false,
  errorResponse: '',
  sessionData: null,
  verifying: true,  // Start as true to prevent race condition during app init
};

export function authReducer(state: AuthState = defaultState, action: Action): AuthState {
  switch (action.type) {
    case LOGIN:
      return { ...state, loggingIn: true, loggedIn: false, error: false };
    case LOGIN_SUCCESS:
      return { ...state, loggingIn: false, loggedIn: true, error: false, errorResponse: undefined };
    case LOGIN_FAILED: {
      const loginFailed = action as LoginFailed;
      return { ...state, error: true, errorResponse: loginFailed.error, loggingIn: false, loggedIn: false };
    }
    case LOGOUT_FAILED: {
      const logoutFailed = action as LogoutFailed;
      console.error(logoutFailed.error);
      return { ...state, loggingIn: false, loggedIn: true, error: true, errorResponse: logoutFailed.error };
    }
    case VERIFY_SESSION:
      return { ...state, error: false, errorResponse: undefined, verifying: true };
    case SESSION_VERIFIED: {
      const verifiedSession = action as VerifiedSession;
      return {
        ...state,
        error: false,
        errorResponse: '',
        sessionData: {
          ...verifiedSession.sessionData,
          valid: true,
          uaaError: false,
          upgradeInProgress: false,
        },
        verifying: false
      };
    }
    case SESSION_INVALID: {
      const invalidSession = action as InvalidSession;
      return {
        ...state,
        sessionData: {
          valid: false, uaaError: invalidSession.uaaError, upgradeInProgress: invalidSession.upgradeInProgress,
          domainMismatch: invalidSession.domainMismatch, ssoOptions: invalidSession.ssoOptions, sessionExpiresOn: null,
          plugins: {
            demo: false
          },
          config: {}
        },
        verifying: false
      };
    }
    case RouterActions.GO: {
      const goToState = action as RouterNav;
      return {
        ...state,
        redirect: goToState.redirect || state.redirect
      };
    }
    case RESET_AUTH:
      return defaultState;
    case GET_SYSTEM_INFO_SUCCESS: {
      const systemSuccess = action as GetSystemSuccess;
      return {
        ...state,
        sessionData: {
          ...state.sessionData,
          endpoints: {
            ...systemSuccess.payload.endpoints as unknown as typeof state.sessionData.endpoints
          }
        },
      };
    }
    default:
      return state;
  }
}

export function selectSessionData() {
  return (state: AuthOnlyAppState): SessionData => state.auth.sessionData;
}
