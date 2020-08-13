import { GET_ENDPOINTS, GET_ENDPOINTS_FAILED, GET_ENDPOINTS_SUCCESS } from '../actions/endpoint.actions';
import { EndpointState } from '../types/endpoint.types';

export function endpointsReducer(
  state: EndpointState = {
    loading: false,
    error: false,
    message: ''
  },
  action
): EndpointState {
  switch (action.type) {
    case GET_ENDPOINTS:
      return { ...state, loading: true, message: '', error: false };
    case GET_ENDPOINTS_SUCCESS:
      return { ...state, loading: false, message: '', error: false };
    case GET_ENDPOINTS_FAILED:
      return { ...state, loading: false, message: action.message || 'Failed to get endpoints', error: true };
    default:
      return state;
  }
}
