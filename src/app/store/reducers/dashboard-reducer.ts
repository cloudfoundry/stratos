import { CLOSE_SIDE_NAV, OPEN_SIDE_NAV, TOGGLE_SIDE_NAV } from '../actions/dashboard-actions';

export interface DashboardState {
    sidenavOpen: boolean;
}

export const defaultDashboardState = {
    sidenavOpen: true
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
        default:
            return state;
    }
}

