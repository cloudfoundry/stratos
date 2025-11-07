// Vitest + Angular testing setup (Zoneless - Angular 20)
// Official configuration from https://analogjs.org/docs/features/testing/vitest

import { expect, describe, it, afterEach } from 'vitest';
// IMMEDIATE: Expose vitest globals to window for entity-catalog test detection
// This MUST happen before any Angular/Store imports that check window.describe
if (typeof window !== 'undefined') {
  (window as any).describe = describe;
  (window as any).it = it;
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
// StratosThemeService and other components use matchMedia for responsive design
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
console.log('[TEST SETUP - K8S] Checking TestBed platform...');
const testBed = getTestBed();
if (!testBed.platform) {
  console.log('[TEST SETUP - K8S] Initializing TestBed platform...');
  testBed.initTestEnvironment(
    [BrowserTestingModule, ZonelessTestModule],
    platformBrowserTesting(),
    {
      teardown: { destroyAfterEach: true },
    }
  );
  console.log('[TEST SETUP - K8S] ✅ TestBed platform initialized');
} else {
  console.log('[TEST SETUP - K8S] TestBed platform already initialized (shared)');
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
