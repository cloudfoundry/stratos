import { DashboardState } from './../reducers/dashboard-reducer';
import { AppState } from '../app-state';
import { compose } from '@ngrx/store';

const getSideNavState = (dashboardState: DashboardState) => dashboardState.sidenavOpen;
const getIsMobile = (dashboardState: DashboardState) => dashboardState.isMobile;

export const selectDashboardState = (state: Pick<AppState, 'dashboard'>) => state.dashboard;

export const selectSideNavState = (state: Pick<AppState, 'dashboard'>) => compose(getSideNavState, selectDashboardState)(state);
export const selectIsMobile = (state: Pick<AppState, 'dashboard'>) => compose(getIsMobile, selectDashboardState)(state);


