import { IApp } from '../../core/cf-api.types';
import { DISCONNECT_ENDPOINTS_SUCCESS, DisconnectEndpoint, UNREGISTER_ENDPOINTS_SUCCESS } from '../actions/endpoint.actions';
import { APIResource } from '../types/api.types';

export function endpointDisconnectApplicationReducer() {
  return function (state: { [appGuid: string]: APIResource<{ cfGuid: string }> }, action: DisconnectEndpoint) {
    switch (action.type) {
      case DISCONNECT_ENDPOINTS_SUCCESS:
      case UNREGISTER_ENDPOINTS_SUCCESS:
        return deletionApplicationFromEndpoint(state, action.guid);
    }
    return state;
  };
}

function deletionApplicationFromEndpoint(state: { [appGuid: string]: APIResource<{ cfGuid: string }> }, endpointGuid) {
  return Object.values(state).reduce((newEntities, app) => {
    if (app.entity.cfGuid !== endpointGuid && app.metadata.guid) {
      newEntities[app.metadata.guid] = app;
    }
    return newEntities;
  }, {});
}
