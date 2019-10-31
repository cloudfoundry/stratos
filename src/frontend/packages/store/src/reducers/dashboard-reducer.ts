import { ThemeService } from '../../../core/src/core/theme.service';
import {
  CLOSE_SIDE_HELP,
  CLOSE_SIDE_NAV,
  DISABLE_SIDE_NAV_MOBILE_MODE,
  ENABLE_POLLING,
  ENABLE_SIDE_NAV_MOBILE_MODE,
  HYDRATE_DASHBOARD_STATE,
  HydrateDashboardStateAction,
  OPEN_SIDE_NAV,
  SET_HEADER_EVENT,
  SET_STRATOS_THEME,
  SetHeaderEvent,
  SetPollingEnabledAction,
  SetSessionTimeoutAction,
  SetThemeAction,
  SHOW_SIDE_HELP,
  TIMEOUT_SESSION,
  TOGGLE_HEADER_EVENT,
  TOGGLE_SIDE_NAV,
} from '../actions/dashboard-actions';

export interface DashboardState {
  timeoutSession: boolean;
  pollingEnabled: boolean;
  sidenavOpen: boolean;
  isMobile: boolean;
  isMobileNavOpen: boolean;
  sideNavPinned: boolean;
  headerEventMinimized: boolean;
  sideHelpOpen: boolean;
  sideHelpDocument: string;
  theme: string;
}

export const defaultDashboardState: DashboardState = {
  timeoutSession: true,
  pollingEnabled: true,
  sidenavOpen: true,
  isMobile: false,
  isMobileNavOpen: false,
  sideNavPinned: true,
  headerEventMinimized: false,
  sideHelpOpen: false,
  sideHelpDocument: null,
  theme: ThemeService.themes[0].key
};

export function dashboardReducer(state: DashboardState = defaultDashboardState, action): DashboardState {
  switch (action.type) {
    case OPEN_SIDE_NAV:
      if (state.isMobile) {
        return { ...state, isMobileNavOpen: true };
      }
      return { ...state, sidenavOpen: true };
    case CLOSE_SIDE_NAV:
      if (state.isMobile) {
        return { ...state, isMobileNavOpen: false };
      }
      return { ...state, sidenavOpen: false };
    case TOGGLE_SIDE_NAV:
      if (state.isMobile) {
        return { ...state, isMobileNavOpen: !state.isMobileNavOpen };
      }
      return { ...state, sidenavOpen: !state.sidenavOpen };
    case ENABLE_SIDE_NAV_MOBILE_MODE:
      return { ...state, isMobile: true, isMobileNavOpen: false };
    case DISABLE_SIDE_NAV_MOBILE_MODE:
      return { ...state, isMobile: false, isMobileNavOpen: false };
    case TOGGLE_HEADER_EVENT:
      return { ...state, headerEventMinimized: !state.headerEventMinimized };
    case SHOW_SIDE_HELP:
      return { ...state, sideHelpOpen: true, sideHelpDocument: action.document };
    case CLOSE_SIDE_HELP:
      return { ...state, sideHelpOpen: false, sideHelpDocument: '' };
    case SET_HEADER_EVENT:
      const setHeaderEvent = action as SetHeaderEvent;
      return {
        ...state, headerEventMinimized: setHeaderEvent.minimised
      };
    case TIMEOUT_SESSION:
      const timeoutSessionAction = action as SetSessionTimeoutAction;
      return {
        ...state,
        timeoutSession: timeoutSessionAction.timeoutSession
      };
    case ENABLE_POLLING:
      const pollingAction = action as SetPollingEnabledAction;
      return {
        ...state,
        pollingEnabled: pollingAction.enablePolling
      };
    case HYDRATE_DASHBOARD_STATE:
      const hydrateDashboardStateAction = action as HydrateDashboardStateAction;
      return {
        ...state,
        ...hydrateDashboardStateAction.dashboardState
      };
    case SET_STRATOS_THEME:
      const setThemeAction = action as SetThemeAction;
      return {
        ...state,
        theme: setThemeAction.theme.key
      };
    default:
      return state;
  }
}

