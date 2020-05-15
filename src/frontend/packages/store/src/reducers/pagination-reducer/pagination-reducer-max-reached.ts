import {
  LocalPaginationHelpers,
} from '../../../../core/src/shared/components/list/data-sources-controllers/local-list.helpers';
import { IgnorePaginationMaxedState, UpdatePaginationMaxedState } from '../../actions/pagination.actions';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { PaginationEntityTypeState, PaginationState } from '../../types/pagination.types';
import { getDefaultPaginationEntityState } from './pagination-reducer-reset-pagination';

export function paginationMaxReached(state: PaginationState, action: UpdatePaginationMaxedState): PaginationState {
  const entityKey = entityCatalog.getEntityKey(action);
  if (!state[entityKey] || !state[entityKey][action.paginationKey]) {
    return state;
  }
  const requestSection = LocalPaginationHelpers.getEntityPageRequest(
    state[entityKey][action.paginationKey],
    action.forcedEntityKey || entityKey
  );
  const { maxedState: oldMaxedState } = state[entityKey][action.paginationKey];
  if (oldMaxedState.ignoreMaxed) {
    return state;
  }
  const oldMaxedMode = oldMaxedState.isMaxedMode;
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
      pageRequests: {
        ...state[entityKey][action.paginationKey].pageRequests,
        [pageNumber]: {
          ...pageRequest,
          maxed: newCurrentlyMaxed
        }
      },
      // Once a list is maxed it can never go back, so can't set true to false
      maxedState: {
        ...state[entityKey][action.paginationKey].maxedState,
        isMaxedMode: oldMaxedMode || newMaxedMode
      }
    }
  };
  return {
    ...state,
    [entityKey]: entityState
  };
}

export function paginationIgnoreMaxed(state: PaginationState, ignoreAction: IgnorePaginationMaxedState): PaginationState {
  // Reset the pagination back to default and set the ignoreMaxed flag
  const entityKey = entityCatalog.getEntityKey(ignoreAction);
  const defaultPaginationEntityState = getDefaultPaginationEntityState();
  // Retain the page size, order, etc. We may need to look at this again when applying max to other entity types
  const { q, ...params } = state[entityKey][ignoreAction.paginationKey].params;
  const entityState: PaginationEntityTypeState = {
    ...state[entityKey],
    [ignoreAction.paginationKey]: {
      ...defaultPaginationEntityState,
      clientPagination: {
        ...defaultPaginationEntityState.clientPagination,
        filter: {
          // Retain the original filter. Losing this would leave the list controls in an odd way (see cf users table)
          ...state[entityKey][ignoreAction.paginationKey].clientPagination.filter
        }
      },
      params,
      maxedState: {
        // Retain the original maxed state. This will be true, but is ignored anyway
        ...state[entityKey][ignoreAction.paginationKey].maxedState,
        ignoreMaxed: true,
      }
    }
  };
  return {
    ...state,
    [entityKey]: entityState
  };

}
