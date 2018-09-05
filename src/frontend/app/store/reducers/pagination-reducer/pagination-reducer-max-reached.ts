import { PaginationMaxResults } from '../../actions/pagination.actions';
import { PaginationState } from '../../types/pagination.types';

export function paginationMaxReached(state: PaginationState, action): PaginationState {
  const maxAction: PaginationMaxResults = action as PaginationMaxResults;

  if (!state[maxAction.entityKey] || !state[maxAction.entityKey][maxAction.paginationKey]) {
    return state;
  }

  if (state[maxAction.entityKey][maxAction.paginationKey].maxResults === maxAction.maxReached) {
    return state;
  }

  const newState = { ...state };
  const entityState = {
    ...newState[action.entityKey],
    [action.paginationKey]: {
      ...newState[action.entityKey][action.paginationKey],
      maxResults: maxAction.maxReached
    }
  };
  return {
    ...newState,
    [action.entityKey]: entityState
  };
}
