export interface DashboardState {
  timeoutSession: boolean;
  pollingEnabled: boolean;
  sidenavOpen: boolean;
  isMobile: boolean;
  isMobileNavOpen: boolean;
  sideNavPinned: boolean;
  themeKey: string;
  headerEventMinimized: boolean;
  gravatarEnabled: boolean;
  homeLayout: number;
  homeShowAllEndpoints: boolean;
}

export const defaultDashboardState: DashboardState = {
  timeoutSession: true,
  pollingEnabled: true,
  sidenavOpen: true,
  isMobile: false,
  isMobileNavOpen: false,
  sideNavPinned: true,
  themeKey: null,
  headerEventMinimized: false,
  gravatarEnabled: false,
  homeLayout: 0,
  homeShowAllEndpoints: null, // Use the default we get from the backend
};
