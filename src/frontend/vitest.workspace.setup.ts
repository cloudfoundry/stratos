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
import { execSync } from 'node:child_process';
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

// Suppress Vite HMR connection noise in the test environment.
//
// In `vitest run` (the gate / CI) nothing serves the Vite dev server, so the
// Vite client injected into the compiled Angular bundles keeps dialing its
// HMR endpoint on localhost:3000 and logs ECONNREFUSED / "socket hang up"
// (ECONNRESET) — pure noise, swallowed by --dangerouslyIgnoreUnhandledErrors
// (0 test impact), but it clutters the output and reads like a real failure.
//
// Gate the suppression on an actual probe of :3000 (the behaviour Norm asked
// for): when a dev server IS listening there (interactive `vitest` watch
// alongside `make dev`) leave every error visible so a genuine HMR problem
// surfaces; only when nothing is listening do we treat these specific errors
// as the known spurious dial and silence them.
const HMR_NOISE = /(ECONNREFUSED[^\n]*(127\.0\.0\.1|::1|localhost):3000)|(::1:3000)|(socket hang up)|(ECONNRESET)|(socketCloseListener)/;

function devServerListeningOn3000(): boolean {
  // lsof returns non-zero (throws) when nothing is LISTENing; ENOENT if lsof
  // is absent. Either way, treat as "no dev server" → safe to suppress.
  try {
    const out = execSync('lsof -nP -iTCP:3000 -sTCP:LISTEN', {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString();
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

const suppressHmrNoise = !devServerListeningOn3000();

if (suppressHmrNoise && typeof console !== 'undefined') {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = function(...args: any[]) {
    const str = args.join(' ');
    if (HMR_NOISE.test(str)) {
      return; // Suppress Vite HMR connection noise
    }
    if (str.includes('AggregateError') && args.length > 0 && typeof args[0] === 'object') {
      // Check if this is an AggregateError wrapping only HMR connection errors
      const errors = args[0]?.errors || [];
      const allConnectionErrors = errors.every((e: any) => HMR_NOISE.test(e?.message ?? ''));
      if (allConnectionErrors && errors.length > 0) {
        return; // Suppress this AggregateError
      }
    }
    return originalConsoleError.apply(console, args);
  };

  console.warn = function(...args: any[]) {
    const str = args.join(' ');
    if (HMR_NOISE.test(str)) {
      return; // Suppress Vite HMR connection noise
    }
    return originalConsoleWarn.apply(console, args);
  };
}

// The errors above also reach process.stderr directly (Node's default
// unhandled-rejection / socket-error printer bypasses the console patch),
// which is why they still leaked into the gate log. Filter those raw writes
// too — but only the HMR-noise lines, and only when no dev server is up.
// Vitest's own failure reporter formats results separately and never emits
// these socket signatures, so real test failures are unaffected.
if (suppressHmrNoise && typeof process !== 'undefined' && process.stderr && typeof process.stderr.write === 'function') {
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  (process.stderr as any).write = (chunk: any, ...rest: any[]): boolean => {
    try {
      const str = typeof chunk === 'string' ? chunk : chunk?.toString?.() ?? '';
      if (HMR_NOISE.test(str)) {
        const cb = rest[rest.length - 1];
        if (typeof cb === 'function') { cb(); }
        return true; // swallow the HMR connection noise
      }
    } catch {
      // fall through to the original writer on any inspection error
    }
    return (originalStderrWrite as any)(chunk, ...rest);
  };
}

// Setup snapshots
import('@analogjs/vitest-angular/setup-snapshots').catch(() => {
  // Silently ignore if not available
});
