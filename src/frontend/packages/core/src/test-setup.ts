// Vitest + Angular testing setup (Zoneless - Angular 20)
// Official configuration from https://analogjs.org/docs/features/testing/vitest

import { expect, describe, it, afterEach } from 'vitest';
// IMMEDIATE: Expose vitest globals to window for entity-catalog test detection
// This MUST happen before any Angular/Store imports that check window.describe
if (typeof window !== 'undefined') {
  (window as any).describe = describe;
  (window as any).it = it;
  (window as any).expect = expect;

  // IMMEDIATE: Suppress console.error for Monaco and other test warnings
  // This must be set up BEFORE any component initialization
  if (typeof console !== 'undefined' && console.error) {
    const originalConsoleError = console.error.bind(console);
    console.error = function (...args: any[]) {
      const firstArg = args[0];
      const message = typeof firstArg === 'string' ? firstArg : String(firstArg || '');
      const messageStr = JSON.stringify(firstArg || '');

      // Filter Monaco editor loading warnings
      if (message && message.includes("Monaco editor is not loaded")) {
        return; // Silently skip Monaco editor warning (we provide a mock)
      }
      // Filter Chart.js errors
      if (message && message.includes("Failed to create chart: can't acquire context from the given item")) {
        return; // Silently skip Chart.js error
      }
      // Filter ECONNREFUSED errors
      if (args[0]?.code === 'ECONNREFUSED' || (firstArg && firstArg.errors && firstArg.errors[0]?.code === 'ECONNREFUSED')) {
        return; // Silently skip connection refused errors during test cleanup
      }
      // Filter WebSocket connection errors in tests
      if (messageStr.includes('WEBSOCKET_FAILED') || messageStr.includes('Log stream connection failed')) {
        return; // Silently skip WebSocket connection errors (we provide a mock)
      }
      // Pass all other errors through
      return originalConsoleError(...args);
    };
  }

  // IMMEDIATE: Setup WebSocket mock for tests that use log streaming
  // This prevents actual WebSocket connection attempts during testing
  if (typeof window !== 'undefined' && typeof (window as any).WebSocket === 'undefined') {
    class MockWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      readyState = MockWebSocket.CLOSED;
      onopen: ((event: any) => void) | null = null;
      onclose: ((event: any) => void) | null = null;
      onerror: ((event: any) => void) | null = null;
      onmessage: ((event: any) => void) | null = null;

      constructor(public url: string) {
        // Simulate immediate connection failure in test environment
        setTimeout(() => {
          this.readyState = MockWebSocket.CLOSED;
          if (this.onerror) {
            this.onerror({ type: 'error', target: this });
          }
          if (this.onclose) {
            this.onclose({ type: 'close', code: 1006, reason: 'Test environment', wasClean: false });
          }
        }, 0);
      }

      send(_data: any): void {
        // No-op in test environment
      }

      close(code?: number, reason?: string): void {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) {
          this.onclose({ type: 'close', code: code || 1000, reason: reason || '', wasClean: true });
        }
      }

      addEventListener(type: string, listener: any): void {
        if (type === 'open') this.onopen = listener;
        if (type === 'close') this.onclose = listener;
        if (type === 'error') this.onerror = listener;
        if (type === 'message') this.onmessage = listener;
      }

      removeEventListener(type: string, listener: any): void {
        if (type === 'open' && this.onopen === listener) this.onopen = null;
        if (type === 'close' && this.onclose === listener) this.onclose = null;
        if (type === 'error' && this.onerror === listener) this.onerror = null;
        if (type === 'message' && this.onmessage === listener) this.onmessage = null;
      }
    }

    (window as any).WebSocket = MockWebSocket;
  }

  // IMMEDIATE: Setup Monaco Editor mock before any component initialization
  // This prevents "Monaco editor is not loaded" errors during test setup
  const monacoMock = {
    editor: {
      create: () => ({
        getValue: () => '',
        setValue: () => {},
        updateOptions: () => {},
        layout: () => {},
        focus: () => {},
        dispose: () => {},
        onDidChangeModelContent: () => ({ dispose: () => {} }),
        onDidBlurEditorText: () => ({ dispose: () => {} }),
        setModel: () => {},
      }),
      createModel: () => ({}),
      getModel: () => null,
      setTheme: () => {},
    },
    Uri: {
      parse: (uri: string) => ({ toString: () => uri }),
    },
    languages: {
      yaml: {
        yamlDefaults: {
          setDiagnosticsOptions: () => {},
        },
      },
    },
  };

  (window as any).monaco = monacoMock;

  // Mock the AMD require function used by Chart Values Editor
  (window as any).require = (modules: string[], callback: () => void) => {
    // Immediately call callback for YAML language support
    if (modules.includes('vs/language/yaml/monaco.contribution')) {
      setTimeout(callback, 0);
    }
  };
  (window as any).require.config = () => {};
}

import '@angular/compiler';
import { provideZonelessChangeDetection, NgModule } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
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

// Polyfill: Canvas context for Chart.js components
// happy-dom (test environment) has limited canvas support, so we need to mock getContext
// This allows Chart.js to create charts during testing without the warning:
// "Failed to create chart: can't acquire context from the given item"
if (typeof HTMLCanvasElement !== 'undefined') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (
    contextType: string,
    ...args: any[]
  ): any {
    // First try to use the native implementation
    if (originalGetContext) {
      const context = originalGetContext.call(this, contextType, ...args);
      if (context) {
        return context;
      }
    }

    // Fallback: Mock canvas context for 2d and webgl contexts
    // This allows Chart.js to initialize without errors in test environment
    if (contextType === '2d') {
      return createMockCanvasContext2D();
    } else if (contextType === 'webgl' || contextType === 'experimental-webgl') {
      return createMockWebGLContext();
    }

    return null;
  };
}

// Create a mock 2D canvas context for Chart.js
function createMockCanvasContext2D(): CanvasRenderingContext2D {
  return {
    fillRect: () => { },
    clearRect: () => { },
    getImageData: () => ({ data: new Uint8ClampedArray() } as ImageData),
    putImageData: () => { },
    createImageData: () => ({ data: new Uint8ClampedArray() } as ImageData),
    setTransform: () => { },
    drawImage: () => { },
    save: () => { },
    fillText: () => { },
    restore: () => { },
    beginPath: () => { },
    moveTo: () => { },
    lineTo: () => { },
    closePath: () => { },
    stroke: () => { },
    translate: () => { },
    scale: () => { },
    rotate: () => { },
    arc: () => { },
    fill: () => { },
    measureText: () => ({ width: 0 } as TextMetrics),
    transform: () => { },
    rect: () => { },
    clip: () => { },
    createLinearGradient: () => ({ addColorStop: () => { } } as CanvasGradient),
    createPattern: () => null as any,
    createRadialGradient: () => ({ addColorStop: () => { } } as CanvasGradient),
    arcTo: () => { },
    canvas: {} as HTMLCanvasElement,
    fillStyle: '',
    font: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    lineCap: 'butt',
    lineJoin: 'miter',
    lineWidth: 1,
    miterLimit: 10,
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    strokeStyle: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    direction: 'ltr',
    filter: 'none',
  } as unknown as CanvasRenderingContext2D;
}

// Create a mock WebGL context
function createMockWebGLContext(): WebGLRenderingContext {
  return {
    getParameter: () => null,
    getSupportedExtensions: () => [],
    getExtension: () => null,
  } as unknown as WebGLRenderingContext;
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
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideHttpClientTesting(),
  ],
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
