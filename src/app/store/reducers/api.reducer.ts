import { APIAction, ApiActionTypes } from './../actions/APIActionType';
import { Action } from '@ngrx/store';

export function apiReducer(state = {}, action: APIAction) {
    if (
        action.type === ApiActionTypes.API_REQUEST_START ||
        action.apiRequestType === ApiActionTypes.API_REQUEST_SUCCESS ||
        action.apiRequestType === ApiActionTypes.API_REQUEST_FAILED
    ) {
        const apiAction = action as APIAction;
        const { payload, loading } = apiAction;
        return { payload, loading, ...state };
    } else {
        return state;
    }
}
