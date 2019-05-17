import {
  LocalPaginationHelpers,
} from '../../../../core/src/shared/components/list/data-sources-controllers/local-list.helpers';
import { UpdatePaginationMaxedState } from '../../actions/pagination.actions';
import { PaginationEntityTypeState, PaginationState } from '../../types/pagination.types';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';

export function paginationMaxReached(state: PaginationState, action: UpdatePaginationMaxedState): PaginationState {
  const entityKey = entityCatalogue.getEntityKey(action);
  if (!state[entityKey] || !state[entityKey][action.paginationKey]) {
    return state;
  }
  const requestSection = LocalPaginationHelpers.getEntityPageRequest(
    state[entityKey][action.paginationKey],
    action.forcedEntityKey || entityKey
  );
  const { maxedMode: oldMaxedMode } = state[action.entityType][action.paginationKey];
  const { pageNumber, pageRequest } = requestSection;
  const { maxed: oldCurrentlyMaxed = false } = pageRequest;
  const newCurrentlyMaxed = action.allEntities >= action.max;
  const newMaxedMode = oldCurrentlyMaxed || newCurrentlyMaxed;
  // If we previously weren't in maxed mode and still aren't then don't continue. Note - Once a list enters maxed mode it cannot go back
  if (!oldMaxedMode && !newMaxedMode) {
    return state;
  }

  // If there's no change than don't continue
  if (oldMaxedMode === newMaxedMode && oldCurrentlyMaxed === newCurrentlyMaxed) {
    return state;
  }

  const entityState: PaginationEntityTypeState = {
    ...state[entityKey],
    [action.paginationKey]: {
      ...state[entityKey][action.paginationKey],
      // currentlyMaxed: newCurrentlyMaxed,
      pageRequests: {
        ...state[entityKey][action.paginationKey].pageRequests,
        [pageNumber]: {
          ...pageRequest,
          maxed: newCurrentlyMaxed
        }
      },
      // Once a list is maxed it can never go back, so can't set true to false
      maxedMode: oldMaxedMode || newMaxedMode
    }
  };
  return {
    ...state,
    [entityKey]: entityState
  };
}
