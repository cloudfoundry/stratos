import { Action } from '@ngrx/store';

import { DashboardState } from '../reducers/dashboard-reducer';
import { StratosTheme } from '../types/theme.types';

export const OPEN_SIDE_NAV = '[Dashboard] Open side nav';
export const CLOSE_SIDE_NAV = '[Dashboard] Close side nav';
export const TOGGLE_SIDE_NAV = '[Dashboard] Toggle side nav';

export const ENABLE_SIDE_NAV_MOBILE_MODE = '[Dashboard] Enable mobile nav';
export const DISABLE_SIDE_NAV_MOBILE_MODE = '[Dashboard] Disable mobile nav';

export const TIMEOUT_SESSION = '[Dashboard] Timeout Session';
export const ENABLE_POLLING = '[Dashboard] Enable Polling';
export const SET_STRATOS_THEME = '[Dashboard] Set Theme';
export const GRAVATAR_ENABLED = '[Dashboard] Gravatar ENabled';

export const HYDRATE_DASHBOARD_STATE = '[Dashboard] Hydrate dashboard state';

export const SET_PLUGIN_DASHBOARD_VALUE = '[Dashboard] Set Plugin Dashboard Value';

export class OpenSideNav implements Action {
  constructor() { }
  type = OPEN_SIDE_NAV;
}

export class CloseSideNav implements Action {
  constructor() { }
  type = CLOSE_SIDE_NAV;
}

export class ToggleSideNav implements Action {
  constructor() { }
  type = TOGGLE_SIDE_NAV;
}

export class EnableMobileNav implements Action {
  type = ENABLE_SIDE_NAV_MOBILE_MODE;
}

export class DisableMobileNav implements Action {
  type = DISABLE_SIDE_NAV_MOBILE_MODE;
}

export class SetSessionTimeoutAction implements Action {
  constructor(public timeoutSession = true) { }
  type = TIMEOUT_SESSION;
}

export class SetPollingEnabledAction implements Action {
  constructor(public enablePolling = true) { }
  type = ENABLE_POLLING;
}

export class SetGravatarEnabledAction implements Action {
  constructor(public enableGravatar = true) { }
  type = GRAVATAR_ENABLED;
}
export class HydrateDashboardStateAction implements Action {
  constructor(public dashboardState: DashboardState) { }
  type = HYDRATE_DASHBOARD_STATE;
}

export class SetThemeAction implements Action {
  constructor(public theme: StratosTheme) { }
  type = SET_STRATOS_THEME;
}
