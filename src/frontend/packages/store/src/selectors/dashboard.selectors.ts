import { DashboardState } from './../reducers/dashboard-reducer';
import { CFAppState } from '../app-state';
import { compose } from '@ngrx/store';

const getSideNavState = (dashboardState: DashboardState) => dashboardState.sidenavOpen;
const getIsMobile = (dashboardState: DashboardState) => dashboardState.isMobile;

export const selectDashboardState = (state: Pick<CFAppState, 'dashboard'>) => state.dashboard;

export const selectSideNavState = (state: Pick<CFAppState, 'dashboard'>) => compose(getSideNavState, selectDashboardState)(state);
export const selectIsMobile = (state: Pick<CFAppState, 'dashboard'>) => compose(getIsMobile, selectDashboardState)(state);


