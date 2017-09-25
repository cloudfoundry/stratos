import { ApiActionTypes } from './../actions/api.actions';
import { defaultEntitiesState } from './entity.reducer';

const defaultState = { ...defaultEntitiesState };
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
    message: 'HELLLLOOOOOO'
};

function getEntityRequestState(state, { entityKey, guid }) {
    const requestState = { ...state[entityKey][guid] };
    if (requestState && typeof requestState === 'object' && Object.keys(requestState).length) {
        return requestState;
    }
    return { ...defaultEntityRequest };
}

function setEntityRequestState(state, requestState, { entityKey, guid }) {
    const newState = { ...state };
    newState[entityKey][guid] = requestState;
    return newState;
}

export function apiRequestReducer(state = defaultState, action) {
    const actionType = action.apiType || action.type;
    switch (actionType) {
        case ApiActionTypes.API_REQUEST_START:
            if (!action.apiAction.guid) {
                return state;
            }
            const requestState = getEntityRequestState(state, action.apiAction);
            requestState.fetching = true;
            return setEntityRequestState(state, requestState, action.apiAction);
        case ApiActionTypes.API_REQUEST_SUCCESS:
            if (action.apiAction.guid) {
                const requestSuccessState = getEntityRequestState(state, action.apiAction);
                requestSuccessState.fetching = false;
                requestSuccessState.error = false;
                return setEntityRequestState(state, requestSuccessState, action.apiAction);
            } else if (action.response && action.response.entities) {
                const entities = { ...action.response.entities };
                // Make this more functional programming-y
                Object.keys(entities).forEach(entityKey => {
                    Object.keys(entities[entityKey]).forEach(guid => {
                        const entState = getEntityRequestState(state, { entityKey, guid });
                        entState.fetching = false;
                        entState.error = false;
                        entState.message = 'WF';
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

