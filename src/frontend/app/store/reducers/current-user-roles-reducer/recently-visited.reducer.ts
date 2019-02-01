import { TRecentlyVisitedState } from '../../types/recently-visited.types';
import { AddRecentlyVisitedEntityAction } from '../../actions/recently-visited.actions';

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
