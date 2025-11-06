// Vitest + Angular testing setup (Zoneless - Angular 20)
// Official configuration from https://analogjs.org/docs/features/testing/vitest

import { expect, describe, it, afterEach } from 'vitest';
import '@angular/compiler';
import { provideZonelessChangeDetection, NgModule } from '@angular/core';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { getTestBed } from '@angular/core/testing';

// Mark window as test environment for entity catalog
// EntityCatalog checks for window.describe to determine test environment
if (typeof window !== 'undefined' && typeof (window as any).describe === 'undefined') {
  // Ensure vitest's describe is accessible from window
  (window as any).describe = describe;
  (window as any).it = it;
  (window as any).expect = expect;
}

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

// Guard to prevent NG0400: platform re-initialization error
// Only initialize test environment once per test file
// Check if platform exists; if so, the environment was already initialized
const testBed = getTestBed();
try {
  if (!testBed.platform) {
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
} catch (e) {
  // If platform initialization fails due to existing platform, that's expected
  // This can happen when running multiple test files with singleFork:true
  if (!(e instanceof Error && e.message.includes('platform with a different configuration'))) {
    throw e;
  }
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
