import { Injectable, Signal, inject } from '@angular/core';

import { DashboardDataService, DashboardState } from '../dashboard-data.service';

/**
 * Signal-native facade over {@link DashboardDataService}. Preserves the
 * legacy import path and per-field signal API for existing dashboard
 * consumers; new code should inject `DashboardDataService` directly.
 */
@Injectable({ providedIn: 'root' })
export class DashboardSignalService {
  private dashboardData = inject(DashboardDataService);

  readonly dashboard: Signal<DashboardState> = this.dashboardData.state;

  readonly isMobile = this.dashboardData.isMobile;
  readonly isMobileNavOpen = this.dashboardData.isMobileNavOpen;
  readonly sidenavOpen = this.dashboardData.sidenavOpen;
  readonly sideNavPinned = this.dashboardData.sideNavPinned;
  readonly headerEventMinimized = this.dashboardData.headerEventMinimized;
  readonly gravatarEnabled = this.dashboardData.gravatarEnabled;
  readonly pollingEnabled = this.dashboardData.pollingEnabled;
  readonly timeoutSession = this.dashboardData.timeoutSession;
  readonly homeLayout = this.dashboardData.homeLayout;
  readonly homeShowAllEndpoints = this.dashboardData.homeShowAllEndpoints;
}
