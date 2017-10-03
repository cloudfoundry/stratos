import { RequestMethod } from '@angular/http';
import { error } from 'util';

import { AppMetadataTypes, GetAppMetadataAction } from '../actions/app-metadata.actions';
import { mergeState } from '../helpers/reducer.helper';

export interface AppMetadataRequestStates {
    [key: string]: {
        instances: AppMetadataRequestState;
        environmentVars: AppMetadataRequestState;
    };
}

export interface AppMetadataRequestState {
    fetching: boolean;
    updating: boolean;
    creating: boolean;
    error: boolean;
    response: any;
    message: string;
}

const defaultAppMetadataRequest = {
    fetching: false,
    updating: false,
    creating: false,
    error: false,
    response: null,
    message: ''
};

export function appMetadataRequestReducer(state = {}, action) {
    const appMetadataAction: GetAppMetadataAction = action.appMetadataAction;
    switch (action.type) {
        case AppMetadataTypes.APP_METADATA_START:
            // console.log('app metadata request recuder: APP_METADATA_START');
            if (!appMetadataAction) {
                return state;
            }
            // const apiAction = action.apiAction as APIAction;
            const requestState = getAppMetadataRequestState(state, appMetadataAction);
            appMetadataAction.options.method === RequestMethod.Post ||
                appMetadataAction.options.method.toString().toLocaleLowerCase() === 'post' ?
                requestState.creating = true :
                requestState.fetching = true;
            requestState.error = false;
            requestState.response = {};
            requestState.message = '';
            return setAppMetadataRequestState(state, requestState, appMetadataAction);
        case AppMetadataTypes.APP_METADATA_SUCCESS:
            // console.log('app metadata request recuder: setAppMetadataRequestState');
            const requestSuccessState = getAppMetadataRequestState(state, appMetadataAction);
            requestSuccessState.fetching = false;
            requestSuccessState.creating = false;
            requestSuccessState.error = false;
            return setAppMetadataRequestState(state, requestSuccessState, appMetadataAction);
        case AppMetadataTypes.APP_METADATA_FAILED:
            // console.log('app metadata request recuder: APP_METADATA_FAILED');
            const requestFailedState = getAppMetadataRequestState(state, appMetadataAction);
            requestFailedState.fetching = false;
            requestFailedState.error = true;
            requestFailedState.message = action.message;
            requestFailedState.response = action.response;
            return setAppMetadataRequestState(state, requestFailedState, appMetadataAction);
        default:
            return state;
    }
}


function getAppMetadataRequestState(state, { metadataType, guid }): AppMetadataRequestState {
    // TODO: RC 'appMetadata' string
    let requestState = state[guid] || {};
    requestState = requestState[metadataType] || {};
    if (requestState && typeof requestState === 'object' && Object.keys(requestState).length) {
        return requestState;
    }
    return { ...defaultAppMetadataRequest };
}

function setAppMetadataRequestState(state, requestState, { metadataType, guid }): AppMetadataRequestStates {
    // TODO: RC 'appMetadata' string
    const newState = {
        [guid]: {
            [metadataType]: requestState
        }
    };
    return mergeState(state, newState);
}


// function createRequestStateFromResponse(entities, state): EntitiesState {
//     let newState = { ...state };
//     Object.keys(entities).forEach(entityKey => {
//         Object.keys(entities[entityKey]).forEach(guid => {
//             const entState = getAppMetadataRequestState(state, { entityKey, guid });
//             entState.fetching = false;
//             entState.error = false;
//             newState = setAppMetadataRequestState(newState, entState, { entityKey, guid });
//         });
//     });
//     return newState;
// }
