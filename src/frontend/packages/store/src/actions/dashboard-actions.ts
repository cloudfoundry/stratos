import { DashboardState } from './../reducers/dashboard-reducer';
import { Action } from '@ngrx/store';

import { SideNavModes } from '../types/dashboard.types';

export const OPEN_SIDE_NAV = '[Dashboard] Open side nav';
export const CLOSE_SIDE_NAV = '[Dashboard] Close side nav';
export const TOGGLE_SIDE_NAV = '[Dashboard] Toggle side nav';
export const CHANGE_SIDE_NAV_MODE = '[Dashboard] Change side nav mode';
export const TOGGLE_HEADER_EVENT = '[Dashboard] Toggle header event';
export const SET_HEADER_EVENT = '[Dashboard] Set header event';

export const TIMEOUT_SESSION = '[Dashboard] Timeout Session';
export const HYDRATE_DASHBOARD_STATE = '[Dashboard] Hydrate dashboard state';

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

export class ChangeSideNavMode implements Action {
  constructor(private mode: SideNavModes) { }
  type = CHANGE_SIDE_NAV_MODE;
}

export class ToggleHeaderEvent implements Action {
  type = TOGGLE_HEADER_EVENT;
}

export class SetHeaderEvent implements Action {
  constructor(public minimised = false) { }
  type = SET_HEADER_EVENT;
}

export class SetSessionTimeoutAction implements Action {
  constructor(public timeoutSession = true) { }
  type = TIMEOUT_SESSION;
}

export class HydrateDashboardStateAction implements Action {
  constructor(public dashboardState: DashboardState) { }
  type = HYDRATE_DASHBOARD_STATE;
}

