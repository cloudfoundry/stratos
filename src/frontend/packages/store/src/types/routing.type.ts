import { CFAppState } from '../../../cloud-foundry/src/cf-app-state';

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

export function getPreviousRoutingState(state: CFAppState) {
  return state.routing.previousState;
}
export function getCurrentRoutingState(state: CFAppState) {
  return state.routing.currentState;
}
