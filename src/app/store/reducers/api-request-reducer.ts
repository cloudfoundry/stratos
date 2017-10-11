import { RequestMethod } from '@angular/http';

import { APIAction, ApiActionTypes, WrapperAPIActionSuccess } from '../actions/api.actions';
import { mergeState } from '../helpers/reducer.helper';
import { defaultEntitiesState, EntitiesState } from './entity.reducer';

const defaultState = { ...defaultEntitiesState };

export interface UpdateState {
    busy: boolean;
    error: boolean;
    message: string;
}
const rootUpdatingKey = '_root_';
export interface EntityRequestState {
    fetching: boolean;
    updating: {
        _root_: UpdateState,
        [key: string]: UpdateState
    };
    creating: boolean;
    error: boolean;
    response: any;
    message: string;
}

const defaultEntityRequest = {
    fetching: false,
    updating: {
        _root_: {
            busy: false,
            error: false,
            message: ''
        }
    },
    creating: false,
    error: false,
    response: null,
    message: ''
};

// NJ: Allow setting the update flag of arbitrary entity from any request.
// Currently we just using apiAction.guid the actions entity type and the http method
// to work out where and if we should set the creating flag.
// We should allow extra config that points to any entity type and doesn't rely on http method.

export function apiRequestReducer(state = defaultState, action) {
    const actionType = action.apiType || action.type;
    switch (actionType) {
        case ApiActionTypes.API_REQUEST_START:
            if (!action.apiAction.guid) {
                return state;
            }
            const apiAction = action.apiAction as APIAction;

            const requestTypeStart = getRequestTypeFromMethod(apiAction.options.method);
            let requestState = getEntityRequestState(state, action.apiAction);

            if (requestTypeStart === 'update') {
                requestState.updating = mergeUpdatingState(
                    action.apiAction,
                    requestState.updating,
                    {
                        busy: true,
                        error: false,
                        message: '',
                    }
                );
            } else {
                requestState = modifyRequestWithRequestType(
                    requestState,
                    requestTypeStart
                );
            }

            return setEntityRequestState(state, requestState, action.apiAction);
        case ApiActionTypes.API_REQUEST_SUCCESS:
            if (action.apiAction.guid) {
                const requestTypeSuccess = getRequestTypeFromMethod(action.apiAction.options.method);
                const successAction = action as WrapperAPIActionSuccess;

                const requestSuccessState = getEntityRequestState(state, action.apiAction);
                if (requestTypeSuccess === 'update') {
                    requestSuccessState.updating = mergeUpdatingState(
                        action.apiAction,
                        requestSuccessState.updating,
                        {
                            busy: false,
                            error: false,
                            message: '',
                        }
                    );
                } else {
                    requestSuccessState.fetching = false;
                    requestSuccessState.error = false;
                    requestSuccessState.creating = false;
                    requestSuccessState.response = successAction.response;
                }

                const newState = mergeState(
                    createRequestStateFromResponse(successAction.response.entities, state),
                    setEntityRequestState(state, requestSuccessState, action.apiAction)
                );

                return newState;
            } else if (action.response && action.response.entities) {
                const { entities } = action.response;
                return createRequestStateFromResponse(entities, state);
            }
            return state;
        case ApiActionTypes.API_REQUEST_FAILED:
            if (action.apiAction.guid) {
                const requestTypeSuccess = getRequestTypeFromMethod(action.apiAction.options.method);

                const requestFailedState = getEntityRequestState(state, action.apiAction);
                if (requestTypeStart === 'update') {
                    requestFailedState.updating = mergeUpdatingState(
                        action.apiAction,
                        requestFailedState.updating,
                        {
                            busy: false,
                            error: true,
                            message: action.message
                        }
                    );
                } else {
                    requestFailedState.fetching = false;
                    requestFailedState.error = true;
                    requestFailedState.creating = false;
                    requestFailedState.message = action.message;
                }
                return setEntityRequestState(state, requestFailedState, action.apiAction);
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

function setEntityRequestState(state, requestState, { entityKey, guid }): EntitiesState {
    const newState = {
        [entityKey]: {
            [guid]: requestState
        }
    };
    return mergeState(state, newState);
}


function createRequestStateFromResponse(entities, state): EntitiesState {
    let newState = { ...state };
    Object.keys(entities).forEach(entityKey => {
        Object.keys(entities[entityKey]).forEach(guid => {
            const entState = getEntityRequestState(state, { entityKey, guid });
            entState.fetching = false;
            entState.error = false;
            newState = setEntityRequestState(newState, entState, { entityKey, guid });
        });
    });
    return newState;
}

export type ApiRequestTypes = 'fetch' | 'update' | 'create' | 'delete';

function getRequestTypeFromMethod(method): ApiRequestTypes {
    if (typeof method === 'string') {
        method = method.toString().toLowerCase();
        if (method === 'post') {
            return 'create';
        }
        if (method === 'put') {
            return 'update';
        }
        if (method === 'delete') {
            return 'delete';
        }
    } else if (typeof method === 'number') {
        if (method === RequestMethod.Post) {
            return 'create';
        }
        if (method === RequestMethod.Put) {
            return 'update';
        }
        if (method === RequestMethod.Delete) {
            return 'delete';
        }
    }
    return 'fetch';
}

function modifyRequestWithRequestType(requestState: EntityRequestState, type: ApiRequestTypes) {
    if (type === 'fetch') {
        requestState.fetching = true;
    } else if (type === 'create') {
        requestState.creating = true;
    }

    return requestState;
}

function mergeUpdatingState(apiAction, updatingState, newUpdatingState) {
    const updateKey = apiAction.updatingKey || rootUpdatingKey;
    return {
        ...updatingState,
        ...{ [updateKey]: newUpdatingState }
    };
}
