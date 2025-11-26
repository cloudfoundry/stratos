import type { Action } from '@ngrx/store';

import { GET_ENDPOINTS, GET_ENDPOINTS_FAILED, GET_ENDPOINTS_SUCCESS } from '../actions/endpoint.actions';
import type { EndpointState } from '../types/endpoint.types';

interface GetEndpointsFailedAction extends Action {
  message?: string;
}

export function endpointsReducer(
  state: EndpointState = {
    loading: false,
    error: false,
    message: ''
  },
  action: Action
): EndpointState {
  switch (action.type) {
    case GET_ENDPOINTS:
      return { ...state, loading: true, message: '', error: false };
    case GET_ENDPOINTS_SUCCESS:
      return { ...state, loading: false, message: '', error: false };
    case GET_ENDPOINTS_FAILED: {
      const failedAction = action as GetEndpointsFailedAction;
      return { ...state, loading: false, message: failedAction.message || 'Failed to get endpoints', error: true };
    }
    default:
      return state;
  }
}
