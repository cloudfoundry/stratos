import { SETUP_SUCCESS } from './../actions/setup.actions';
import { UAASetupState } from '../types/uaa-setup.types';
import { SETUP_GET_SCOPES, SETUP_SAVE_CONFIG, SETUP_FAILED } from '../actions/setup.actions';

const defaultState = {
  payload: null,
  setup: false,
  error: false,
  message: '',
  settingUp: false
};

export function uaaSetupReducer(state: UAASetupState = defaultState, action) {
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
        payload: { ...state.payload, ...action.payload }
      };
    case SETUP_FAILED:
      return {
        ...state,
        settingUp: false,
        setup: false,
        message: action.message,
        error: true
      };
    default:
      return state;

  }
}
