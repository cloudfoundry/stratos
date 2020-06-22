import { SESSION_VERIFIED, VERIFY_SESSION } from '../actions/auth.actions';
import {
  CONNECT_ENDPOINTS,
  CONNECT_ENDPOINTS_FAILED,
  CONNECT_ENDPOINTS_SUCCESS,
  DISCONNECT_ENDPOINTS,
  DISCONNECT_ENDPOINTS_FAILED,
  DISCONNECT_ENDPOINTS_SUCCESS,
} from '../actions/endpoint.actions';
import { METRIC_API_SUCCESS, MetricAPIQueryTypes, MetricsAPIActionSuccess } from '../actions/metrics-api.actions';
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
    case METRIC_API_SUCCESS:
      return updateMetricsInfo(state, action);
    default:
      return state;
  }
}

function fetchingEndpointInfo(state) {
  const fetchingState = { ...state };
  let modified = false;
  getAllEndpointIds(fetchingState).forEach(guid => {
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
  Object.keys(payload.endpoints).forEach(type => {
    getAllEndpointIds(newState[type], payload.endpoints[type]).forEach(guid => {
      const endpointInfo = payload.endpoints[type][guid] as EndpointModel;
      newState[guid] = {
        ...newState[guid],
        ...endpointInfo,
        metricsAvailable: endpointHasMetrics(endpointInfo)
      };
    });
  });
  return newState;
}

function endpointHasMetrics(endpoint: EndpointModel) {
  if (!endpoint || !endpoint.metadata) {
    return false;
  }
  return !!endpoint.metadata.metrics;
}

function changeEndpointConnectionStatus(
  state: IRequestEntityTypeState<EndpointModel>,
  action: {
    guid: string
  },
  connectionStatus: endpointConnectionStatus
) {
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

function getAllEndpointIds(endpoints = {}, payloadEndpoints = {}) {
  return new Set(Object.keys(endpoints).concat(Object.keys(payloadEndpoints)));
}

function updateMetricsInfo(state: IRequestEntityTypeState<EndpointModel>, action: MetricsAPIActionSuccess) {
  if (action.queryType === MetricAPIQueryTypes.TARGETS) {
    const existingEndpoint = state[action.endpointGuid];
    return {
      ...state,
      [action.endpointGuid]: {
        ...existingEndpoint,
        metadata: {
          ...existingEndpoint.metadata,
          metrics_targets: action.data.data
        }
      },
    };
  } else if (action.queryType === MetricAPIQueryTypes.STRATOS_METADATA) {
    const existingEndpoint = state[action.endpointGuid];
    return {
      ...state,
      [action.endpointGuid]: {
        ...existingEndpoint,
        metadata: {
          ...existingEndpoint.metadata,
          metrics_stratos: action.data
        }
      },
    };
  }

  return state;

}
