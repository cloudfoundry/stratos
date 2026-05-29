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

// Polyfill: localStorage for all tests
// jsdom provides localStorage, but we need to ensure it's properly initialized
// Create a complete Storage implementation for tests
class LocalStorageMock implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    // Spec-compliant: the Storage interface returns null for a missing key (real
    // browsers and node's webstorage do). Returning '' here diverged from that and
    // broke `.toBeNull()` assertions once the --localstorage-file flag was dropped.
    return this.store.get(key) ?? null;
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

// Override localStorage and sessionStorage with our mock
// This ensures all tests have a consistent, working storage implementation
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: new LocalStorageMock(),
  });
  Object.defineProperty(window, 'sessionStorage', {
    writable: true,
    value: new LocalStorageMock(),
  });
}

// Mock WebSocket to prevent connection attempts during tests
// This suppresses Vite HMR connection errors that appear in stderr
if (typeof window !== 'undefined' && typeof WebSocket !== 'undefined') {
  const _OriginalWebSocket = WebSocket;
  // Create a mock WebSocket that doesn't actually connect
  class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    CONNECTING = 0;
    OPEN = 1;
    CLOSING = 2;
    CLOSED = 3;

    readyState = MockWebSocket.CLOSED;
    onopen: any = null;
    onclose: any = null;
    onerror: any = null;
    onmessage: any = null;

    constructor(_url: string | URL, _protocols?: string | string[]) {
      // Don't actually connect, just create a closed socket
      this.readyState = MockWebSocket.CLOSED;
      // Immediately trigger close event to simulate failed connection
      setTimeout(() => {
        if (this.onclose) {
          this.onclose(new Event('close'));
        }
      }, 0);
    }

    send(_data: any): void {
      // No-op
    }

    close(_code?: number, _reason?: string): void {
      this.readyState = MockWebSocket.CLOSED;
    }

    addEventListener(_type: string, _listener: any): void {
      // No-op
    }

    removeEventListener(_type: string, _listener: any): void {
      // No-op
    }

    dispatchEvent(_event: Event): boolean {
      return false;
    }
  }

  // Replace WebSocket with mock
  (window as any).WebSocket = MockWebSocket;
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

// Suppress network connection errors in test environment
// Vite HMR and other services may try to connect during tests, causing noisy stderr output
// We suppress these specific errors to keep test output clean
if (typeof console !== 'undefined') {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = function(...args: any[]) {
    const str = args.join(' ');
    // Suppress ECONNREFUSED errors to localhost:3000 (Vite HMR)
    if (str.includes('ECONNREFUSED') && (str.includes('127.0.0.1:3000') || str.includes('::1:3000'))) {
      return; // Suppress this error
    }
    if (str.includes('AggregateError') && args.length > 0 && typeof args[0] === 'object') {
      // Check if this is an AggregateError with ECONNREFUSED errors
      const errors = args[0]?.errors || [];
      const allConnectionErrors = errors.every((e: any) =>
        e?.message?.includes('ECONNREFUSED') &&
        (e?.message?.includes('127.0.0.1:3000') || e?.message?.includes('::1:3000'))
      );
      if (allConnectionErrors && errors.length > 0) {
        return; // Suppress this AggregateError
      }
    }
    return originalConsoleError.apply(console, args);
  };

  console.warn = function(...args: any[]) {
    const str = args.join(' ');
    // Suppress ECONNREFUSED warnings to localhost:3000
    if (str.includes('ECONNREFUSED') && (str.includes('127.0.0.1:3000') || str.includes('::1:3000'))) {
      return; // Suppress this warning
    }
    return originalConsoleWarn.apply(console, args);
  };
}

// Setup snapshots
import('@analogjs/vitest-angular/setup-snapshots').catch(() => {
  // Silently ignore if not available
});
