import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { DashboardDataService } from './dashboard-data.service';

describe('DashboardDataService', () => {
  const storageKey = 'stratos-norm-test';
  let service: DashboardDataService;

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), DashboardDataService],
    });
    service = TestBed.inject(DashboardDataService);
  });

  describe('hydrateFromStorage', () => {
    it('restores persisted preferences', () => {
      service.hydrateFromStorage(storageKey, JSON.stringify({ homeLayout: 3, gravatarEnabled: true }));

      expect(service.homeLayout()).toBe(3);
      expect(service.gravatarEnabled()).toBe(true);
    });

    it('keeps the measured viewport state when storage disagrees', () => {
      // The breakpoint observer runs before SESSION_VERIFIED, so the viewport
      // is already measured by the time prefs arrive. A stale isMobile in
      // storage must not put a desktop window back into the mobile layout.
      service.disableMobileNav();

      service.hydrateFromStorage(storageKey, JSON.stringify({ isMobile: true, isMobileNavOpen: true }));

      expect(service.isMobile()).toBe(false);
      expect(service.isMobileNavOpen()).toBe(false);
    });

    it('keeps the measured viewport state on a narrow window too', () => {
      service.enableMobileNav();

      service.hydrateFromStorage(storageKey, JSON.stringify({ isMobile: false }));

      expect(service.isMobile()).toBe(true);
    });
  });

  it('never writes viewport state to storage', () => {
    service.hydrateFromStorage(storageKey, null);
    service.enableMobileNav();
    service.setHomeLayout(2);

    const written = JSON.parse(localStorage.getItem(storageKey) as string);
    expect(written.homeLayout).toBe(2);
    expect(written).not.toHaveProperty('isMobile');
    expect(written).not.toHaveProperty('isMobileNavOpen');
  });
});
