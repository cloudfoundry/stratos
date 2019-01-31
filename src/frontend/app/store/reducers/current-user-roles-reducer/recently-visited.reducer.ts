import { TRecentlyVisitedState } from '../../types/recently-visited.types';
import { AddRecentlyVisitedEntityAction } from '../../actions/recently-visited.reducer';

export function recentlyVisitedReducer(
  state: TRecentlyVisitedState = [],
  action: AddRecentlyVisitedEntityAction
): TRecentlyVisitedState {
  if (action.type === AddRecentlyVisitedEntityAction.ACTION_TYPE) {
    return [
      action.recentlyVisited,
      ...state,
    ];
  }
  return state;
}
