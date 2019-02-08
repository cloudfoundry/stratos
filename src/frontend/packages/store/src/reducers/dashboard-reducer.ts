import { SideNavModes } from '../types/dashboard.types';
import { CLOSE_SIDE_NAV, OPEN_SIDE_NAV, TOGGLE_SIDE_NAV, TOGGLE_HEADER_EVENT } from '../actions/dashboard-actions';
import { CHANGE_SIDE_NAV_MODE } from '../actions/dashboard-actions';

export interface DashboardState {
  sidenavOpen: boolean;
  sideNavMode: SideNavModes;
  headerEventMinimized: boolean;
}

export const defaultDashboardState: DashboardState = {
  sidenavOpen: true,
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
    default:
      return state;
  }
}

