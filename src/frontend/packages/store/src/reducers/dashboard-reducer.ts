import { GRAVATAR_ENABLED, SetGravatarEnabledAction } from './../actions/dashboard-actions';
import {
  CLOSE_SIDE_NAV,
  DISABLE_SIDE_NAV_MOBILE_MODE,
  ENABLE_POLLING,
  ENABLE_SIDE_NAV_MOBILE_MODE,
  HYDRATE_DASHBOARD_STATE,
  HydrateDashboardStateAction,
  OPEN_SIDE_NAV,
  SET_STRATOS_THEME,
  SetPollingEnabledAction,
  SetSessionTimeoutAction,
  SetThemeAction,
  TIMEOUT_SESSION,
  TOGGLE_SIDE_NAV,
} from '../actions/dashboard-actions';

export interface DashboardState {
  timeoutSession: boolean;
  pollingEnabled: boolean;
  sidenavOpen: boolean;
  isMobile: boolean;
  isMobileNavOpen: boolean;
  sideNavPinned: boolean;
  themeKey: string;
  headerEventMinimized: boolean;
  gravatarEnabled: boolean;
}

export const defaultDashboardState: DashboardState = {
  timeoutSession: true,
  pollingEnabled: true,
  sidenavOpen: true,
  isMobile: false,
  isMobileNavOpen: false,
  sideNavPinned: true,
  themeKey: null,
  headerEventMinimized: false,
  gravatarEnabled: false,
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
    case GRAVATAR_ENABLED:
      const gravatarAction = action as SetGravatarEnabledAction;
      return {
        ...state,
        gravatarEnabled: gravatarAction.enableGravatar
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
        themeKey: setThemeAction.theme ? setThemeAction.theme.key : null
      };
    default:
      return state;
  }
}

