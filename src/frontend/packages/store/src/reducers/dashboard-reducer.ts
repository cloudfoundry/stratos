import {
  CLOSE_SIDE_NAV,
  DISABLE_SIDE_NAV_MOBILE_MODE,
  ENABLE_POLLING,
  ENABLE_SIDE_NAV_MOBILE_MODE,
  HYDRATE_DASHBOARD_STATE,
  HydrateDashboardStateAction,
  OPEN_SIDE_NAV,
  SET_DASHBOARD_STATE_VALUE,
  SET_STRATOS_THEME,
  SetDashboardStateValueAction,
  SetPollingEnabledAction,
  SetSessionTimeoutAction,
  SetThemeAction,
  TIMEOUT_SESSION,
  TOGGLE_SIDE_NAV,
} from '../actions/dashboard-actions';
import { DashboardState, defaultDashboardState } from '../types/dashboard.types';
import {
  GRAVATAR_ENABLED,
  HOME_CARD_LAYOUT,
  SetGravatarEnabledAction,
  SetHomeCardLayoutAction,
} from './../actions/dashboard-actions';


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
    case HOME_CARD_LAYOUT:
      const layoutAction = action as SetHomeCardLayoutAction;
      return {
        ...state,
        homeLayout: layoutAction.id
      };
    case SET_DASHBOARD_STATE_VALUE:
      const setValueAction = action as SetDashboardStateValueAction;
      if (state[setValueAction.prop] === setValueAction.value) {
        return state;
      }
      return {
        ...state,
        [setValueAction.prop]: setValueAction.value
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

