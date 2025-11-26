// Vitest + Angular testing setup (Zoneless - Angular 20)
// Official configuration from https://analogjs.org/docs/features/testing/vitest

import { expect, describe, it, afterEach } from 'vitest';
// IMMEDIATE: Expose vitest globals to window for entity-catalog test detection
// This MUST happen before any Angular/Store imports that check window.describe
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).describe = describe;
  (window as unknown as Record<string, unknown>).it = it;
  (window as unknown as Record<string, unknown>).expect = expect;

  // IMMEDIATE: Suppress console.error for WebSocket connection failures in tests
  // This must be set up BEFORE any component initialization
  if (typeof console !== 'undefined' && console.error) {
    const originalConsoleError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      const firstArg = args[0];
      const message = typeof firstArg === 'string' ? firstArg : '';

      // Filter WebSocket connection errors in tests (first arg is the message string)
      if (message.includes('Log stream connection failed')) {
        return; // Silently skip WebSocket connection errors in test environment
      }

      // Filter WebSocket connection errors when second arg is the error object
      if (args.length >= 2 && typeof args[1] === 'object' && args[1] !== null && 'code' in args[1] && args[1].code === 'WEBSOCKET_FAILED') {
        return; // Silently skip WebSocket connection errors in test environment
      }

      // Pass all other errors through
      return originalConsoleError(...args);
    };
  }
}

import '@angular/compiler';
import { provideZonelessChangeDetection, NgModule } from '@angular/core';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { getTestBed } from '@angular/core/testing';
import { entityCatalog, type TestEntityCatalog } from '@stratosui/store';

// Polyfill: window.matchMedia for tests
// Components that use media queries need matchMedia to be available
if (typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null as ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null,
      addListener: () => { }, // deprecated but still used by some code
      removeListener: () => { }, // deprecated but still used by some code
      addEventListener: () => { },
      removeEventListener: () => { },
      dispatchEvent: () => true,
    } as MediaQueryList),
  });
}

@NgModule({
  providers: [provideZonelessChangeDetection()],
})
export class ZonelessTestModule { }

// Initialize TestBed platform
// Note: With isolate:false, this runs once and is shared across test files
const testBed = getTestBed();
if (!testBed.platform) {
  testBed.initTestEnvironment(
    [BrowserTestingModule, ZonelessTestModule],
    platformBrowserTesting(),
    {
      teardown: { destroyAfterEach: true },
    }
  );
}

// Reset TestBed after each test to clean up component instances
// but preserve the platform for performance
afterEach(() => {
  getTestBed().resetTestingModule();

  // Clear entity catalog to prevent duplicate entity warnings
  // The entityCatalog is a singleton that persists across tests,
  // so we need to clear it between tests to avoid accumulation
  const testCatalog = entityCatalog as TestEntityCatalog;
  if (testCatalog && typeof testCatalog.clear === 'function') {
    testCatalog.clear();
  }
});


// Setup snapshots AFTER TestBed initialization
// expect must be available globally before setup-snapshots tries to use it
// Note: Using dynamic require since setup-snapshots.d.ts is not a module
try {
  require('@analogjs/vitest-angular/setup-snapshots');
} catch {
  // Silently ignore if setup-snapshots not available (older AnalogJS versions)
}
