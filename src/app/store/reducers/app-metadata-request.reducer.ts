import { IGetAppMetadataAction } from './../actions/app-metadata.actions';
import { RequestMethod } from '@angular/http';
import { error } from 'util';

import { AppMetadataTypes } from '../actions/app-metadata.actions';
import { mergeState } from '../helpers/reducer.helper';
import { MetadataUpdateState, AppMetadataRequestState, AppMetadataRequestStates } from '../types/app-metadata.types';

const defaultRequestProgress: MetadataUpdateState = {
  busy: false,
  error: false,
  message: '',
};

const defaultAppMetadataRequest: AppMetadataRequestState = {
  fetching: { ...defaultRequestProgress },
  updating: { ...defaultRequestProgress },
  creating: { ...defaultRequestProgress },
  error: false,
  message: ''
};

export type MetadataRequestTypes = 'fetching' | 'updating' | 'creating';
function getRequestTypeFromMethod(method): MetadataRequestTypes {
  if (typeof method === 'string') {
    method = method.toString().toLowerCase();
    if (method === 'post') {
      return 'creating';
    } else if (method === 'put') {
      return 'updating';
    }
  } else if (typeof method === 'number') {
    if (method === RequestMethod.Get) {
      return 'fetching';
    }
    if (method === RequestMethod.Post) {
      return 'creating';
    }
    if (method === RequestMethod.Put) {
      return 'updating';
    }
  }
  return 'fetching';
}

export function appMetadataRequestReducer(state = {}, action) {
  const appMetadataAction: IGetAppMetadataAction = action.appMetadataAction;
  switch (action.type) {
    case AppMetadataTypes.APP_METADATA_START:
      if (!appMetadataAction) {
        return state;
      }
      const requestState = getAppMetadataRequestState(state, appMetadataAction);
      requestState.error = false;
      requestState.message = '';
      requestState[getRequestTypeFromMethod(appMetadataAction.options.method)] = {
        busy: true,
        error: false,
        message: '',
      };
      return setAppMetadataRequestState(state, requestState, appMetadataAction);
    case AppMetadataTypes.APP_METADATA_SUCCESS:
      const requestSuccessState = getAppMetadataRequestState(state, appMetadataAction);
      requestSuccessState[getRequestTypeFromMethod(appMetadataAction.options.method)] = { ...defaultRequestProgress };
      requestSuccessState.error = false;
      requestSuccessState.message = '';
      return setAppMetadataRequestState(state, requestSuccessState, appMetadataAction);
    case AppMetadataTypes.APP_METADATA_FAILED:
      const requestFailedState = getAppMetadataRequestState(state, appMetadataAction);
      requestFailedState[getRequestTypeFromMethod(appMetadataAction.options.method)] = {
        busy: false,
        error: true,
        message: action.message,
      };
      requestFailedState.error = true;
      requestFailedState.message = action.message;
      return setAppMetadataRequestState(state, requestFailedState, appMetadataAction);
    default:
      return state;
  }
}

function getAppMetadataRequestState(state, { entityKey, guid }): AppMetadataRequestState {
  let requestState = state[guid] || {};
  requestState = requestState[entityKey] || {};
  if (requestState && typeof requestState === 'object' && Object.keys(requestState).length) {
    return { ...requestState };
  }
  return { ...defaultAppMetadataRequest };
}

function setAppMetadataRequestState(state, requestState, { entityKey, guid }): AppMetadataRequestStates {
  const newState = {
    [guid]: {
      [entityKey]: requestState
    }
  };
  return mergeState(state, newState);
}
