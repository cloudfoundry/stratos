// Vitest Workspace-Level Setup
// This runs ONCE globally before any package-specific setup files
// Purpose: Initialize TestBed platform once for entire workspace

console.log('[WORKSPACE SETUP] ===== FILE LOADING =====');
import { expect, describe, it } from 'vitest';
console.log('[WORKSPACE SETUP] Vitest imports loaded');
import '@angular/compiler';
console.log('[WORKSPACE SETUP] Angular compiler loaded');
import { provideZonelessChangeDetection, NgModule } from '@angular/core';
console.log('[WORKSPACE SETUP] Angular core loaded');
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
console.log('[WORKSPACE SETUP] Angular testing loaded');
import { getTestBed } from '@angular/core/testing';
console.log('[WORKSPACE SETUP] All imports complete');

// CRITICAL: Expose vitest globals to window BEFORE any imports
// This ensures entity-catalog test detection works
console.log('[WORKSPACE SETUP] Exposing vitest globals to window...');
if (typeof window !== 'undefined') {
  (window as any).describe = describe;
  (window as any).it = it;
  (window as any).expect = expect;
  console.log('[WORKSPACE SETUP] Vitest globals exposed to window');
} else {
  console.log('[WORKSPACE SETUP] WARNING: window is undefined!');
}

// Polyfill: window.matchMedia for all tests
if (typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
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

// Initialize TestBed platform ONCE for entire workspace
// Individual package setup files will NOT re-initialize
console.log('[WORKSPACE SETUP] Getting TestBed instance...');
const testBed = getTestBed();
console.log('[WORKSPACE SETUP] TestBed.platform exists?', !!testBed.platform);
if (!testBed.platform) {
  console.log('[WORKSPACE SETUP] Initializing TestBed platform for workspace...');
  try {
    testBed.initTestEnvironment(
      [BrowserTestingModule, ZonelessTestModule],
      platformBrowserTesting(),
      {
        teardown: { destroyAfterEach: true },
      }
    );
    console.log('[WORKSPACE SETUP] ✅ TestBed platform initialized successfully');
  } catch (error) {
    console.error('[WORKSPACE SETUP] ❌ ERROR initializing TestBed:', error);
    throw error;
  }
} else {
  console.log('[WORKSPACE SETUP] TestBed platform already initialized (reusing)');
}

// Setup snapshots
import('@analogjs/vitest-angular/setup-snapshots').catch(() => {
  // Silently ignore if not available
});
