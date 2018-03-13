import { RoutesRecognized } from '@angular/router';

export interface RoutingHistory {
  history: RoutesRecognized[];
  currentEvent?: RoutesRecognized;
  previousEvent?: RoutesRecognized;
}

export const defaultRoutingState: RoutingHistory = {
  history: []
};
