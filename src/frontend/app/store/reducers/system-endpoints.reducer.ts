import { SESSION_VERIFIED, VERIFY_SESSION } from '../actions/auth.actions';
import {
  CONNECT_ENDPOINTS,
  CONNECT_ENDPOINTS_FAILED,
  CONNECT_ENDPOINTS_SUCCESS,
  DISCONNECT_ENDPOINTS,
  DISCONNECT_ENDPOINTS_FAILED,
  DISCONNECT_ENDPOINTS_SUCCESS,
} from '../actions/endpoint.actions';
import { IRequestEntityTypeState } from '../app-state';
import { endpointConnectionStatus, EndpointModel } from '../types/endpoint.types';
import { GET_SYSTEM_INFO, GET_SYSTEM_INFO_SUCCESS } from './../actions/system.actions';

export function systemEndpointsReducer(state: IRequestEntityTypeState<EndpointModel>, action) {
  switch (action.type) {
    case VERIFY_SESSION:
    case GET_SYSTEM_INFO:
      return fetchingEndpointInfo(state);
    case SESSION_VERIFIED:
    case GET_SYSTEM_INFO_SUCCESS:
      return succeedEndpointInfo(state, action);
    case CONNECT_ENDPOINTS_FAILED:
    case DISCONNECT_ENDPOINTS_SUCCESS:
      return changeEndpointConnectionStatus(state, action, 'disconnected');
    case DISCONNECT_ENDPOINTS_FAILED:
    case CONNECT_ENDPOINTS_SUCCESS:
      return changeEndpointConnectionStatus(state, action, 'connected');
    case CONNECT_ENDPOINTS:
    case DISCONNECT_ENDPOINTS:
      return changeEndpointConnectionStatus(state, action, 'checking');
    default:
      return state;
  }
}

function fetchingEndpointInfo(state) {
  const fetchingState = { ...state };
  let modified = false;
  getAllEnpointIds(fetchingState).forEach(guid => {
    // Only set checking flag if we don't have a status
    if (!fetchingState[guid].connectionStatus) {
      modified = true;
      fetchingState[guid] = {
        ...fetchingState[guid],
        connectionStatus: 'checking'
      };
    }
  });
  return modified ? fetchingState : state;
}

function succeedEndpointInfo(state, action) {
  const newState = { ...state };
  const payload = action.type === GET_SYSTEM_INFO_SUCCESS ? action.payload : action.sessionData;
  getAllEnpointIds(newState, payload.endpoints.cf).forEach(guid => {
    const endpointInfo = payload.endpoints.cf[guid];
    newState[guid] = {
      ...newState[guid],
      ...endpointInfo
    };
  });
  return newState;
}

function changeEndpointConnectionStatus(state: IRequestEntityTypeState<EndpointModel>, action: {
  guid: string
}, connectionStatus: endpointConnectionStatus) {
  if (!action.guid) {
    return state;
  }
  return {
    ...state,
    [action.guid]: {
      ...state[action.guid],
      connectionStatus
    }
  };
}

function getAllEnpointIds(endpoints, payloadEndpoints = {}) {
  return new Set(Object.keys(endpoints).concat(Object.keys(payloadEndpoints)));
}
