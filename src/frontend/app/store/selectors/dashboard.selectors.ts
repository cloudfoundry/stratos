import { DashboardState } from './../reducers/dashboard-reducer';
import { AppState } from '../app-state';
import { compose } from '@ngrx/store';

const getSideNavState = (dashboardState: DashboardState) => dashboardState.sidenavOpen;

export const selectDashboardState = (state: AppState) => state.dashboard;

export const selectSideNavState = (state: AppState) => compose(getSideNavState, selectDashboardState)(state);


