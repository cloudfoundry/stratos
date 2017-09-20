import { mergeState } from './../helpers/reducer.helper';
import { defaultEntitiesState, EntitiesState } from './entity.reducer';
import { APIAction, ApiActionTypes } from './../actions/api.actions';
import { Action } from '@ngrx/store';

export interface EntityRequestState {
    fetching: boolean;
    updating: boolean;
    error: boolean;
    message: string;
}

const defaultEntityRequest = {
    fetching: false,
    updating: false,
    error: false,
    message: ''
};

function getEntityRequestState(state: EntitiesState, apiAction: APIAction) {
    const requestState = state[apiAction.entityKey][apiAction.guid];
    if (requestState && typeof requestState === 'object' && Object.keys(requestState).length) {
        return { ...requestState };
    }
    return { ...defaultEntityRequest };
}

function setEntityRequestState(state: EntitiesState, requestState, apiAction: APIAction) {
    state[apiAction.entityKey][apiAction.guid] = requestState;
    return { ...state };
}

export function apiRequestReducer(state: EntitiesState = defaultEntitiesState, action) {
    const actionType = action.apiType || action.type;
    switch (actionType) {
        case ApiActionTypes.API_REQUEST_START:
            if (!action.apiAction.guid) {
                return state;
            }
            console.log(`loading api`);
            const requestState = getEntityRequestState(state, action.apiAction);
            requestState.fetching = true;
            return setEntityRequestState(state, requestState, action.apiAction);
        case ApiActionTypes.API_REQUEST_SUCCESS:
            console.log(`success api`);
            if (action.apiAction.guid) {
                const requestSuccessState = getEntityRequestState(state, action.apiAction);
                requestSuccessState.fetching = false;
                return setEntityRequestState(state, requestSuccessState, action.apiAction);
            }
            return state;
        case ApiActionTypes.API_REQUEST_FAILED:
            console.log(`failed api`);
            if (action.apiAction.guid) {
                const requestSuccessState = getEntityRequestState(state, action.apiAction);
                requestSuccessState.fetching = false;
                requestSuccessState.error = true;
                requestSuccessState.message = action.message;
                return setEntityRequestState(state, requestSuccessState, action.apiAction);
            }
            return state;
        default:
            return state;
    }
}

