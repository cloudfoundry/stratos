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
            if (!appMetadataAction) {
                return state;
            }
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
            const requestSuccessState = getAppMetadataRequestState(state, appMetadataAction);
            requestSuccessState.fetching = false;
            requestSuccessState.creating = false;
            requestSuccessState.error = false;
            return setAppMetadataRequestState(state, requestSuccessState, appMetadataAction);
        case AppMetadataTypes.APP_METADATA_FAILED:
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
    let requestState = state[guid] || {};
    requestState = requestState[metadataType] || {};
    if (requestState && typeof requestState === 'object' && Object.keys(requestState).length) {
        return requestState;
    }
    return { ...defaultAppMetadataRequest };
}

function setAppMetadataRequestState(state, requestState, { metadataType, guid }): AppMetadataRequestStates {
    const newState = {
        [guid]: {
            [metadataType]: requestState
        }
    };
    return mergeState(state, newState);
}
