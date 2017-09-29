import { RequestMethod } from '@angular/http';
import { error } from 'util';

import { APIAction, ApiActionTypes, WrapperAPIActionSuccess } from '../actions/api.actions';
import { mergeState } from '../helpers/reducer.helper';
import { defaultEntitiesState } from './entity.reducer';

const defaultState = { ...defaultEntitiesState };
export interface EntityRequestState {
    fetching: boolean;
    updating: boolean;
    creating: boolean;
    error: boolean;
    response: any;
    message: string;
}

const defaultEntityRequest = {
    fetching: false,
    updating: false,
    creating: false,
    error: false,
    response: null,
    message: ''
};

export function apiRequestReducer(state = defaultState, action) {
    const actionType = action.apiType || action.type;
    switch (actionType) {
        case ApiActionTypes.API_REQUEST_START:
            if (!action.apiAction.guid) {
                return state;
            }
            const apiAction = action.apiAction as APIAction;
            const requestState = getEntityRequestState(state, action.apiAction);
            apiAction.options.method === RequestMethod.Post ||
                apiAction.options.method.toString().toLocaleLowerCase() === 'post' ?
                requestState.creating = true :
                requestState.fetching = true;

            return setEntityRequestState(state, requestState, action.apiAction);
        case ApiActionTypes.API_REQUEST_SUCCESS:
            if (action.apiAction.guid) {
                const successAction = action as WrapperAPIActionSuccess;

                const requestSuccessState = getEntityRequestState(state, action.apiAction);
                requestSuccessState.fetching = false;
                requestSuccessState.creating = false;
                requestSuccessState.error = false;
                requestSuccessState.response = successAction.response;
                const newState = setEntityRequestState(state, requestSuccessState, action.apiAction);

                if (action.apiAction.guid !== successAction.response.result[0]) {
                    // If we have a temp guid (i.e. from a creation) then make sure we populate the actual
                    // entity request.
                    // const actualAction = { ...action.apiAction };
                    action.apiAction.guid = successAction.response.result[0];
                    return setEntityRequestState(newState, requestSuccessState, action.apiAction);
                }

                return newState;
            } else if (action.response && action.response.entities) {
                const entities = { ...action.response.entities };
                // Make this more functional programming-y
                Object.keys(entities).forEach(entityKey => {
                    Object.keys(entities[entityKey]).forEach(guid => {
                        const entState = getEntityRequestState(state, { entityKey, guid });
                        entState.fetching = false;
                        entState.error = false;
                        setEntityRequestState(state, entState, { entityKey, guid });
                    });
                });
                return { ...state };
            }
            return state;
        case ApiActionTypes.API_REQUEST_FAILED:
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


function getEntityRequestState(state, { entityKey, guid }): EntityRequestState {
    const requestState = { ...state[entityKey][guid] };
    if (requestState && typeof requestState === 'object' && Object.keys(requestState).length) {
        return requestState;
    }
    return { ...defaultEntityRequest };
}

function setEntityRequestState(state, requestState, { entityKey, guid }): EntityRequestState {
    const newState = {
        [entityKey]: {
            [guid]: requestState
        }
    };

    newState[entityKey][guid] = requestState;
    return mergeState(state, newState);
}
