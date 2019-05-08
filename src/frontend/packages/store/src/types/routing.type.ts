import { RoutesRecognized } from '@angular/router';
import { AppState } from '../app-state';

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

export function getPreviousRoutingState(state: AppState) {
  return state.routing.previousState;
}
export function getCurrentRoutingState(state: AppState) {
  return state.routing.currentState;
}
