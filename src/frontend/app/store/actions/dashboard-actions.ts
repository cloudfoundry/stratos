import { SideNavModes } from '../types/dashboard.types';
import { Action } from '@ngrx/store';

export const OPEN_SIDE_NAV = '[Dashboard] Open side nav';
export const CLOSE_SIDE_NAV = '[Dashboard] Close side nav';
export const TOGGLE_SIDE_NAV = '[Dashboard] Toggle side nav';
export const CHANGE_SIDE_NAV_MODE = '[Dashboard] Change side nav mode';
export const TOGGLE_HEADER_EVENT = '[Dashboard] Toggle header event';

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
