import { IRequestEntityTypeState } from '../app-state';
import { APIResource } from '../types/api.types';
import { CNSISModel } from '../types/cnsis.types';
import { GetSystemSuccess, GET_SYSTEM_INFO_SUCCESS, GET_SYSTEM_INFO } from './../actions/system.actions';
import { VERIFY_SESSION, SESSION_VERIFIED } from '../actions/auth.actions';

export function systemEndpointsReducer(state: IRequestEntityTypeState<CNSISModel>, action) {
  switch (action.type) {
    case VERIFY_SESSION:
    case GET_SYSTEM_INFO:
      return fetchingEndpointInfo(state);
    case SESSION_VERIFIED:
    case GET_SYSTEM_INFO_SUCCESS:
      return succeedEndpointInfo(state, action);
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
      info: payload.endpoints.cf[guid],
      connectionStatus: endpointInfo ? endpointInfo.user ? 'connected' : 'disconnected' : 'unknown'
    };
  });
  return newState;
}

function getAllEnpointIds(endpoints, payloadEndpoints = {}) {
  return new Set(Object.keys(endpoints).concat(Object.keys(payloadEndpoints)));
}
