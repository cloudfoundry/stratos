import { RoutesRecognized } from '@angular/router';
import { AppState } from '../app-state';

export interface RoutingHistory {
  history: RoutesRecognized[];
  currentEvent?: RoutesRecognized;
  previousEvent?: RoutesRecognized;
}

export const defaultRoutingState: RoutingHistory = {
  history: []
};

export function getPreviousEvent(state: AppState) {
  return state.routing.previousEvent;
}
