import { compose } from '@ngrx/store';

import { DashboardOnlyAppState } from '../app-state';
import { DashboardState } from '../types/dashboard.types';

const getSideNavState = (dashboardState: DashboardState) => dashboardState.sidenavOpen;
const getIsMobile = (dashboardState: DashboardState) => dashboardState.isMobile;

export const selectDashboardState = (state: DashboardOnlyAppState) => state.dashboard;

export const selectSideNavState = (state: DashboardOnlyAppState) => compose(getSideNavState, selectDashboardState)(state);
export const selectIsMobile = (state: DashboardOnlyAppState) => compose(getIsMobile, selectDashboardState)(state);


