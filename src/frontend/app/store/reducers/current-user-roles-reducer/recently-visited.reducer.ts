import { TRecentlyVisitedState } from '../../types/recently-visited.types';
import { AddRecentlyVisitedEntityAction } from '../../actions/recently-visited.actions';

const MAX_RECENT_COUNT = 500;

export function recentlyVisitedReducer(
  state: TRecentlyVisitedState = [],
  action: AddRecentlyVisitedEntityAction
): TRecentlyVisitedState {
  if (action.type === AddRecentlyVisitedEntityAction.ACTION_TYPE) {
    return [
      action.recentlyVisited,
      ...trimRecent(state),
    ];
  }
  return state;
}

function trimRecent(state: TRecentlyVisitedState) {
  if (state.length > MAX_RECENT_COUNT) {
    return state.slice(0, MAX_RECENT_COUNT - 1);
  }
  return state;
}
