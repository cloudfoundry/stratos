import { RoutingHistory, defaultRoutingState } from '../types/routing.type';
import { RouterNavigationAction, ROUTER_NAVIGATION } from '@ngrx/router-store';


export function routingReducer(state: RoutingHistory = defaultRoutingState, action: RouterNavigationAction) {
  switch (action.type) {
    case ROUTER_NAVIGATION:
      return {
        history: state.history.concat([action.payload.event]),
        previousEvent: state.history.length > 0 ? state.history[state.history.length - 1] : null,
        currentEvent: action.payload.event

      };
    default:
      return state;
  }
}
