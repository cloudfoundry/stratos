import { Action } from '@ngrx/store';

import {
  DISCONNECT_ENDPOINTS_SUCCESS,
  DisconnectEndpoint,
  GET_ENDPOINTS_SUCCESS,
  GetAllEndpointsSuccess,
  UNREGISTER_ENDPOINTS_SUCCESS,
} from '../../actions/endpoint.actions';
import { AddRecentlyVisitedEntityAction, SetRecentlyVisitedEntityAction } from '../../actions/recently-visited.actions';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { endpointEntityType, STRATOS_ENDPOINT_TYPE } from '../../helpers/stratos-entity-factory';
import { IRecentlyVisitedState } from '../../types/recently-visited.types';
import { addRecentlyVisitedEntity, cleanRecentsList, getDefaultRecentState } from './recently-visited.reducer.helpers';

export function recentlyVisitedReducer(
  state: IRecentlyVisitedState = getDefaultRecentState(),
  action: Action
): IRecentlyVisitedState {
  switch (action.type) {
    case AddRecentlyVisitedEntityAction.ACTION_TYPE:
      return addRecentlyVisitedEntity(state, action as AddRecentlyVisitedEntityAction);
    case SetRecentlyVisitedEntityAction.ACTION_TYPE:
      const setAction = action as SetRecentlyVisitedEntityAction;
      const newState = {
        ...state,
        [setAction.recentlyVisited.guid]: setAction.recentlyVisited
      };
      return newState;
    case DISCONNECT_ENDPOINTS_SUCCESS:
    case UNREGISTER_ENDPOINTS_SUCCESS:
      const removeEndpointAction = action as DisconnectEndpoint;
      return cleanRecentsList(state, [removeEndpointAction.guid]);
    case GET_ENDPOINTS_SUCCESS:
      const getAllAction = action as GetAllEndpointsSuccess;
      const endpointKey = entityCatalog.getEntityKey(STRATOS_ENDPOINT_TYPE, endpointEntityType);
      const connectedIds = Object.values(getAllAction.payload.entities[endpointKey]).reduce((ids, endpoint) => {
        if (endpoint.user) {
          ids.push(endpoint.guid);
        }
        return ids;
      }, []);
      return cleanRecentsList(state, connectedIds, true);
  }
  return state;
}
