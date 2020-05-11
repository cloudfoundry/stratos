import {
  LOGIN,
  LOGIN_FAILED,
  LOGIN_SUCCESS,
  LoginFailed,
  RESET_AUTH,
  SESSION_INVALID,
  SESSION_VERIFIED,
  VERIFY_SESSION,
} from '../actions/auth.actions';
import { RouterActions, RouterNav } from '../actions/router.actions';
import { GET_SYSTEM_INFO_SUCCESS } from '../actions/system.actions';
import { AuthOnlyAppState } from '../app-state';
import { SessionData } from '../types/auth.types';
import { RouterRedirect } from './routing.reducer';

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
  errorResponse: any;
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
  verifying: false,
};

export function authReducer(state: AuthState = defaultState, action): AuthState {
  switch (action.type) {
    case LOGIN:
      return { ...state, loggingIn: true, loggedIn: false, error: false };
    case LOGIN_SUCCESS:
      return { ...state, loggingIn: false, loggedIn: true, error: false, errorResponse: undefined };
    case LOGIN_FAILED:
      const loginFailed = action as LoginFailed;
      return { ...state, error: true, errorResponse: loginFailed.error, loggingIn: false, loggedIn: false };
    case VERIFY_SESSION:
      return { ...state, error: false, errorResponse: undefined, verifying: true };
    case SESSION_VERIFIED:
      return {
        ...state,
        error: false,
        errorResponse: '',
        sessionData: {
          ...action.sessionData,
          valid: true,
          uaaError: false,
          upgradeInProgress: false,
        },
        verifying: false
      };
    case SESSION_INVALID:
      return {
        ...state,
        sessionData: {
          valid: false, uaaError: action.uaaError, upgradeInProgress: action.upgradeInProgress,
          domainMismatch: action.domainMismatch, ssoOptions: action.ssoOptions, sessionExpiresOn: null,
          plugins: {
            demo: false
          },
          config: {}
        },
        verifying: false
      };
    case RouterActions.GO:
      const goToState: RouterNav = action;
      return {
        ...state,
        redirect: goToState.redirect || state.redirect
      };
    case RESET_AUTH:
      return defaultState;
    case GET_SYSTEM_INFO_SUCCESS:
      return {
        ...state,
        sessionData: {
          ...state.sessionData,
          endpoints: {
            ...action.payload.endpoints
          }
        },
      };
    default:
      return state;
  }
}

export function selectSessionData() {
  return (state: AuthOnlyAppState): SessionData => state.auth.sessionData;
}
