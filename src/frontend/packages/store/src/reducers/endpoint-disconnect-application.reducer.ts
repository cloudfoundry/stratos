import { IApp, StratosCFEntity } from '../../../core/src/core/cf-api.types';
import { DISCONNECT_ENDPOINTS_SUCCESS, DisconnectEndpoint, UNREGISTER_ENDPOINTS_SUCCESS } from '../actions/endpoint.actions';
import { IRequestEntityTypeState } from '../app-state';
import { APIResource } from '../types/api.types';

// #3704 - These can be removed after this ticket is completed
export function endpointDisconnectRemoveEntitiesReducer<T = IApp>() {
  return (state: IRequestEntityTypeState<APIResource<T & StratosCFEntity>>, action: DisconnectEndpoint) => {
    switch (action.type) {
      case DISCONNECT_ENDPOINTS_SUCCESS:
      case UNREGISTER_ENDPOINTS_SUCCESS:
        return deletionApplicationFromEndpoint(state, action.guid);
    }
    return state;
  };
}

function deletionApplicationFromEndpoint<T extends StratosCFEntity>(state: IRequestEntityTypeState<APIResource<T>>, endpointGuid) {
  return Object.values(state).reduce((newEntities, app) => {
    if (app.entity.cfGuid !== endpointGuid && app.metadata.guid) {
      newEntities[app.metadata.guid] = app;
    }
    return newEntities;
  }, {});
}
