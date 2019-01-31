import { TRecentlyVisited } from '../../types/recently-visited.types';
import { AddRecentlyVisitedEntityAction } from '../../actions/recently-visited.reducer';

export function recentlyVisitedReducer(
  state: TRecentlyVisited = [],
  action: AddRecentlyVisitedEntityAction
): TRecentlyVisited {
  if (action.type === AddRecentlyVisitedEntityAction.ACTION_TYPE) {
    return [
      action.recentlyVisited,
      ...state,
    ];
  }
  return state;
}
