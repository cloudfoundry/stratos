import { RoutesRecognized } from '@angular/router';
import { AppState } from '../app-state';

export interface RoutingHistory {
  history?: RoutesRecognized[];
  currentState: RoutesRecognized;
  previousState?: RoutesRecognized;
}

export const defaultRoutingState: RoutingHistory = {
  currentState: null
};

export function getPreviousRoutingState(state: AppState) {
  return state.routing.previousState;
}
