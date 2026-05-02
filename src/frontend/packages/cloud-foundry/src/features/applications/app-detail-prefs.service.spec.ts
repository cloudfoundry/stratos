import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

import { AppDetailPrefs } from './app-detail-prefs.service';

/**
 * Helper: sets up TestBed with a real MockStore whose dashboard slice carries
 * the given pollingEnabled value, then returns the injected AppDetailPrefs.
 *
 * Each test gets a fresh module because the global afterEach (in test-setup.ts)
 * calls TestBed.resetTestingModule(), so the beforeEach below runs against a
 * clean slate for every test.
 */
describe('AppDetailPrefs — pollingEnabled=true (or undefined)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AppDetailPrefs,
        provideMockStore({ initialState: { dashboard: { pollingEnabled: true } } }),
        ...STORE_TEST_PROVIDERS,
      ],
    });
  });

  it('uses defaults: idle 45, active 5, enabled true', () => {
    const prefs = TestBed.inject(AppDetailPrefs);
    expect(prefs.idleSeconds()).toBe(45);
    expect(prefs.activeSeconds()).toBe(5);
    expect(prefs.enabled()).toBe(true);
  });

  it('treats explicit dashboard pollingEnabled=true as enabled', () => {
    const prefs = TestBed.inject(AppDetailPrefs);
    expect(prefs.enabled()).toBe(true);
  });
});

/**
 * Isolated describe block for the pollingEnabled=false case. Needs its own
 * beforeEach so the MockStore initialState is `false` at construction time —
 * the legacy bridge reads the store exactly once in the constructor.
 */
describe('AppDetailPrefs — pollingEnabled=false', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AppDetailPrefs,
        provideMockStore({ initialState: { dashboard: { pollingEnabled: false } } }),
        ...STORE_TEST_PROVIDERS,
      ],
    });
  });

  it('disables polling when dashboardState.pollingEnabled is false', () => {
    const prefs = TestBed.inject(AppDetailPrefs);
    expect(prefs.enabled()).toBe(false);
  });
});
