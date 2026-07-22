import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { DashboardDataService, DashboardState, defaultDashboardState } from '../dashboard-data.service';
import { DashboardSignalService } from './dashboard-signal.service';

function setState(svc: DashboardDataService, overrides: Partial<DashboardState>) {
  // Mutate via setValue (the only public per-key setter on the data
  // service) so the spec exercises the same path consumers do.
  Object.entries(overrides).forEach(([key, value]) => {
    svc.setValue(key as keyof DashboardState, value as DashboardState[keyof DashboardState]);
  });
}

describe('DashboardSignalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        DashboardDataService,
        DashboardSignalService,
      ],
    });
  });

  it('exposes default-shaped dashboard signals', () => {
    const service = TestBed.inject(DashboardSignalService);
    expect(service.isMobile()).toBe(defaultDashboardState.isMobile);
    expect(service.sidenavOpen()).toBe(defaultDashboardState.sidenavOpen);
    expect(service.sideNavPinned()).toBe(defaultDashboardState.sideNavPinned);
    expect(service.gravatarEnabled()).toBe(defaultDashboardState.gravatarEnabled);
    expect(service.pollingEnabled()).toBe(defaultDashboardState.pollingEnabled);
    expect(service.homeLayout()).toBe(defaultDashboardState.homeLayout);
    expect(service.homeShowAllEndpoints()).toBeNull();
  });

  it('reflects DashboardDataService updates through the projected signals', () => {
    const data = TestBed.inject(DashboardDataService);
    const service = TestBed.inject(DashboardSignalService);
    setState(data, {
      isMobile: true,
      isMobileNavOpen: true,
      gravatarEnabled: true,
      homeLayout: 2,
      homeShowAllEndpoints: true,
    });
    expect(service.isMobile()).toBe(true);
    expect(service.isMobileNavOpen()).toBe(true);
    expect(service.gravatarEnabled()).toBe(true);
    expect(service.homeLayout()).toBe(2);
    expect(service.homeShowAllEndpoints()).toBe(true);
  });
});
