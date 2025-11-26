// Vitest + Angular testing setup (Zoneless - Angular 20)
// Official configuration from https://analogjs.org/docs/features/testing/vitest

import { expect, describe, it, afterEach } from 'vitest';
// IMMEDIATE: Expose vitest globals to window for entity-catalog test detection
// This MUST happen before any Angular/Store imports that check window.describe
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).describe = describe;
  (window as unknown as Record<string, unknown>).it = it;
  (window as unknown as Record<string, unknown>).expect = expect;
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
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null as ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null,
      addListener: () => { }, // deprecated but still used by some code
      removeListener: () => { }, // deprecated but still used by some code
      addEventListener: () => { },
      removeEventListener: () => { },
      dispatchEvent: () => true,
    }),
  });
}

// Mock Monaco editor for tests
// Components that use Monaco editor expect a global monaco object
if (typeof (window as unknown as Record<string, unknown>).monaco === 'undefined') {
  const mockEditor = {
    getValue: () => '',
    setValue: (value: string) => { },
    updateOptions: (options: any) => { },
    layout: () => { },
    focus: () => { },
    dispose: () => { },
    onDidChangeModelContent: (callback: any) => ({ dispose: () => { } }),
    onDidBlurEditorText: (callback: any) => ({ dispose: () => { } }),
    setModel: (model: any) => { },
  };

  (window as unknown as Record<string, unknown>).monaco = {
    editor: {
      create: () => mockEditor,
      getModel: (): null => null,
      createModel: () => ({}),
      setTheme: () => { },
    },
    Uri: {
      parse: (uri: string) => ({ toString: () => uri }),
    },
    languages: {
      yaml: {
        yamlDefaults: {
          setDiagnosticsOptions: () => { },
        },
      },
    },
  };

  // Mock require for YAML language support
  (window as unknown as Record<string, unknown>).require = (deps: string[], callback: () => void): void => {
    // Immediately invoke callback for YAML language support
    if (deps.includes('vs/language/yaml/monaco.contribution')) {
      setTimeout(callback, 0);
    }
  };
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
});


// Setup snapshots AFTER TestBed initialization
// expect must be available globally before setup-snapshots tries to use it
import('@analogjs/vitest-angular/setup-snapshots').catch(() => {
  // Silently ignore if setup-snapshots not available (older AnalogJS versions)
});
