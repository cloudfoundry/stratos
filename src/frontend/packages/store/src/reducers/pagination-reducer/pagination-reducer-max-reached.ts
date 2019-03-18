import { UpdatePaginationMaxedState } from '../../actions/pagination.actions';
import { PaginationEntityTypeState, PaginationState } from '../../types/pagination.types';

export function paginationMaxReached(state: PaginationState, action): PaginationState {
  const maxAction: UpdatePaginationMaxedState = action as UpdatePaginationMaxedState;

  if (!state[maxAction.entityKey] || !state[maxAction.entityKey][maxAction.paginationKey]) {
    return state;
  }

  const { currentlyMaxed: oldCurrentlyMaxed, maxedMode: oldMaxedMode } = state[maxAction.entityKey][maxAction.paginationKey];
  const newCurrentlyMaxed = maxAction.allEntities > maxAction.max;
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
      currentlyMaxed: newCurrentlyMaxed,
      // Once a list is maxed it can never go back, so can't set true to false
      maxedMode: oldMaxedMode || newMaxedMode
    }
  };
  return {
    ...state,
    [action.entityKey]: entityState
  };
}
