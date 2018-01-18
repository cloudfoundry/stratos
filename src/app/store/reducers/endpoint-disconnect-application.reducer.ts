import { APIResource } from '../types/api.types';
import { IRequestEntityTypeState } from '../app-state';
import { DISCONNECT_CNSIS_SUCCESS, DisconnectCnis, UNREGISTER_CNSIS } from '../actions/cnsis.actions';
export function endpointDisconnectApplicationReducer(entityKey) {
  return function (state: APIResource, action: DisconnectCnis) {
    switch (action.type) {
      case DISCONNECT_CNSIS_SUCCESS:
      case UNREGISTER_CNSIS:
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


