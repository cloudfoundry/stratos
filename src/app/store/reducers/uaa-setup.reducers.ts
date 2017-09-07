import { SETUP_UAA, SETUP_UAA_FAILED, SETUP_UAA_SCOPE, SETUP_UAA_SUCCESS } from './../actions/setup.actions';
import { Action } from '@ngrx/store';

export interface UAASetupState {
    payload: {
        scope: string[],
        exp: number,
        user_id: string,
        user_name: string
    } | null;
    setup: boolean;
    error: boolean;
    message: string;
    settingUp: boolean;
}

const defaultState = {
    payload: null,
    setup: false,
    error: false,
    message: '',
    settingUp: false
};

export function uaaSetupReducer(state: UAASetupState = defaultState, action) {
    switch (action.type) {
        case SETUP_UAA_SCOPE:
        case SETUP_UAA:
            return {
                ...state,
                settingUp: true,
                setup: false,
                message: 'Setting up UAA',
                error: false
            };
        case SETUP_UAA_SUCCESS:
            return {
                ...state,
                settingUp: false,
                setup: true,
                message: '',
                error: false,
                payload: { ...state.payload, ...action.payload }
            };
        case SETUP_UAA_FAILED:
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
