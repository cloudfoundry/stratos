import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import type { DashboardState } from '@stratosui/store';

import { DashboardSignalService } from './dashboard-signal.service';

function makeDashboardState(overrides: Partial<DashboardState> = {}): DashboardState {
  return {
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
    homeShowAllEndpoints: null,
    ...overrides,
  } as DashboardState;
}

describe('DashboardSignalService', () => {
  let dashboard$: BehaviorSubject<DashboardState>;

  beforeEach(() => {
    dashboard$ = new BehaviorSubject<DashboardState>(makeDashboardState());
    const stubStore = {
      select: () => dashboard$.asObservable(),
      dispatch: () => undefined,
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Store, useValue: stubStore },
        DashboardSignalService,
      ],
    });
  });

  it('exposes default-shaped dashboard signals', () => {
    const service = TestBed.inject(DashboardSignalService);
    expect(service.isMobile()).toBe(false);
    expect(service.sidenavOpen()).toBe(true);
    expect(service.sideNavPinned()).toBe(true);
    expect(service.gravatarEnabled()).toBe(false);
    expect(service.pollingEnabled()).toBe(true);
    expect(service.homeLayout()).toBe(0);
    expect(service.homeShowAllEndpoints()).toBeNull();
  });

  it('reflects dashboard slice updates through the projected signals', () => {
    dashboard$.next(makeDashboardState({
      isMobile: true,
      isMobileNavOpen: true,
      gravatarEnabled: true,
      homeLayout: 2,
      homeShowAllEndpoints: true,
    }));

    const service = TestBed.inject(DashboardSignalService);
    expect(service.isMobile()).toBe(true);
    expect(service.isMobileNavOpen()).toBe(true);
    expect(service.gravatarEnabled()).toBe(true);
    expect(service.homeLayout()).toBe(2);
    expect(service.homeShowAllEndpoints()).toBe(true);
  });
});
