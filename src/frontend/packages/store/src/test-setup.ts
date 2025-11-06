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

// Initialize test environment - ONCE per test run
// In singleFork mode, setupFiles executes for each test file, but we only want ONE initialization
// Use a module-level flag (more reliable than globalThis in fork pool mode)
let __testEnvInitialized = false;

if (!__testEnvInitialized) {
  getTestBed().initTestEnvironment(
    [BrowserTestingModule, ZonelessTestModule],
    platformBrowserTesting(),
    {
      // Fix for Angular 20 zoneless + Vitest: properly destroy TestBed after each test
      // to prevent circular dependency errors when TestBed is reused across tests
      teardown: { destroyAfterEach: true },
    }
  );
  __testEnvInitialized = true;
}

// Setup snapshots AFTER TestBed initialization
// expect must be available globally before setup-snapshots tries to use it
import('@analogjs/vitest-angular/setup-snapshots').catch(() => {
  // Silently ignore if setup-snapshots not available (older AnalogJS versions)
});

// Global cleanup hook is NOT needed here because:
// 1. teardown: { destroyAfterEach: true } handles module cleanup automatically
// 2. Manual resetTestingModule() can cause issues with test isolation
// 3. Vitest fork pool with singleFork: true ensures clean state between test files
