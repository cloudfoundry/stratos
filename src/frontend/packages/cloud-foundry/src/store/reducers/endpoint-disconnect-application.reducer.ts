import { IApp, StratosCFEntity } from '../../../../core/src/core/cf-api.types';
import {
  DISCONNECT_ENDPOINTS_SUCCESS,
  DisconnectEndpoint,
  UNREGISTER_ENDPOINTS_SUCCESS
} from '../../../../store/src/actions/endpoint.actions';
import { APIResource } from '../../../../store/src/types/api.types';
import { IRequestEntityTypeState } from '../../../../store/src/app-state';

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
