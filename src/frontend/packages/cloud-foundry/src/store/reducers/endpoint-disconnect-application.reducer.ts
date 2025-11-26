import type { Action } from '@ngrx/store';
import {
  DISCONNECT_ENDPOINTS_SUCCESS,
  type DisconnectEndpoint,
  UNREGISTER_ENDPOINTS_SUCCESS,
} from '../../../../store/src/actions/endpoint.actions';
import type { IRequestEntityTypeState } from '../../../../store/src/app-state';
import type { APIResource } from '../../../../store/src/types/api.types';
import type { StratosCFEntity } from '../../cf-api.types';

// Type guard to check if entity has cfGuid
function hasCfGuid(entity: unknown): entity is { cfGuid: string } {
  return entity !== null && typeof entity === 'object' && 'cfGuid' in entity;
}

// Type guard to check if entity is an APIResource
function isAPIResource<T>(entity: unknown): entity is APIResource<T> {
  return entity !== null && typeof entity === 'object' && 'entity' in entity && 'metadata' in entity;
}

// #3704 - These can be removed after this ticket is completed
export function endpointDisconnectRemoveEntitiesReducer<T>() {
  return (state: IRequestEntityTypeState<T>, action: Action): IRequestEntityTypeState<T> => {
    const disconnectAction = action as unknown as DisconnectEndpoint;
    switch (action.type) {
      case DISCONNECT_ENDPOINTS_SUCCESS:
      case UNREGISTER_ENDPOINTS_SUCCESS:
        return deletionApplicationFromEndpoint<T>(state, disconnectAction.guid);
    }
    return state;
  };
}

function deletionApplicationFromEndpoint<T>(
  state: IRequestEntityTypeState<T>,
  endpointGuid: string
): IRequestEntityTypeState<T> {
  return Object.keys(state).reduce((newEntities: IRequestEntityTypeState<T>, guid: string) => {
    const entity = state[guid];
    if (isAPIResource<unknown>(entity)) {
      const innerEntity = entity.entity;
      if (hasCfGuid(innerEntity) && innerEntity.cfGuid !== endpointGuid && entity.metadata?.guid) {
        newEntities[guid] = entity;
      }
    } else if (hasCfGuid(entity)) {
      if (entity.cfGuid !== endpointGuid) {
        newEntities[guid] = entity;
      }
    } else {
      // Keep entities that don't have cfGuid (shouldn't filter them out)
      newEntities[guid] = entity;
    }
    return newEntities;
  }, {} as IRequestEntityTypeState<T>);
}
