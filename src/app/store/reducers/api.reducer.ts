import { APIAction, ApiActionTypes } from './../actions/APIActionType';
import { Action } from '@ngrx/store';

export interface APIState {
    payload: object;
    loading: boolean;
}

export function apiReducer(state: APIState = {
    payload: {},
    loading: false
}, action: APIAction) {
    if (
        action.type === ApiActionTypes.API_REQUEST_START ||
        action.apiRequestType === ApiActionTypes.API_REQUEST_SUCCESS ||
        action.apiRequestType === ApiActionTypes.API_REQUEST_FAILED
    ) {
        const apiAction = action as APIAction;
        const { payload, loading } = apiAction;
        console.log(state);
        return { ...state, payload, loading };
    } else {
        return state;
    }
}
