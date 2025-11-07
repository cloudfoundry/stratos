// Vitest + Angular testing setup (Zoneless - Angular 20)
// Official configuration from https://analogjs.org/docs/features/testing/vitest

import { expect, describe, it, afterEach } from 'vitest';
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
import { entityCatalog, TestEntityCatalog } from './entity-catalog/entity-catalog';

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

// Suppress entity catalog warnings in tests
// These warnings occur when test data references CF entities that aren't registered
// This is expected behavior for unit tests that use mock data
if (typeof window !== 'undefined') {
  (window as any).__STRATOS_ENTITY_CATALOG_DEBUG__ = {
    enabled: false,  // Disable debug warnings for missing entities
    logLookups: false,
    logRegistrations: false,
    logMissingEntities: false,
  };
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
import('@analogjs/vitest-angular/setup-snapshots').catch(() => {
  // Silently ignore if setup-snapshots not available (older AnalogJS versions)
});

// Global cleanup hook is NOT needed here because:
// 1. teardown: { destroyAfterEach: true } handles module cleanup automatically
// 2. Manual resetTestingModule() can cause issues with test isolation
// 3. Vitest fork pool with singleFork: true ensures clean state between test files
