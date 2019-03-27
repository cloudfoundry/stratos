import {
  CHANGE_SIDE_NAV_MODE,
  CLOSE_SIDE_NAV,
  OPEN_SIDE_NAV,
  SET_HEADER_EVENT,
  SetHeaderEvent,
  TOGGLE_HEADER_EVENT,
  TOGGLE_SIDE_NAV,
} from '../actions/dashboard-actions';
import { SideNavModes } from '../types/dashboard.types';

export interface DashboardState {
  sidenavOpen: boolean;
  sideNavMode: SideNavModes;
  headerEventMinimized: boolean;
}

export const defaultDashboardState: DashboardState = {
  sidenavOpen: false,
  sideNavMode: 'over',
  headerEventMinimized: false
};

export function dashboardReducer(state: DashboardState = defaultDashboardState, action) {
  switch (action.type) {
    case OPEN_SIDE_NAV:
      return {
        ...state, sidenavOpen: true
      };
    case CLOSE_SIDE_NAV:
      return {
        ...state, sidenavOpen: false
      };
    case TOGGLE_SIDE_NAV:
      return {
        ...state, sidenavOpen: !state.sidenavOpen
      };
    case CHANGE_SIDE_NAV_MODE:
      return {
        ...state, sideNavMode: action.mode
      };
    case TOGGLE_HEADER_EVENT:
      return {
        ...state, headerEventMinimized: !state.headerEventMinimized
      };
    case SET_HEADER_EVENT:
      const setHeaderEvent = action as SetHeaderEvent;
      return {
        ...state, headerEventMinimized: setHeaderEvent.minimised
      };
    default:
      return state;
  }
}

