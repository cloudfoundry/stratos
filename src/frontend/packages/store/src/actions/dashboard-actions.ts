import { Action } from '@ngrx/store';

import { DashboardState } from '../reducers/dashboard-reducer';

export const OPEN_SIDE_NAV = '[Dashboard] Open side nav';
export const CLOSE_SIDE_NAV = '[Dashboard] Close side nav';
export const TOGGLE_SIDE_NAV = '[Dashboard] Toggle side nav';
export const TOGGLE_HEADER_EVENT = '[Dashboard] Toggle header event';
export const SET_HEADER_EVENT = '[Dashboard] Set header event';

export const ENABLE_SIDE_NAV_MOBILE_MODE = '[Dashboard] Enable mobile nav';
export const DISABLE_SIDE_NAV_MOBILE_MODE = '[Dashboard] Disable mobile nav';

export const SHOW_SIDE_HELP = '[Dashboard] Show side help';
export const CLOSE_SIDE_HELP = '[Dashboard] Close side help';


export const TIMEOUT_SESSION = '[Dashboard] Timeout Session';
export const ENABLE_POLLING = '[Dashboard] Enable Polling';

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

export class ToggleHeaderEvent implements Action {
  type = TOGGLE_HEADER_EVENT;
}

export class ShowSideHelp implements Action {
  constructor(public document: string) { }
  type = SHOW_SIDE_HELP;
}

export class CloseSideHelp implements Action {
  type = CLOSE_SIDE_HELP;
}

export class SetHeaderEvent implements Action {
  constructor(public minimised = false) { }
  type = SET_HEADER_EVENT;
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

export class HydrateDashboardStateAction implements Action {
  constructor(public dashboardState: DashboardState) { }
  type = HYDRATE_DASHBOARD_STATE;
}

