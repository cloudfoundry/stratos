import { Action } from '@ngrx/store';

import {
  DISCONNECT_ENDPOINTS_SUCCESS,
  DisconnectEndpoint,
  GET_ENDPOINTS_SUCCESS,
  GetAllEndpointsSuccess,
  UNREGISTER_ENDPOINTS_SUCCESS,
} from '../../actions/endpoint.actions';
import { AddRecentlyVisitedEntityAction, SetRecentlyVisitedEntityAction } from '../../actions/recently-visited.actions';
import { IRecentlyVisitedState } from '../../types/recently-visited.types';
import { addNewHit, cleanRecentsList, getDefaultRecentState } from './recently-visited.reducer.helpers';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { STRATOS_ENDPOINT_TYPE } from '../../../../core/src/base-entity-schemas';
import { endpointSchemaKey } from '../../helpers/entity-factory';

export function recentlyVisitedReducer(
  state: IRecentlyVisitedState = getDefaultRecentState(),
  action: Action
): IRecentlyVisitedState {
  switch (action.type) {
    case AddRecentlyVisitedEntityAction.ACTION_TYPE:
      return addNewHit(state, action as AddRecentlyVisitedEntityAction);
    case SetRecentlyVisitedEntityAction.ACTION_TYPE:
      const setAction = action as SetRecentlyVisitedEntityAction;
      return {
        hits: state.hits,
        entities: {
          ...state.entities,
          [setAction.recentlyVisited.guid]: setAction.recentlyVisited
        }
      };
    case DISCONNECT_ENDPOINTS_SUCCESS:
    case UNREGISTER_ENDPOINTS_SUCCESS:
      const removeEndpointAction = action as DisconnectEndpoint;
      return cleanRecentsList(state, [removeEndpointAction.guid]);
    case GET_ENDPOINTS_SUCCESS:
      const getAllAction = action as GetAllEndpointsSuccess;
      const endpointKey = entityCatalog.getEntityKey(STRATOS_ENDPOINT_TYPE, endpointSchemaKey);
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
