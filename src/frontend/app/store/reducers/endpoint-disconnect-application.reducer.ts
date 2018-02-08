import { APIResource } from '../types/api.types';
import { IRequestEntityTypeState } from '../app-state';
import { DISCONNECT_ENDPOINTS_SUCCESS, DisconnectEndpoint, UNREGISTER_ENDPOINTS } from '../actions/endpoint.actions';
export function endpointDisconnectApplicationReducer(entityKey) {
  return function (state: APIResource, action: DisconnectEndpoint) {
    switch (action.type) {
      case DISCONNECT_ENDPOINTS_SUCCESS:
      case UNREGISTER_ENDPOINTS:
        return deletionApplicationFromEndpoint(state, action.guid, entityKey);
    }
    return state;
  };
}

function deletionApplicationFromEndpoint(state: APIResource, endpointGuid, entityKey: string) {
  const oldEntities = Object.values(state);
  const entities = {};
  oldEntities.forEach(app => {
    if (app.cfGuid !== endpointGuid && app.guid) {
      entities[app.guid] = app;
    }
  });
  return entities;
}


