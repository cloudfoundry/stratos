import { Action } from '@ngrx/store';

export const OPEN_SIDE_NAV = '[Dashboard] Open side nav';
export const CLOSE_SIDE_NAV = '[Dashboard] Close side nav';
export const TOGGLE_SIDE_NAV = '[Dashboard] Toggle side nav';

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
