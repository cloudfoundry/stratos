import { RoutingHistory, defaultRoutingState } from '../types/routing.type';
import { RouterNavigationAction, ROUTER_NAVIGATION } from '@ngrx/router-store';


export function routingReducer(state: RoutingHistory = defaultRoutingState, action: RouterNavigationAction) {
  switch (action.type) {
    case ROUTER_NAVIGATION:
      return {
        // history: state.history.concat([action.payload.event]),
        previousState: state.currentState ? state.currentState : null,
        currentState: action.payload.event

      };
    default:
      return state;
  }
}
