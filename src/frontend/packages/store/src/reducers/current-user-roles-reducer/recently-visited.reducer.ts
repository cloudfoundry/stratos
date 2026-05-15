import { Action } from '@ngrx/store';

import { EntityDeleteCompleteAction } from '../../actions/entity.delete.actions';
import {
  AddRecentlyVisitedEntityAction,
  CleanRecentsForEndpointsAction,
  PruneRecentsToConnectedAction,
  SetRecentlyVisitedEntityAction,
} from '../../actions/recently-visited.actions';
import { IRecentlyVisitedState } from '../../types/recently-visited.types';
import {
  addRecentlyVisitedEntity,
  cleanRecentsList,
  clearEntityFromRecentsList,
  getDefaultRecentState,
} from './recently-visited.reducer.helpers';

export function recentlyVisitedReducer(
  state: IRecentlyVisitedState = getDefaultRecentState(),
  action: Action
): IRecentlyVisitedState {
  switch (action.type) {
    case EntityDeleteCompleteAction.ACTION_TYPE:
      return clearEntityFromRecentsList(state, action as EntityDeleteCompleteAction);
    case AddRecentlyVisitedEntityAction.ACTION_TYPE:
      return addRecentlyVisitedEntity(state, action as AddRecentlyVisitedEntityAction);
    case SetRecentlyVisitedEntityAction.ACTION_TYPE: {
      const setAction = action as SetRecentlyVisitedEntityAction;
      const newState = {
        ...state,
        [setAction.recentlyVisited.guid]: setAction.recentlyVisited
      };
      return newState;
    }
    case CleanRecentsForEndpointsAction.ACTION_TYPE: {
      const cleanAction = action as CleanRecentsForEndpointsAction;
      return cleanRecentsList(state, cleanAction.endpointGuids);
    }
    case PruneRecentsToConnectedAction.ACTION_TYPE: {
      const pruneAction = action as PruneRecentsToConnectedAction;
      return cleanRecentsList(state, pruneAction.connectedEndpointGuids, true);
    }
  }
  return state;
}
