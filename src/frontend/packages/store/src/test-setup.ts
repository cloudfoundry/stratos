// Vitest + Angular testing setup (Zoneless - Angular 20)
// Official configuration from https://analogjs.org/docs/features/testing/vitest

import { expect, afterEach } from 'vitest';
// IMMEDIATE: Expose vitest globals to window for entity-catalog test detection
// This MUST happen before any Angular/Store imports that check window.describe
if (typeof window !== 'undefined') {
  (window as any).expect = expect;
}

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

// Initialize TestBed platform
// Note: With isolate:false, this runs once and is shared across test files
console.log('[TEST SETUP - STORE] Checking TestBed platform...');
const testBed = getTestBed();
if (!testBed.platform) {
  console.log('[TEST SETUP - STORE] Initializing TestBed platform...');
  testBed.initTestEnvironment(
    [BrowserTestingModule, ZonelessTestModule],
    platformBrowserTesting(),
    {
      teardown: { destroyAfterEach: true },
    }
  );
  console.log('[TEST SETUP - STORE] ✅ TestBed platform initialized');
} else {
  console.log('[TEST SETUP - STORE] TestBed platform already initialized (shared)');
}

// Reset TestBed after each test to clean up component instances
// but preserve the platform for performance
afterEach(() => {
  getTestBed().resetTestingModule();
});

// Setup snapshots AFTER TestBed initialization
// expect must be available globally before setup-snapshots tries to use it
import('@analogjs/vitest-angular/setup-snapshots').catch(() => {
  // Silently ignore if setup-snapshots not available (older AnalogJS versions)
});

// Global cleanup hook is NOT needed here because:
// 1. teardown: { destroyAfterEach: true } handles module cleanup automatically
// 2. Manual resetTestingModule() can cause issues with test isolation
// 3. Vitest fork pool with singleFork: true ensures clean state between test files
