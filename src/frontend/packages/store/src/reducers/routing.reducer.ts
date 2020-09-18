import { ROUTER_NAVIGATION, RouterNavigationAction } from '@ngrx/router-store';

import { defaultRoutingState, RoutingHistory } from '../types/routing.type';

export interface RouterRedirect {
  path: string;
  queryParams?: {
    [key: string]: string
  };
}

export function routingReducer(state: RoutingHistory = defaultRoutingState, action: RouterNavigationAction) {
  switch (action.type) {
    case ROUTER_NAVIGATION:
      // Check that the route actually changed - don't update the state if it did not
      // This catches the case for the Dynamic Extensions where we have to redirect to the route
      // Which would otherwise set the previous state to the same state as the current state
      const destUrl = action.payload.event.url;
      const currentUrl = state.currentState ? state.currentState.url : null;
      if (destUrl === currentUrl) {
        return state;
      }

      // This changed in Angular 9 - state no longer embdedded
      // This deduplicated the rotuerState
      // We will keep it as before
      return {
        // ATM don't track change of route history
        // history: state.history.concat([action.payload.event]),
        previousState: state.currentState ? state.currentState : null,
        currentState: {
          ...action.payload.event,
          state: action.payload.routerState
        }
      };

    default:
      return state;
  }
}
