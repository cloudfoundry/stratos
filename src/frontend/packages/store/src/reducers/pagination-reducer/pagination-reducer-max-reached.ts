import {
  LocalPaginationHelpers,
} from '../../../../core/src/shared/components/list/data-sources-controllers/local-list.helpers';
import { UpdatePaginationMaxedState } from '../../actions/pagination.actions';
import { PaginationEntityTypeState, PaginationState } from '../../types/pagination.types';

export function paginationMaxReached(state: PaginationState, action: UpdatePaginationMaxedState): PaginationState {
  if (!state[action.entityKey] || !state[action.entityKey][action.paginationKey]) {
    return state;
  }
  const requestSection = LocalPaginationHelpers.getEntityPageRequest(
    state[action.entityKey][action.paginationKey],
    action.forcedEntityKey || action.entityKey
  );
  const { maxedMode: oldMaxedMode } = state[action.entityKey][action.paginationKey];
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
    ...state[action.entityKey],
    [action.paginationKey]: {
      ...state[action.entityKey][action.paginationKey],
      // currentlyMaxed: newCurrentlyMaxed,
      pageRequests: {
        ...state[action.entityKey][action.paginationKey].pageRequests,
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
    [action.entityKey]: entityState
  };
}
