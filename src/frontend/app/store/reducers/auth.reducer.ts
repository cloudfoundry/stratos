import { InvalidSession, LOGIN } from '../actions/auth.actions';
import {
  LOGIN_FAILED,
  LOGIN_SUCCESS,
  LoginFailed,
  LoginSuccess,
  RESET_AUTH,
  SESSION_INVALID,
  SESSION_VERIFIED,
  VERIFY_SESSION,
} from './../actions/auth.actions';
import { SessionData } from '../types/auth.types';
import { RouterNav, RouterActions } from '../actions/router.actions';

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
  redirectPath?: string;
}

const defaultState: AuthState = {
  loggedIn: false,
  loggingIn: false,
  user: null,
  error: false,
  errorResponse: '',
  sessionData: null,
  verifying: false,
  redirectPath: null,
};

export function authReducer(state: AuthState = defaultState, action) {
  switch (action.type) {
    case LOGIN:
      return { ...state, loggingIn: true, loggedIn: false, error: false };
    case LOGIN_SUCCESS:
      const loginSuccess = action as LoginSuccess;
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
        errorMessage: '',
        sessionData: {
          ...action.sessionData,
          valid: true,
          uaaError: false
        },
        verifying: false
      };
    case SESSION_INVALID:
      const sessionInvalid: InvalidSession = action;
      return {
        ...state, sessionData: { valid: false, uaaError: action.uaaError },
        verifying: false
      };
    case RouterActions.GO:
      const goToState: RouterNav = action;
      return {
        ...state,
        redirectPath: goToState.redirectPath !== undefined ? goToState.redirectPath : state.redirectPath
      };
    case RESET_AUTH:
      return defaultState;
    default:
      return state;
  }
}

export function selectSessionData() {
  return (state) => state.auth.sessionData;
}
