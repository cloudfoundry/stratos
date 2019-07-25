import { AppRoutingOnlyAppState } from '../app-state';

export interface RoutingEvent {
  id: number;
  url: string;
  urlAfterRedirects: string;
  state: {
    url: string;
    params: {
      [key: string]: string;
    }
    queryParams: {
      [key: string]: string;
    }
  };
}
export interface RoutingHistory {
  history?: RoutingEvent[];
  currentState: RoutingEvent;
  previousState?: RoutingEvent;
}

export const defaultRoutingState: RoutingHistory = {
  currentState: null
};

export function getPreviousRoutingState(state: AppRoutingOnlyAppState) {
  return state.routing.previousState;
}
export function getCurrentRoutingState(state: AppRoutingOnlyAppState) {
  return state.routing.currentState;
}
