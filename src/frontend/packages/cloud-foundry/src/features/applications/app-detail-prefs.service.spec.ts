import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { DashboardDataService } from '../../../../core/src/core/dashboard-data.service';
import { AppDetailPrefs } from './app-detail-prefs.service';

describe('AppDetailPrefs — pollingEnabled=true (or undefined)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        DashboardDataService,
        AppDetailPrefs,
      ],
    });
  });

  it('uses defaults: idle 45, active 5, enabled true', () => {
    const prefs = TestBed.inject(AppDetailPrefs);
    expect(prefs.idleSeconds()).toBe(45);
    expect(prefs.activeSeconds()).toBe(5);
    expect(prefs.enabled()).toBe(true);
  });

  it('treats default dashboardData.pollingEnabled=true as enabled', () => {
    const prefs = TestBed.inject(AppDetailPrefs);
    expect(prefs.enabled()).toBe(true);
  });
});

describe('AppDetailPrefs — pollingEnabled=false', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        DashboardDataService,
        AppDetailPrefs,
      ],
    });
    // Seed the dashboard data service to disabled BEFORE AppDetailPrefs
    // is constructed (its constructor reads the value once).
    const data = TestBed.inject(DashboardDataService);
    data.setPollingEnabled(false);
  });

  it('disables polling when dashboardData.pollingEnabled is false', () => {
    const prefs = TestBed.inject(AppDetailPrefs);
    expect(prefs.enabled()).toBe(false);
  });
});
