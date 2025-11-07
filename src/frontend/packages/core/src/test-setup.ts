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
import { entityCatalog, TestEntityCatalog } from '@stratosui/store';


// Polyfill: window.matchMedia for tests
// StratosThemeService and other components use matchMedia for responsive design
if (typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => { }, // deprecated but still used by some code
      removeListener: () => { }, // deprecated but still used by some code
      addEventListener: () => { },
      removeEventListener: () => { },
      dispatchEvent: () => true,
    }),
  });
}

// Polyfill: document.queryCommandSupported for tests
// Copy-to-Clipboard component uses this to check if 'copy' command is supported
// queryCommandSupported is deprecated but still used in legacy code
// In test environment (jsdom), we need to provide a mock implementation
if (typeof document !== 'undefined' && !document.queryCommandSupported) {
  document.queryCommandSupported = function (command: string): boolean {
    // Return true for 'copy' command which is used by copy-to-clipboard component
    // Return false for other deprecated commands
    return command === 'copy';
  };
}

// Polyfill: localStorage for tests
// Ensure localStorage has all required methods (jsdom may not provide complete implementation)
// This is also defined in workspace setup but duplicated here for package-level isolation
class LocalStorageMock implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    // Return empty string instead of null to avoid issues with code that doesn't handle null
    // This is a test-friendly behavior while still being technically compliant with Storage interface
    return this.store.get(key) ?? '';
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

// Override localStorage and sessionStorage if not properly available
if (typeof window !== 'undefined') {
  // Only override if localStorage doesn't have proper methods
  if (!window.localStorage || typeof window.localStorage.getItem !== 'function') {
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: new LocalStorageMock(),
    });
  }
  if (!window.sessionStorage || typeof window.sessionStorage.getItem !== 'function') {
    Object.defineProperty(window, 'sessionStorage', {
      writable: true,
      value: new LocalStorageMock(),
    });
  }
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
import('@analogjs/vitest-angular/setup-snapshots').catch(() => {
  // Silently ignore if setup-snapshots not available (older AnalogJS versions)
});
