import { SETUP_UAA, SETUP_UAA_FAILED, SETUP_UAA_SUCCESS } from './../actions/setup.actions';
import { Action } from '@ngrx/store';

export interface UAASetupState {
    payload: object;
    setup: boolean;
    error: boolean;
    message: string;
    settingUp: boolean;
}

export function uaaSetupReducer(state: UAASetupState = {
    payload: {},
    setup: false,
    error: false,
    message: '',
    settingUp: false
}, action) {
    switch (action.type) {
        case SETUP_UAA:
            return {
                ...state,
                settingUp: true,
                setup: false,
                message: 'Setting up UAA',
                error: false,
                payload: {}
            };
        case SETUP_UAA_SUCCESS:
            return {
                ...state,
                settingUp: false,
                setup: true,
                message: '',
                error: false,
                payload: action.payload
            };
        case SETUP_UAA_FAILED:
            return {
                ...state,
                settingUp: false,
                setup: false,
                message: action.message,
                error: true,
                payload: {}
            };
        default:
            return state;

    }
}
