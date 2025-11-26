import type { Action } from '@ngrx/store';

import { SETUP_SUCCESS, type SetupSuccess, type SetupFailed } from './../actions/setup.actions';
import type { UAASetupState } from '../types/uaa-setup.types';
import { SETUP_GET_SCOPES, SETUP_SAVE_CONFIG, SETUP_FAILED } from '../actions/setup.actions';

type UAASetupAction = Action | SetupSuccess | SetupFailed;

const defaultState: UAASetupState = {
  payload: null,
  setup: false,
  error: false,
  message: '',
  settingUp: false
};

export function uaaSetupReducer(state: UAASetupState = defaultState, action: UAASetupAction): UAASetupState {
  switch (action.type) {
    case SETUP_GET_SCOPES:
    case SETUP_SAVE_CONFIG:
      return {
        ...state,
        settingUp: true,
        setup: false,
        message: 'Setting up UAA',
        error: false
      };
    case SETUP_SUCCESS:
      return {
        ...state,
        settingUp: false,
        setup: true,
        message: '',
        error: false,
        payload: { ...state.payload, ...(action as SetupSuccess).payload }
      };
    case SETUP_FAILED:
      return {
        ...state,
        settingUp: false,
        setup: false,
        message: (action as SetupFailed).message,
        error: true
      };
    default:
      return state;

  }
}
