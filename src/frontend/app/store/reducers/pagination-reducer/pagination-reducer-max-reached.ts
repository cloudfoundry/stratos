import { PaginationMaxedResults } from '../../actions/pagination.actions';
import { PaginationState } from '../../types/pagination.types';

export function paginationMaxReached(state: PaginationState, action): PaginationState {
  const maxAction: PaginationMaxedResults = action as PaginationMaxedResults;

  if (!state[maxAction.entityKey] || !state[maxAction.entityKey][maxAction.paginationKey]) {
    return state;
  }

  if (state[maxAction.entityKey][maxAction.paginationKey].maxedResults) {
    // Once a list is maxed it can never go back
    return state;
  }

  const newState = { ...state };
  const entityState = {
    ...newState[action.entityKey],
    [action.paginationKey]: {
      ...newState[action.entityKey][action.paginationKey],
      maxedResults: maxAction.maxReached
    }
  };
  return {
    ...newState,
    [action.entityKey]: entityState
  };
}
