// Vitest + Angular testing setup (Zoneless - Angular 20)
// Official configuration from https://analogjs.org/docs/features/testing/vitest

import { expect, afterEach } from 'vitest';
import '@angular/compiler';
import { provideZonelessChangeDetection, NgModule } from '@angular/core';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { getTestBed } from '@angular/core/testing';

// Polyfill: window.matchMedia for tests
// Components that use media queries need matchMedia to be available
if (typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated but still used by some code
      removeListener: () => {}, // deprecated but still used by some code
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
}

@NgModule({
  providers: [provideZonelessChangeDetection()],
})
export class ZonelessTestModule {}

// Guard to prevent NG0400: platform re-initialization error
// Only initialize test environment once across all test files
// Use a global flag to track initialization across test files in the same process
const globalThis_any = globalThis as any;
if (!globalThis_any.__STRATOS_TEST_ENVIRONMENT_INITIALIZED__) {
  globalThis_any.__STRATOS_TEST_ENVIRONMENT_INITIALIZED__ = true;
  const testBed = getTestBed();
  testBed.initTestEnvironment(
    [BrowserTestingModule, ZonelessTestModule],
    platformBrowserTesting(),
    {
      // Fix for Angular 20 zoneless + Vitest: properly destroy TestBed after each test
      // to prevent circular dependency errors when TestBed is reused across tests
      teardown: { destroyAfterEach: true },
    }
  );
}

// Setup snapshots AFTER TestBed initialization
// expect must be available globally before setup-snapshots tries to use it
import('@analogjs/vitest-angular/setup-snapshots').catch(() => {
  // Silently ignore if setup-snapshots not available (older AnalogJS versions)
});

// Global cleanup hook to reset TestBed between tests
// This clears component/service instances but preserves the platform
afterEach(() => {
  getTestBed().resetTestingModule();
});
